// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package awwan

import (
	"bytes"
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
	"github.com/shuLhan/share/lib/os/exec"
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
// Copy copy file in local system.
//
func (ses *Session) Copy(stmt []byte) (err error) {
	logp := "Copy"

	stmt = bytes.TrimSpace(stmt[5:])

	paths := bytes.Fields(stmt)
	if len(paths) != 2 {
		return fmt.Errorf("%s: invalid statement: %q", logp, stmt)
	}

	src := os.ExpandEnv(string(paths[0]))

	src, err = parseTemplate(ses, src)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	dest := os.ExpandEnv(string(paths[1]))

	return libio.Copy(dest, src)
}

//
// Get copy file from remote to local.
//
// Syntax,
//
//	#get: <remote> <local>
//
func (ses *Session) Get(stmt []byte) (err error) {
	logp := "Get"

	stmt = bytes.TrimSpace(stmt[5:])

	paths := bytes.Fields(stmt)
	if len(paths) != 2 {
		err = fmt.Errorf("%s: invalid get statement %s", logp, stmt)
		log.Println(err)
		return err
	}

	remote := string(paths[0])
	local := string(paths[1])

	if ses.sftpc == nil {
		return ses.sshClient.ScpGet(remote, local)
	}
	return ses.sftpc.Get(remote, local)
}

//
// Put copy file from local to remote system.
//
// Syntax,
//
//	#put: <local> <remote>
//
func (ses *Session) Put(stmt []byte) (err error) {
	logp := "Put"

	stmt = bytes.TrimSpace(stmt[5:])

	paths := bytes.Fields(stmt)
	if len(paths) != 2 {
		return fmt.Errorf("%s: invalid statement: %q", logp, stmt)
	}

	local, err := parseTemplate(ses, string(paths[0]))
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	remote := string(paths[1])

	if ses.sftpc == nil {
		return ses.sshClient.ScpPut(local, remote)
	}
	return ses.sftpc.Put(local, remote)
}

//
// SudoCopy copy file in local system using sudo.
//
func (ses *Session) SudoCopy(stmt []byte) (err error) {
	logp := "SudoCopy"

	stmt = bytes.TrimSpace(stmt[5:])

	paths := bytes.Fields(stmt)
	if len(paths) != 2 {
		return fmt.Errorf("%s: invalid statement: %q", logp, stmt)
	}

	src := os.ExpandEnv(string(paths[0]))
	baseName := filepath.Base(src)

	local, err := parseTemplate(ses, src)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	tmp := filepath.Join(ses.tmpDir, baseName)
	remote := os.ExpandEnv(string(paths[1]))

	err = libio.Copy(tmp, local)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	moveStmt := fmt.Sprintf("sudo mv %s %s", tmp, remote)

	return exec.Run(moveStmt, os.Stdout, os.Stderr)
}

//
// SudoGet copy file from remote that can be accessed by root, to
// local.
//
// Syntax,
//
//	#get! <remote> <local>
//
func (ses *Session) SudoGet(stmt []byte) (err error) {
	logp := "SudoGet"

	stmt = bytes.TrimSpace(stmt[5:])

	paths := bytes.Fields(stmt)
	if len(paths) != 2 {
		err = fmt.Errorf("%s: invalid statement: %q", logp, stmt)
		log.Println(err)
		return err
	}

	remoteSrc := string(paths[0])
	remoteBase := filepath.Base(remoteSrc)
	remoteTmp := filepath.Join(ses.tmpDir, remoteBase)

	local := string(paths[1])

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

	if ses.sftpc == nil {
		return ses.sshClient.ScpGet(remoteTmp, local)
	}
	return ses.sshClient.ScpGet(remoteTmp, local)
}

//
// SudoPut copy file from local to remote using sudo.
//
// Syntax,
//
//	#put! <local> <remote>
//
func (ses *Session) SudoPut(stmt []byte) (err error) {
	logp := "SudoPut"

	stmt = bytes.TrimSpace(stmt[5:])

	paths := bytes.Fields(stmt)
	if len(paths) != 2 {
		return fmt.Errorf("%s: invalid statement: %q", logp, stmt)
	}

	src := string(paths[0])
	baseName := filepath.Base(src)

	local, err := parseTemplate(ses, src)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	tmp := filepath.Join(ses.tmpDir, baseName)
	remote := string(paths[1])

	if ses.sftpc == nil {
		err = ses.sshClient.ScpPut(local, tmp)
	} else {
		err = ses.sftpc.Put(local, tmp)
	}
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	moveStmt := fmt.Sprintf("sudo mv -f %s %s", tmp, remote)

	return ses.sshClient.Execute(moveStmt)
}

func (ses *Session) executeScriptOnLocal(script *Script, startAt, endAt int) {
	for x := startAt; x <= endAt; x++ {
		stmt := script.statements[x]

		stmt = bytes.TrimSpace(stmt)
		if len(stmt) == 0 {
			continue
		}

		if bytes.HasPrefix(stmt, cmdMagicPut) {
			log.Printf("\n>>> %3d: %s\n", x, stmt)
			err := ses.Copy(stmt)
			if err != nil {
				log.Printf("!!! %s\n", err)
				break
			}
			continue
		}
		if bytes.HasPrefix(stmt, cmdMagicSudoPut) {
			log.Printf("\n>>> %3d: %s\n", x, stmt)
			err := ses.SudoCopy(stmt)
			if err != nil {
				log.Printf("!!! %s", err)
				break
			}
			continue
		}
		if bytes.HasPrefix(stmt, cmdMagicGet) {
			log.Printf("\n>>> %3d: %s", x, stmt)
			err := ses.Copy(stmt)
			if err != nil {
				log.Printf("!!! %s", err)
				break
			}
			continue
		}
		if bytes.HasPrefix(stmt, cmdMagicSudoGet) {
			log.Printf("\n>>> %3d: %s\n", x, stmt)
			err := ses.SudoCopy(stmt)
			if err != nil {
				log.Printf("!!! %s", err)
				break
			}
			continue
		}
		if stmt[0] == '#' {
			continue
		}

		log.Printf("\n>>> %3d: %s\n", x, stmt)

		stmts := os.ExpandEnv(string(stmt))

		err := exec.Run(stmts, os.Stdout, os.Stderr)
		if err != nil {
			log.Printf("!!! %s", err)
			break
		}
	}
}

func (ses *Session) executeScriptOnRemote(script *Script, startAt, endAt int) {
	logp := "executeScriptOnRemote"

	for x := startAt; x <= endAt; x++ {
		stmt := script.statements[x]

		stmt = bytes.TrimSpace(stmt)

		if len(stmt) == 0 {
			continue
		}
		if bytes.HasPrefix(stmt, cmdMagicPut) {
			log.Printf("\n>>> %s: %3d: %s\n", ses.sshClient, x, stmt)
			err := ses.Put(stmt)
			if err != nil {
				log.Printf("%s\n", err)
				break
			}
			continue
		}
		if bytes.HasPrefix(stmt, cmdMagicSudoPut) {
			log.Printf("\n>>> %s: %3d: %s\n", ses.sshClient, x, stmt)
			err := ses.SudoPut(stmt)
			if err != nil {
				log.Printf("%s\n", err)
				break
			}
			continue
		}
		if bytes.HasPrefix(stmt, cmdMagicGet) {
			log.Printf("\n>>> %s: %3d: %s\n", ses.sshClient, x, stmt)
			err := ses.Get(stmt)
			if err != nil {
				log.Printf("%s\n", err)
				break
			}
			continue
		}
		if bytes.HasPrefix(stmt, cmdMagicSudoGet) {
			log.Printf("\n>>> %s: %3d: %s\n", ses.sshClient, x, stmt)
			err := ses.SudoGet(stmt)
			if err != nil {
				log.Printf("%s\n", err)
				break
			}
			continue
		}
		if stmt[0] == '#' {
			continue
		}

		log.Printf("\n>>> %s: %3d: %s\n", ses.sshClient, x, stmt)

		err := ses.sshClient.Execute(string(stmt))
		if err != nil {
			log.Printf("%s: %s", logp, err.Error())
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

	log.Printf("--- SSH Hostname: %s\n", sshSection.Hostname)
	log.Printf("--- SSH Port: %s\n", sshSection.Port)
	log.Printf("--- SSH User: %s\n", sshSection.User)
	log.Printf("--- SSH IdentityFile %s\n", lastIdentFile)

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
