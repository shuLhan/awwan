// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package awwan

import (
	"fmt"
	"io/ioutil"
	"log"
	"math/rand"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/shuLhan/share/lib/ascii"
	"github.com/shuLhan/share/lib/ini"
	libio "github.com/shuLhan/share/lib/io"
	"github.com/shuLhan/share/lib/ssh"
	"github.com/shuLhan/share/lib/ssh/config"
	"github.com/shuLhan/share/lib/ssh/sftp"
)

//
// Session manage and cache SSH client and list of scripts.
// One session have one SSH client, but may contains more than one script.
//
type Session struct {
	BaseDir   string
	ScriptDir string

	SSHKey  string // The value of "IdentityFile" in SSH config.
	SSHUser string // The value of "User" in SSH config.
	SSHHost string // The value of "Hostname" in configuration.
	SSHPort string // The value of "Port" in configuration.

	hostname string
	paths    []string
	tmpDir   string
	vars     *ini.Ini

	sshClient *ssh.Client
	sftpc     *sftp.Client
}

//
// NewSession create and initialize the new session based on Awwan base
// directory and the session directory.
//
func NewSession(baseDir, sessionDir string) (ses *Session, err error) {
	logp := "newSession"

	ses = &Session{
		BaseDir:   baseDir,
		ScriptDir: sessionDir,
		hostname:  filepath.Base(sessionDir),
	}

	err = ses.generatePaths()
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	rand.Seed(time.Now().Unix())
	randomString := string(ascii.Random([]byte(ascii.LettersNumber), 16))
	ses.tmpDir = filepath.Join("/tmp", randomString)

	return ses, nil
}

//
// Subs return list of sub sections that have the same section name.
//
func (ses *Session) Subs(secName string) (subs []*ini.Section) {
	return ses.vars.Subs(secName)
}

//
// Vars return all variables in section and/or subsection as map of string.
//
func (ses *Session) Vars(path string) (vars map[string]string) {
	return ses.vars.Vars(path)
}

//
// Val return the last variable value defined in key path.
//
func (ses *Session) Val(keyPath string) string {
	return ses.vars.Val(keyPath)
}

//
// Vals return all variable values as slice of string.
//
func (ses *Session) Vals(keyPath string) []string {
	return ses.vars.Vals(keyPath)
}

//
// Copy file in local system.
//
func (ses *Session) Copy(stmt *Statement) (err error) {
	logp := "Copy"
	if len(stmt.cmd) == 0 {
		return fmt.Errorf("%s: missing source argument", logp)
	}
	if len(stmt.args) == 0 {
		return fmt.Errorf("%s: missing destination argument", logp)
	}
	if len(stmt.args) > 1 {
		return fmt.Errorf("%s: two or more destination arguments is given", logp)
	}

	src, err := parseTemplate(ses, stmt.cmd)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	dest := stmt.args[0]

	err = libio.Copy(dest, src)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}
	return nil
}

