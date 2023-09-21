// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"crypto/rsa"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/shuLhan/share/lib/ascii"
	"github.com/shuLhan/share/lib/ini"
	libos "github.com/shuLhan/share/lib/os"
	"github.com/shuLhan/share/lib/ssh"
	"github.com/shuLhan/share/lib/ssh/config"
	"github.com/shuLhan/share/lib/ssh/sftp"
)

// Session manage and cache SSH client and list of scripts.
// One session have one SSH client, but may contains more than one script.
type Session struct {
	privateKey *rsa.PrivateKey
	sftpc      *sftp.Client
	sshClient  *ssh.Client

	vars ini.Ini

	BaseDir   string
	ScriptDir string

	SSHKey  string // The value of "IdentityFile" in SSH config.
	SSHUser string // The value of "User" in SSH config.
	SSHHost string // The value of "Hostname" in configuration.
	SSHPort string // The value of "Port" in configuration.

	hostname string
	tmpDir   string
	paths    []string
}

// NewSession create and initialize the new session based on Awwan base
// directory and the session directory.
func NewSession(aww *Awwan, sessionDir string) (ses *Session, err error) {
	var (
		logp = "newSession"

		randomString string
	)

	ses = &Session{
		privateKey: aww.privateKey,

		BaseDir:   aww.BaseDir,
		ScriptDir: sessionDir,
		hostname:  filepath.Base(sessionDir),
	}

	err = ses.generatePaths()
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	randomString = string(ascii.Random([]byte(ascii.LettersNumber), 16))
	ses.tmpDir = filepath.Join(defTmpDir, randomString)

	return ses, nil
}

// Subs return list of sub sections that have the same section name.
func (ses *Session) Subs(secName string) (subs []*ini.Section) {
	return ses.vars.Subs(secName)
}

// Vars return all variables in section and/or subsection as map of string.
func (ses *Session) Vars(path string) (vars map[string]string) {
	return ses.vars.Vars(path)
}

// Val return the last variable value defined in key path.
func (ses *Session) Val(keyPath string) string {
	return ses.vars.Val(keyPath)
}

// Vals return all variable values as slice of string.
func (ses *Session) Vals(keyPath string) []string {
	return ses.vars.Vals(keyPath)
}

// Copy file in local system.
func (ses *Session) Copy(stmt *Statement) (err error) {
	var (
		logp = "Copy"

		src  string
		dest string
	)

	if len(stmt.cmd) == 0 {
		return fmt.Errorf("%s: missing source argument", logp)
	}
	if len(stmt.args) == 0 {
		return fmt.Errorf("%s: missing destination argument", logp)
	}
	if len(stmt.args) > 1 {
		return fmt.Errorf("%s: two or more destination arguments is given", logp)
	}

	src, err = parseTemplate(ses, stmt.cmd)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	dest = stmt.args[0]

	err = libos.Copy(dest, src)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}
	return nil
}

// Get copy file from remote to local.
func (ses *Session) Get(stmt *Statement) (err error) {
	var (
		logp = "Get"

		remote string
		local  string
	)

	if len(stmt.cmd) == 0 {
		return fmt.Errorf("%s: missing source argument", logp)
	}
	if len(stmt.args) == 0 {
		return fmt.Errorf("%s: missing destination argument", logp)
	}
	if len(stmt.args) > 1 {
		return fmt.Errorf("%s: two or more destination arguments is given", logp)
	}

	remote = stmt.cmd
	local = stmt.args[0]

	if ses.sftpc == nil {
		err = ses.sshClient.ScpGet(remote, local)
	} else {
		err = ses.sftpc.Get(remote, local)
	}
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}
	return nil
}

