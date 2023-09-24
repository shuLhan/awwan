// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"fmt"
	"io"
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

	stdout io.Writer
	stderr io.Writer

	// dirTmp temporary directory for sudoGet or sudoPut operations.
	dirTmp string
}

// newSshClient create new clients using the SSH config section.
// The stdout parameter define the writer where output from server will be
// written.
// The stderr parameter define the writer where error from server will be
// written.
//
// Once connection established, the client create new temporary directory on
// server at dirTmp for sudoGet or sudoPut operations.
func newSshClient(section *config.Section, dirTmp string, stdout, stderr io.Writer) (sshc *sshClient, err error) {
	var logp = `newSshClient`

	fmt.Fprintf(stdout, "--- SSH connection: %s@%s:%s\n",
		section.User(), section.Hostname(), section.Port())

	fmt.Fprintf(stdout, "--- SSH identity file: %v\n", section.IdentityFile)

	sshc = &sshClient{
		section: section,
		stdout:  stdout,
		stderr:  stderr,
		dirTmp:  dirTmp,
	}

	sshc.conn, err = ssh.NewClientInteractive(section)
	if err != nil {
		return nil, err
	}
	sshc.conn.SetSessionOutputError(stdout, stderr)

	// Try initialize the sftp client.
	sshc.sftpc, err = sftp.NewClient(sshc.conn.Client)
	if err != nil {
		fmt.Fprintf(stderr, "%s: %s\n", logp, err)
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
func (sshc *sshClient) rmdirAll(dir string) {
	var (
		rmdirStmt = fmt.Sprintf(`rm -rf %s`, dir)

		err error
	)

	err = sshc.conn.Execute(rmdirStmt)
	if err != nil {
		fmt.Fprintf(sshc.stderr, "rmdirAll: %s: %s\n", dir, err)
	}
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