//
// Get copy file from remote to local.
//
func (ses *Session) Get(stmt *Statement) (err error) {
	logp := "Get"
	if len(stmt.cmd) == 0 {
		return fmt.Errorf("%s: missing source argument", logp)
	}
	if len(stmt.args) == 0 {
		return fmt.Errorf("%s: missing destination argument", logp)
	}
	if len(stmt.args) > 1 {
		return fmt.Errorf("%s: two or more destination arguments is given", logp)
	}

	remote := stmt.cmd
	local := stmt.args[0]

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

//
// Put copy file from local to remote system.
//
func (ses *Session) Put(stmt *Statement) (err error) {
	logp := "Put"
	if len(stmt.cmd) == 0 {
		return fmt.Errorf("%s: missing source argument", logp)
	}
	if len(stmt.args) == 0 {
		return fmt.Errorf("%s: missing destination argument", logp)
	}
	if len(stmt.args) > 1 {
		return fmt.Errorf("%s: two or more destination arguments is given", logp)
	}

	local, err := parseTemplate(ses, stmt.cmd)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	remote := stmt.args[0]

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

//
// SudoCopy copy file in local system using sudo.
//
func (ses *Session) SudoCopy(stmt *Statement) (err error) {
	logp := "SudoCopy"
	if len(stmt.cmd) == 0 {
		return fmt.Errorf("%s: missing source argument", logp)
	}
	if len(stmt.args) == 0 {
		return fmt.Errorf("%s: missing destination argument", logp)
	}
	if len(stmt.args) > 1 {
		return fmt.Errorf("%s: two or more destination arguments is given", logp)
	}

	src, err := parseTemplate(ses, stmt.cmd)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	sudoCp := &Statement{
		kind: statementKindDefault,
		cmd:  "sudo",
		args: []string{"cp", src, stmt.args[0]},
	}

	err = sudoCp.ExecLocal()
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}
	return nil
}

//
// SudoGet copy file from remote that can be accessed by root on remote, to
// local.
//
func (ses *Session) SudoGet(stmt *Statement) (err error) {
	logp := "SudoGet"
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
	remoteSrc := stmt.cmd
	remoteBase := filepath.Base(remoteSrc)
	remoteTmp := filepath.Join(ses.tmpDir, remoteBase)

	cpRemoteToTmp := fmt.Sprintf("sudo cp -f %s %s", remoteSrc, remoteTmp)

	err = ses.sshClient.Execute(cpRemoteToTmp)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	chmod := fmt.Sprintf("sudo chown %s %s", ses.SSHUser, remoteTmp)

	err = ses.sshClient.Execute(chmod)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	// Get temporary file in the remote to local.
	local := stmt.args[0]
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

//
// SudoPut copy file from local to remote using sudo.
//
func (ses *Session) SudoPut(stmt *Statement) (err error) {
	logp := "SudoPut"
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
	local, err := parseTemplate(ses, stmt.cmd)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	baseName := filepath.Base(stmt.cmd)

	// Copy file from local to temporary directory first in remote.
	tmp := filepath.Join(ses.tmpDir, baseName)
	remote := string(stmt.args[0])

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
	moveStmt := fmt.Sprintf("sudo mv -f %s %s", tmp, remote)

	return ses.sshClient.Execute(moveStmt)
}

func (ses *Session) executeScriptOnLocal(script *Script, startAt, endAt int) {
	var err error

	for x := startAt; x <= endAt; x++ {
		stmt := script.stmts[x]
		if stmt == nil {
			continue
		}
		if stmt.kind == statementKindComment {
			continue
		}
		if stmt.kind == statementKindRequire {
			continue
		}

		log.Printf("\n>>> local: %3d: %s %s", x, stmt.cmd, stmt.args)

		switch stmt.kind {
		case statementKindDefault:
			err = stmt.ExecLocal()
		case statementKindGet:
			err = ses.Copy(stmt)
		case statementKindPut:
			err = ses.Copy(stmt)
		case statementKindSudoGet:
			err = ses.SudoCopy(stmt)
		case statementKindSudoPut:
			err = ses.SudoCopy(stmt)
		}
		if err != nil {
			log.Printf("!!! %s", err)
			break
		}
	}
}

func (ses *Session) executeScriptOnRemote(script *Script, startAt, endAt int) {
	var err error

	for x := startAt; x <= endAt; x++ {
		stmt := script.stmts[x]
		if stmt == nil {
			continue
		}
		if stmt.kind == statementKindComment {
			continue
		}
		if stmt.kind == statementKindRequire {
			continue
		}

		log.Printf("\n>>> %s: %3d: %s %s", ses.sshClient, x, stmt.cmd, stmt.args)

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
			log.Printf("!!! %s", err)
			break
		}
	}
}

//
// generatePaths using baseDir return all paths from BaseDir to ScriptDir.
//
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

func (ses *Session) initSSHClient(sshSection *config.Section) (err error) {
	var (
		logp          = "initSSHClient"
		lastIdentFile string
	)

	if len(sshSection.IdentityFile) > 0 {
		lastIdentFile = sshSection.IdentityFile[len(sshSection.IdentityFile)-1]
	}

	log.Printf("--- SSH Hostname: %s", sshSection.Hostname)
	log.Printf("--- SSH Port: %s", sshSection.Port)
	log.Printf("--- SSH User: %s", sshSection.User)
	log.Printf("--- SSH IdentityFile: %s", lastIdentFile)

	ses.sshClient, err = ssh.NewClientFromConfig(sshSection)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	// Try initialize the sftp client.
	ses.sftpc, err = sftp.NewClient(ses.sshClient.Client)
	if err != nil {
		log.Printf("%s: %s\n", logp, err)
	}

	ses.SSHKey = lastIdentFile
	ses.SSHUser = sshSection.User
	ses.SSHHost = sshSection.Hostname
	ses.SSHPort = sshSection.Port

	return nil
}

//
// loadEnvFromPaths load environment file from each directory in paths.
//
func (ses *Session) loadEnvFromPaths() (err error) {
	logp := "loadEnvFromPaths"

	for _, path := range ses.paths {
		awwanEnv := filepath.Join(path, defEnvFileName)

		content, err := ioutil.ReadFile(awwanEnv)
		if err != nil {
			if os.IsNotExist(err) {
				continue
			}
			return fmt.Errorf("%s: %s: %w", logp, awwanEnv, err)
		}

		fmt.Printf(">>> loading %q ...\n", awwanEnv)
		err = ses.loadEnvFromBytes(content)
		if err != nil {
			return fmt.Errorf("%s: %w", logp, err)
		}
	}
	return nil
}

func (ses *Session) loadEnvFromBytes(content []byte) (err error) {
	in, err := ini.Parse(content)
	if err != nil {
		return err
	}

	in.Prune()

	if ses.vars == nil {
		ses.vars = in
		return nil
	}

	ses.vars.Rebase(in)
	return nil
}