// Put copy file from local to remote system.
func (ses *Session) Put(stmt *Statement) (err error) {
	var (
		logp = "Put"

		local  string
		remote string
	)

	if len(stmt.cmd) == 0 {
		return fmt.Errorf("%s: missing source argument", logp)
	}
	if len(stmt.args) == 0 {
		return fmt.Errorf("%s: missing destination argument", logp)
	}
	if len(stmt.args) > 1 {
		return fmt.Errorf("%s: two or more destination arguments is given", logp)
	}

	local, err = parseTemplate(ses, stmt.cmd)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	remote = stmt.args[0]

	if ses.sftpc == nil {
		err = ses.sshClient.ScpPut(local, remote)
	} else {
		err = ses.sftpc.Put(local, remote)
	}
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}
	return nil
}

// SudoCopy copy file in local system using sudo.
func (ses *Session) SudoCopy(req *Request, stmt *Statement, withParseInput bool) (err error) {
	var (
		logp = "SudoCopy"

		sudoCp *Statement
		src    string
	)

	if len(stmt.cmd) == 0 {
		return fmt.Errorf("%s: missing source argument", logp)
	}
	if len(stmt.args) == 0 {
		return fmt.Errorf("%s: missing destination argument", logp)
	}
	if len(stmt.args) > 1 {
		return fmt.Errorf("%s: two or more destination arguments is given", logp)
	}

	if withParseInput {
		src, err = parseTemplate(ses, stmt.cmd)
		if err != nil {
			return fmt.Errorf("%s: %w", logp, err)
		}
	} else {
		src = stmt.cmd
	}

	sudoCp = &Statement{
		kind: statementKindDefault,
		cmd:  "sudo",
		args: []string{"cp", src, stmt.args[0]},
		raw:  []byte("sudo cp " + src + " " + stmt.args[0]),
	}

	err = ses.ExecLocal(req, sudoCp)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}
	return nil
}

// SudoGet copy file from remote that can be accessed by root on remote, to
// local.
func (ses *Session) SudoGet(stmt *Statement) (err error) {
	var (
		logp = "SudoGet"

		remoteSrc     string
		remoteBase    string
		remoteTmp     string
		cpRemoteToTmp string
		chmod         string
		local         string
	)

	if len(stmt.cmd) == 0 {
		return fmt.Errorf("%s: missing source argument", logp)
	}
	if len(stmt.args) == 0 {
		return fmt.Errorf("%s: missing destination argument", logp)
	}
	if len(stmt.args) > 1 {
		return fmt.Errorf("%s: two or more destination arguments is given", logp)
	}

	// Copy file in the remote to temporary directory first, so user can
	// read them.
	remoteSrc = stmt.cmd
	remoteBase = filepath.Base(remoteSrc)
	remoteTmp = filepath.Join(ses.tmpDir, remoteBase)

	cpRemoteToTmp = fmt.Sprintf("sudo cp -f %s %s", remoteSrc, remoteTmp)

	err = ses.sshClient.Execute(cpRemoteToTmp)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	chmod = fmt.Sprintf("sudo chown %s %s", ses.SSHUser, remoteTmp)

	err = ses.sshClient.Execute(chmod)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	// Get temporary file in the remote to local.
	local = stmt.args[0]
	if ses.sftpc == nil {
		err = ses.sshClient.ScpGet(remoteTmp, local)
	} else {
		err = ses.sftpc.Get(remoteTmp, local)
	}
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}
	return nil
}

// SudoPut copy file from local to remote using sudo.
func (ses *Session) SudoPut(stmt *Statement) (err error) {
	var (
		logp = "SudoPut"

		local    string
		baseName string
		tmp      string
		remote   string
		moveStmt string
	)

	if len(stmt.cmd) == 0 {
		return fmt.Errorf("%s: missing source argument", logp)
	}
	if len(stmt.args) == 0 {
		return fmt.Errorf("%s: missing destination argument", logp)
	}
	if len(stmt.args) > 1 {
		return fmt.Errorf("%s: two or more destination arguments is given", logp)
	}

	// Apply the session variables into local file to be copied first, and
	// save them into cache directory.
	local, err = parseTemplate(ses, stmt.cmd)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	baseName = filepath.Base(stmt.cmd)

	// Copy file from local to temporary directory first in remote.
	tmp = filepath.Join(ses.tmpDir, baseName)
	remote = string(stmt.args[0])

	if ses.sftpc == nil {
		err = ses.sshClient.ScpPut(local, tmp)
	} else {
		err = ses.sftpc.Put(local, tmp)
	}
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	// Finally, move the file from the temporary directory to original
	// destination.
	moveStmt = fmt.Sprintf("sudo mv -f %s %s", tmp, remote)

	return ses.sshClient.Execute(moveStmt)
}

