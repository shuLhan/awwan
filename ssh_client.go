// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"fmt"
	"io/fs"
	"path/filepath"

	"github.com/shuLhan/share/lib/ascii"
	"github.com/shuLhan/share/lib/ssh"
	"github.com/shuLhan/share/lib/ssh/config"
	"github.com/shuLhan/share/lib/ssh/sftp"
)

// sshClient contains clients for SSH and SFTP (SSH File Transport Protocol
// v3).
// The sftp client is for transfering file, put or get, to or from remote
// server.
// If the remote server does not support SFTP, it will fallback to use scp
// command using SSH connection.
type sshClient struct {
	section *config.Section

	conn  *ssh.Client
	sftpc *sftp.Client

	// dirTmp temporary directory for sudoGet or sudoPut operations.
	dirTmp string
}

// newSshClient create new clients using the SSH config section.
//
// Once connection established, the client create new temporary directory on
// server at dirTmp for sudoGet or sudoPut operations.
func newSshClient(req *Request, section *config.Section, dirTmp string) (sshc *sshClient, err error) {
	var logp = `newSshClient`

	req.mlog.Outf(`--- SSH connection: %s@%s:%s`,
		section.User(), section.Hostname(), section.Port())

	req.mlog.Outf(`--- SSH identity file: %v`, section.IdentityFile)

	sshc = &sshClient{
		section: section,
		dirTmp:  dirTmp,
	}

	sshc.conn, err = ssh.NewClientInteractive(section)
	if err != nil {
		return nil, err
	}
	sshc.conn.SetSessionOutputError(req.mlog, req.mlog)

	// Try initialize the sftp client.
	sshc.sftpc, err = sftp.NewClient(sshc.conn.Client)
	if err != nil {
		req.mlog.Errf(`%s: %s`, logp, err)
	}

	if len(dirTmp) == 0 {
		var randomString = string(ascii.Random([]byte(ascii.LettersNumber), 16))
		sshc.dirTmp = filepath.Join(defTmpDir, defDirTmpPrefix+randomString)
	}

	err = sshc.mkdir(sshc.dirTmp, 0700)
	if err != nil {
		return nil, err
	}

	return sshc, nil
}

// chmod change the remoteFile permission.
func (sshc *sshClient) chmod(remoteFile string, perm fs.FileMode) (err error) {
	var chmodStmt = fmt.Sprintf(`chmod %o %q`, perm, remoteFile)

	err = sshc.conn.Execute(chmodStmt)
	if err != nil {
		return err
	}
	return nil
}

// chown change the owner of remoteFile.
// The owner parameter can be set to user only "user", group only
// ":group", or user and group "user:group".
func (sshc *sshClient) chown(remoteFile, owner string) (err error) {
	var chownStmt = fmt.Sprintf(`chown %s %q`, owner, remoteFile)

	err = sshc.conn.Execute(chownStmt)
	if err != nil {
		return err
	}
	return nil
}

// get the remote file and write it to local path.
func (sshc *sshClient) get(remote, local string) (err error) {
	if sshc.sftpc == nil {
		err = sshc.conn.ScpGet(remote, local)
	} else {
		err = sshc.sftpc.Get(remote, local)
	}
	return err
}

// mkdir create directory on the remote server.
func (sshc *sshClient) mkdir(dir string, permission uint32) (err error) {
	if sshc.sftpc == nil {
		var mkdirStmt = fmt.Sprintf(`mkdir %s`, dir)

		err = sshc.conn.Execute(mkdirStmt)
	} else {
		var fa = sftp.FileAttrs{}

		fa.SetPermissions(permission)
		err = sshc.sftpc.Mkdir(dir, &fa)
	}
	return err
}

// put the local file into remote.
func (sshc *sshClient) put(local, remote string) (err error) {
	if sshc.sftpc == nil {
		err = sshc.conn.ScpPut(local, remote)
	} else {
		err = sshc.sftpc.Put(local, remote)
	}
	return err
}

// rmdirAll remove the directory on server recursively.
func (sshc *sshClient) rmdirAll(dir string) (err error) {
	var rmdirStmt = fmt.Sprintf(`rm -rf %s`, dir)

	err = sshc.conn.Execute(rmdirStmt)
	if err != nil {
		return fmt.Errorf(`rmdirAll: %s: %w`, dir, err)
	}

	return nil
}

// sudoChmod change the permission of remoteFile using sudo.
func (sshc *sshClient) sudoChmod(remoteFile string, mode fs.FileMode) (err error) {
	var cmd = fmt.Sprintf(`sudo chmod %o %q`, mode, remoteFile)

	err = sshc.conn.Execute(cmd)
	if err != nil {
		return err
	}
	return nil

}

// sudoChown change the owner of remoteFile using sudo.
func (sshc *sshClient) sudoChown(remoteFile, owner string) (err error) {
	var cmd = fmt.Sprintf(`sudo chown %s %q`, owner, remoteFile)

	err = sshc.conn.Execute(cmd)
	if err != nil {
		return err
	}
	return nil
}

// sudoGet copy the remote file using sudo to local.
// The remote file is copied to temporary directory first, chmod-ed to
// current SSH user so it can be read.
// The temporary file then copied from remote to local.
func (sshc *sshClient) sudoGet(remote, local string) (err error) {
	var (
		remoteBase    = filepath.Base(remote)
		remoteTmp     = filepath.Join(sshc.dirTmp, remoteBase)
		cpRemoteToTmp = fmt.Sprintf(`sudo cp -f %s %s`, remote, remoteTmp)
	)

	err = sshc.conn.Execute(cpRemoteToTmp)
	if err != nil {
		return err
	}

	var chmod = fmt.Sprintf(`sudo chown %s %s`, sshc.section.User(), remoteTmp)

	err = sshc.conn.Execute(chmod)
	if err != nil {
		return err
	}

	err = sshc.get(remoteTmp, local)
	return err
}

// sudoPut copy local file to remote using sudo.
// The file from local copied to remote in temporary directory first, and
// then the temporary file moved to original destination using sudo.
func (sshc *sshClient) sudoPut(local, remote string) (err error) {
	var (
		baseName  = filepath.Base(local)
		remoteTmp = filepath.Join(sshc.dirTmp, baseName)
	)

	if sshc.sftpc == nil {
		err = sshc.conn.ScpPut(local, remoteTmp)
	} else {
		err = sshc.sftpc.Put(local, remoteTmp)
	}
	if err != nil {
		return err
	}

	var moveStmt = fmt.Sprintf(`sudo mv -f %s %s`, remoteTmp, remote)

	err = sshc.conn.Execute(moveStmt)
	return err
}
