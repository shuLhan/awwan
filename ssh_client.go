// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io/fs"
	"path/filepath"
	"strings"

	"git.sr.ht/~shulhan/pakakeh.go/lib/ssh"
	"git.sr.ht/~shulhan/pakakeh.go/lib/ssh/sftp"
	"git.sr.ht/~shulhan/pakakeh.go/lib/sshconfig"
)

// sshClient contains clients for SSH and SFTP (SSH File Transport Protocol
// v3).
// The sftp client is for transfering file, put or get, to or from remote
// server.
// If the remote server does not support SFTP, it will fallback to use scp
// command using SSH connection.
type sshClient struct {
	section *sshconfig.Section

	conn  *ssh.Client
	sftpc *sftp.Client

	// dirTmp temporary directory for sudoGet or sudoPut operations.
	dirTmp string

	// dirHome define the remote user home directory.
	dirHome string
}

// newSSHClient create new SSH client using the SSH config section.
//
// Once connection established, the client create new temporary directory on
// server at dirTmp for sudoGet or sudoPut operations.
func newSSHClient(req *ExecRequest, section *sshconfig.Section) (sshc *sshClient, err error) {
	var logp = `newSSHClient`

	req.mlog.Outf(`--- SSH connection: %s@%s:%s`,
		section.User(), section.Hostname(), section.Port())

	req.mlog.Outf(`--- SSH identity file: %v`, section.IdentityFile)

	sshc = &sshClient{
		section: section,
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

	// Get the remote user's home directory.
	var stdout []byte
	stdout, _, err = sshc.conn.Output(`pwd`)
	if err != nil {
		return nil, err
	}

	sshc.dirHome = string(bytes.TrimSpace(stdout))
	sshc.dirTmp = strings.Replace(defTmpDirPlay, `~`, sshc.dirHome, 1)

	err = sshc.mkdir(context.Background(), sshc.dirTmp, 0700)
	if err != nil {
		return nil, err
	}

	return sshc, nil
}

// chmod change the remoteFile permission.
func (sshc *sshClient) chmod(ctx context.Context, remoteFile string, perm fs.FileMode) (err error) {
	var chmodStmt = fmt.Sprintf(`chmod %o %q`, perm, remoteFile)

	err = sshc.conn.Execute(ctx, chmodStmt)
	if err != nil {
		return err
	}
	return nil
}

// chown change the owner of remoteFile.
// The owner parameter can be set to user only "user", group only
// ":group", or user and group "user:group".
func (sshc *sshClient) chown(ctx context.Context, remoteFile, owner string) (err error) {
	var chownStmt = fmt.Sprintf(`chown %s %q`, owner, remoteFile)

	err = sshc.conn.Execute(ctx, chownStmt)
	if err != nil {
		return err
	}
	return nil
}

// close the connections and release all resources.
func (sshc *sshClient) close() (err error) {
	var errClose error

	if sshc.sftpc != nil {
		errClose = sshc.sftpc.Close()
		if errClose != nil {
			err = errors.Join(err, errClose)
		}
		sshc.sftpc = nil
	}

	errClose = sshc.conn.Close()
	if errClose != nil {
		err = errors.Join(err, errClose)
	}
	sshc.conn = nil
	sshc.section = nil

	return err
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
func (sshc *sshClient) mkdir(ctx context.Context, dir string, permission uint32) (err error) {
	if sshc.sftpc == nil {
		var mkdirStmt = fmt.Sprintf(`mkdir -p %s`, dir)

		err = sshc.conn.Execute(ctx, mkdirStmt)
	} else {
		var fa = sftp.FileAttrs{}

		fa.SetPermissions(permission)
		err = sshc.sftpc.MkdirAll(dir, &fa)
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
func (sshc *sshClient) rmdirAll(ctx context.Context, dir string) (err error) {
	var rmdirStmt = fmt.Sprintf(`rm -rf %s`, dir)

	err = sshc.conn.Execute(ctx, rmdirStmt)
	if err != nil {
		return fmt.Errorf(`rmdirAll: %s: %w`, dir, err)
	}

	return nil
}

// sudoChmod change the permission of remoteFile using sudo.
func (sshc *sshClient) sudoChmod(ctx context.Context, remoteFile string, mode fs.FileMode) (err error) {
	var cmd = fmt.Sprintf(`sudo chmod %o %q`, mode, remoteFile)

	err = sshc.conn.Execute(ctx, cmd)
	if err != nil {
		return err
	}
	return nil

}

// sudoChown change the owner of remoteFile using sudo.
func (sshc *sshClient) sudoChown(ctx context.Context, remoteFile, owner string) (err error) {
	var cmd = fmt.Sprintf(`sudo chown %s %q`, owner, remoteFile)

	err = sshc.conn.Execute(ctx, cmd)
	if err != nil {
		return err
	}
	return nil
}

// sudoGet copy the remote file using sudo to local.
// The remote file is copied to temporary directory first, chmod-ed to
// current SSH user so it can be read.
// The temporary file then copied from remote to local.
func (sshc *sshClient) sudoGet(ctx context.Context, remote, local string) (err error) {
	var (
		remoteBase    = filepath.Base(remote)
		remoteTmp     = filepath.Join(sshc.dirTmp, remoteBase)
		cpRemoteToTmp = fmt.Sprintf(`sudo cp -f %s %s`, remote, remoteTmp)
	)

	err = sshc.conn.Execute(ctx, cpRemoteToTmp)
	if err != nil {
		return err
	}

	var chmod = fmt.Sprintf(`sudo chown %s %s`, sshc.section.User(), remoteTmp)

	err = sshc.conn.Execute(ctx, chmod)
	if err != nil {
		return err
	}

	err = sshc.get(remoteTmp, local)
	return err
}

// sudoPut copy local file to remote using sudo.
// The file from local copied to remote in temporary directory first, and
// then the temporary file moved to original destination using sudo.
func (sshc *sshClient) sudoPut(ctx context.Context, local, remote string) (err error) {
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

	err = sshc.conn.Execute(ctx, moveStmt)
	return err
}