// ExecLocal execute the command with its arguments in local environment where
// the output and error send to os.Stdout and os.Stderr respectively.
func (ses *Session) ExecLocal(req *Request, stmt *Statement) (err error) {
	var (
		args = string(stmt.raw)
		cmd  = exec.Command(`/bin/sh`, `-c`, args)
	)
	cmd.Stdout = req.stdout
	cmd.Stderr = req.stderr
	return cmd.Run()
}

// executeRequires run the "#require:" statements from line 0 until
// the start argument in the local system.
func (ses *Session) executeRequires(req *Request, pos linePosition) (err error) {
	var (
		stmt *Statement
		x    int64
	)

	for x = 0; x <= pos.start; x++ {
		stmt = req.script.requires[x]
		if stmt == nil {
			continue
		}

		fmt.Fprintf(req.stdout, "--- require %d: %v\n", x, stmt)

		err = ses.ExecLocal(req, stmt)
		if err != nil {
			return err
		}
	}
	return nil
}

func (ses *Session) executeScriptOnLocal(req *Request, pos linePosition) {
	var max = int64(len(req.script.stmts))
	if pos.start > max {
		return
	}
	if pos.end == 0 {
		pos.end = max - 1
	}

	for x := pos.start; x <= pos.end; x++ {
		stmt := req.script.stmts[x]
		if stmt == nil {
			continue
		}
		if stmt.kind == statementKindComment {
			continue
		}
		if stmt.kind == statementKindRequire {
			continue
		}

		fmt.Fprintf(req.stdout, "\n--> local: %3d: %s\n", x, stmt.raw)

		var err error
		switch stmt.kind {
		case statementKindDefault:
			err = ses.ExecLocal(req, stmt)
		case statementKindGet:
			err = ses.Copy(stmt)
		case statementKindPut:
			err = ses.Copy(stmt)
		case statementKindSudoGet:
			err = ses.SudoCopy(req, stmt, false)
		case statementKindSudoPut:
			err = ses.SudoCopy(req, stmt, true)
		}
		if err != nil {
			fmt.Fprintf(req.stderr, "!!! %s\n", err)
			break
		}
	}
}

func (ses *Session) executeScriptOnRemote(req *Request, pos linePosition) {
	var max = int64(len(req.script.stmts))
	if pos.start > max {
		return
	}
	if pos.end == 0 {
		pos.end = max - 1
	}

	for x := pos.start; x <= pos.end; x++ {
		stmt := req.script.stmts[x]
		if stmt == nil {
			continue
		}
		if stmt.kind == statementKindComment {
			continue
		}
		if stmt.kind == statementKindRequire {
			continue
		}

		fmt.Fprintf(req.stdout, "\n--> %s: %3d: %s %s\n",
			ses.sshClient, x, stmt.cmd, stmt.args)

		var err error
		switch stmt.kind {
		case statementKindDefault:
			err = ses.sshClient.Execute(string(stmt.raw))
		case statementKindGet:
			err = ses.Get(stmt)
		case statementKindPut:
			err = ses.Put(stmt)
		case statementKindSudoGet:
			err = ses.SudoGet(stmt)
		case statementKindSudoPut:
			err = ses.SudoPut(stmt)
		}
		if err != nil {
			fmt.Fprintf(req.stderr, "!!! %s\n", err)
			break
		}
	}
}

// generatePaths using baseDir return all paths from BaseDir to ScriptDir.
func (ses *Session) generatePaths() (err error) {
	logp := "generatePaths"

	absScriptDir, err := filepath.Abs(ses.ScriptDir)
	if err != nil {
		return fmt.Errorf("%s: %s: %w", logp, absScriptDir, err)
	}

	if !strings.HasPrefix(absScriptDir, ses.BaseDir) {
		return fmt.Errorf("%s: %q must be under %q", logp, ses.ScriptDir, ses.BaseDir)
	}

	rel, err := filepath.Rel(ses.BaseDir, absScriptDir)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	subs := strings.Split(rel, string(os.PathSeparator))
	path := ses.BaseDir

	ses.paths = make([]string, 0, len(subs)+1)
	ses.paths = append(ses.paths, path)

	for x := 0; x < len(subs); x++ {
		if subs[x] == "." || subs[x] == "" {
			continue
		}
		path = filepath.Join(path, subs[x])
		ses.paths = append(ses.paths, path)
	}
	return nil
}

func (ses *Session) initSSHClient(req *Request, sshSection *config.Section) (err error) {
	var (
		logp          = "initSSHClient"
		lastIdentFile string
	)

	if len(sshSection.IdentityFile) > 0 {
		lastIdentFile = sshSection.IdentityFile[len(sshSection.IdentityFile)-1]
	}

	fmt.Fprintf(req.stdout, "--- SSH connection: %s@%s:%s\n", sshSection.User(), sshSection.Hostname(), sshSection.Port())
	fmt.Fprintf(req.stdout, "--- SSH identity file: %v\n", sshSection.IdentityFile)

	ses.sshClient, err = ssh.NewClientInteractive(sshSection)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	// Try initialize the sftp client.
	ses.sftpc, err = sftp.NewClient(ses.sshClient.Client)
	if err != nil {
		fmt.Fprintf(req.stderr, "%s: %s\n", logp, err)
	}

	ses.sshClient.SetSessionOutputError(req.stdout, req.stderr)

	ses.SSHKey = lastIdentFile
	ses.SSHUser = sshSection.User()
	ses.SSHHost = sshSection.Hostname()
	ses.SSHPort = sshSection.Port()

	return nil
}

// loadEnvFromPaths load environment file from each directory in paths.
func (ses *Session) loadEnvFromPaths() (err error) {
	var (
		logp = "loadEnvFromPaths"

		path     string
		awwanEnv string
	)

	for _, path = range ses.paths {
		// Load unencrypted "awwan.env".
		awwanEnv = filepath.Join(path, defEnvFileName)

		err = ses.loadFileEnv(awwanEnv, false)
		if err != nil {
			return fmt.Errorf(`%s: %w`, logp, err)
		}

		// Load encrypted ".awwan.env.vault".
		awwanEnv = filepath.Join(path, defFileEnvVault)

		err = ses.loadFileEnv(awwanEnv, true)
		if err != nil {
			return fmt.Errorf(`%s: %w`, logp, err)
		}
	}
	return nil
}

func (ses *Session) loadFileEnv(awwanEnv string, isVault bool) (err error) {
	var content []byte

	content, err = os.ReadFile(awwanEnv)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return fmt.Errorf(`%s: %w`, awwanEnv, err)
	}

	fmt.Printf("--- loading %q ...\n", awwanEnv)

	if isVault {
		content, err = decrypt(ses.privateKey, content)
		if err != nil {
			return err
		}
	}

	err = ses.loadRawEnv(content)
	if err != nil {
		return err
	}

	return nil
}

func (ses *Session) loadRawEnv(content []byte) (err error) {
	var in *ini.Ini

	in, err = ini.Parse(content)
	if err != nil {
		return err
	}

	in.Prune()
	ses.vars.Rebase(in)

	return nil
}
