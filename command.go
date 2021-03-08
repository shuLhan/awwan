// Copyright 2019, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package awwan

import (
	"bytes"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/shuLhan/share/lib/io"
	"github.com/shuLhan/share/lib/os/exec"
	"github.com/shuLhan/share/lib/ssh"
)

//
// Command contains the mode, environment, script, and SSH client per one
// execution.
//
type Command struct {
	mode        string // One of the mode to execute the script.
	scriptPath  string // Location of the script in file system.
	scriptStart int
	scriptEnd   int

	script    *script
	env       *Environment
	sshClient *ssh.Client
	tmpDir    string
}

//
// NewCommand create new command from environment.
//
func NewCommand(mode, scriptPath string, startAt, endAt int) (cmd *Command, err error) {
	logp := "NewCommand"

	mode = strings.ToLower(mode)
	switch mode {
	case modeLocal:
	case modePlay:
	default:
		return nil, fmt.Errorf("%s: unknown command %s\n", logp, mode)
	}

	if endAt < startAt {
		endAt = startAt
	}

	cmd = &Command{
		mode:        mode,
		scriptPath:  scriptPath,
		scriptStart: startAt,
		scriptEnd:   endAt,
	}

	cmd.env, err = NewEnvironment(scriptPath)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	cmd.tmpDir = filepath.Join("/tmp", cmd.env.randomString)

	cmd.script, err = newScript(cmd.env, cmd.scriptPath)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	if cmd.scriptEnd >= len(cmd.script.Statements) {
		cmd.scriptEnd = len(cmd.script.Statements) - 1
	}

	return cmd, nil
}

//
// copy file in local system.
//
func (cmd *Command) copy(stmt []byte) (err error) {
	logp := "copy"

	stmt = bytes.TrimSpace(stmt[5:])

	paths := bytes.Fields(stmt)
	if len(paths) != 2 {
		return fmt.Errorf("%s: invalid statement: %q", logp, stmt)
	}

	local, err := parseTemplate(cmd.env, string(paths[0]))
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	remote := string(paths[1])

	return io.Copy(remote, local)
}

//
// sudoCopy file in local system using sudo.
//
func (cmd *Command) sudoCopy(stmt []byte) (err error) {
	logp := "sudoCopy"

	stmt = bytes.TrimSpace(stmt[5:])

	paths := bytes.Fields(stmt)
	if len(paths) != 2 {
		return fmt.Errorf("%s: invalid statement: %q", logp, stmt)
	}

	src := string(paths[0])
	baseName := filepath.Base(src)

	local, err := parseTemplate(cmd.env, src)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	tmp := filepath.Join(cmd.tmpDir, baseName)
	remote := string(paths[1])

	err = io.Copy(tmp, local)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	moveStmt := fmt.Sprintf("sudo mv %s %s", tmp, remote)

	return exec.Run(moveStmt, os.Stdout, os.Stderr)
}

func (cmd *Command) doPlay() (err error) {
	logp := "doPlay"

	err = cmd.initSSHClient()
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	// Create temporary directory ...
	mkdirStmt := fmt.Sprintf("mkdir %s", cmd.tmpDir)
	err = cmd.sshClient.Execute(mkdirStmt)
	if err != nil {
		return fmt.Errorf("%s: %s: %w", logp, mkdirStmt, err)
	}
	defer func() {
		rmdirStmt := fmt.Sprintf("rm -rf %s", cmd.tmpDir)
		err := cmd.sshClient.Execute(rmdirStmt)
		if err != nil {
			log.Printf("%s %s", rmdirStmt, err.Error())
		}
	}()

	err = cmd.executeRequires()
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	cmd.executeScript()

	return nil
}

func (cmd *Command) doLocal() (err error) {
	logp := "doLocal"

	// Create temporary directory ...
	mkdirStmt := fmt.Sprintf("mkdir %s", cmd.tmpDir)
	err = exec.Run(mkdirStmt, os.Stdout, os.Stderr)
	if err != nil {
		return fmt.Errorf("%s: %s: %w", logp, mkdirStmt, err)
	}
	defer func() {
		err = os.RemoveAll(cmd.tmpDir)
		if err != nil {
			log.Println(err)
		}
	}()

	err = cmd.executeRequires()
	if err != nil {
		return fmt.Errorf("%s:%w", logp, err)
	}

	cmd.executeLocalScript()

	return nil
}

//
// get copy file from remote to local.
// Syntax,
//
//	#get: <remote> <local>
//
func (cmd *Command) get(stmt []byte) (err error) {
	stmt = bytes.TrimSpace(stmt[5:])

	paths := bytes.Fields(stmt)
	if len(paths) != 2 {
		err = fmt.Errorf("cmd: invalid get statement %s", stmt)
		log.Println(err)
		return
	}

	remote := string(paths[0])
	local := string(paths[1])

	return cmd.sshClient.Get(remote, local)
}

//
// sudoGet copy file from remote that can be accessed by root, to local.
// Syntax,
//
//	#get! <remote> <local>
//
func (cmd *Command) sudoGet(stmt []byte) (err error) {
	stmt = bytes.TrimSpace(stmt[5:])

	paths := bytes.Fields(stmt)
	if len(paths) != 2 {
		err = fmt.Errorf("invalid get! statement: %q", stmt)
		log.Println(err)
		return
	}

	remoteSrc := string(paths[0])
	remoteBase := filepath.Base(remoteSrc)
	remoteTmp := filepath.Join(cmd.tmpDir, remoteBase)

	local := string(paths[1])

	cpRemoteToTmp := fmt.Sprintf("sudo cp -f %s %s", remoteSrc, remoteTmp)

	err = cmd.sshClient.Execute(cpRemoteToTmp)
	if err != nil {
		return fmt.Errorf("sudoGet %q: %w", cpRemoteToTmp, err)
	}

	chmod := fmt.Sprintf("sudo chown %s %s", cmd.env.SSHUser, remoteTmp)

	err = cmd.sshClient.Execute(chmod)
	if err != nil {
		return fmt.Errorf("sudoGet %q: %w", chmod, err)
	}

	return cmd.sshClient.Get(remoteTmp, local)
}

//
// put copy file from local to remote system.
// Syntax,
//
//	#put: <local> <remote>
//
func (cmd *Command) put(stmt []byte) (err error) {
	logp := "put"

	stmt = bytes.TrimSpace(stmt[5:])

	paths := bytes.Fields(stmt)
	if len(paths) != 2 {
		return fmt.Errorf("%s: invalid statement: %q", logp, stmt)
	}

	local, err := parseTemplate(cmd.env, string(paths[0]))
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	remote := string(paths[1])

	return cmd.sshClient.Put(local, remote)
}

//
// sudoPut copy file using sudo.
//
func (cmd *Command) sudoPut(stmt []byte) (err error) {
	logp := "sudoPut"

	stmt = bytes.TrimSpace(stmt[5:])

	paths := bytes.Fields(stmt)
	if len(paths) != 2 {
		return fmt.Errorf("%s: invalid statement: %q", logp, stmt)
	}

	src := string(paths[0])
	baseName := filepath.Base(src)

	local, err := parseTemplate(cmd.env, src)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	tmp := filepath.Join(cmd.tmpDir, baseName)
	remote := string(paths[1])

	err = cmd.sshClient.Put(local, tmp)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	moveStmt := fmt.Sprintf("sudo mv -f %s %s", tmp, remote)

	return cmd.sshClient.Execute(moveStmt)
}

//
// Run the script.
//
func (cmd *Command) Run() (err error) {
	switch cmd.mode {
	case modeLocal:
		err = cmd.doLocal()
	case modePlay:
		err = cmd.doPlay()
	}

	return err
}

func (cmd *Command) executeLocalScript() {
	for x := cmd.scriptStart; x <= cmd.scriptEnd; x++ {
		stmt := cmd.script.Statements[x]

		stmt = bytes.TrimSpace(stmt)

		if len(stmt) == 0 {
			continue
		}
		if bytes.HasPrefix(stmt, cmdMagicPut) {
			log.Printf(">>> %3d: %s\n", x, stmt)
			err := cmd.copy(stmt)
			if err != nil {
				break
			}
			continue
		}
		if bytes.HasPrefix(stmt, cmdMagicSudoPut) {
			log.Printf(">>> %3d: %s\n", x, stmt)
			err := cmd.sudoCopy(stmt)
			if err != nil {
				break
			}
			continue
		}
		if bytes.HasPrefix(stmt, cmdMagicGet) {
			log.Printf(">>> %3d: %s\n", x, stmt)
			err := cmd.copy(stmt)
			if err != nil {
				break
			}
			continue
		}
		if bytes.HasPrefix(stmt, cmdMagicSudoGet) {
			log.Printf(">>> %3d: %s\n", x, stmt)
			err := cmd.sudoCopy(stmt)
			if err != nil {
				break
			}
			continue
		}
		if stmt[0] == '#' {
			continue
		}

		log.Printf(">>> %3d: %s\n\n", x, stmt)

		err := exec.Run(string(stmt), os.Stdout, os.Stderr)
		if err != nil {
			log.Println("cmd: Execute: " + err.Error())
			break
		}
	}
}

//
// executeRequires run the #require: statements.
//
func (cmd *Command) executeRequires() (err error) {
	for x := 0; x < cmd.scriptStart; x++ {
		stmt := cmd.script.requires[x]
		if len(stmt) == 0 {
			continue
		}

		log.Printf("--- require %d: %s\n\n", x, stmt)

		err = exec.Run(string(stmt), os.Stdout, os.Stderr)
		if err != nil {
			return err
		}
	}

	return nil
}

func (cmd *Command) executeScript() {
	for x := cmd.scriptStart; x <= cmd.scriptEnd; x++ {
		stmt := cmd.script.Statements[x]

		stmt = bytes.TrimSpace(stmt)

		if len(stmt) == 0 {
			continue
		}
		if bytes.HasPrefix(stmt, cmdMagicPut) {
			log.Printf(">>> %s: %3d: %s\n\n", cmd.sshClient, x, stmt)
			err := cmd.put(stmt)
			if err != nil {
				break
			}
			continue
		}
		if bytes.HasPrefix(stmt, cmdMagicSudoPut) {
			log.Printf(">>> %s: %3d: %s\n\n", cmd.sshClient, x, stmt)
			err := cmd.sudoPut(stmt)
			if err != nil {
				break
			}
			continue
		}
		if bytes.HasPrefix(stmt, cmdMagicGet) {
			log.Printf(">>> %s: %3d: %s\n\n", cmd.sshClient, x, stmt)
			err := cmd.get(stmt)
			if err != nil {
				break
			}
			continue
		}
		if bytes.HasPrefix(stmt, cmdMagicSudoGet) {
			log.Printf(">>> %s: %3d: %s\n\n", cmd.sshClient, x, stmt)
			err := cmd.sudoGet(stmt)
			if err != nil {
				break
			}
			continue
		}
		if stmt[0] == '#' {
			continue
		}

		log.Printf(">>> %s: %3d: %s\n\n", cmd.sshClient, x, stmt)

		err := cmd.sshClient.Execute(string(stmt))
		if err != nil {
			log.Println("cmd: Execute: " + err.Error())
			break
		}
	}
}

func (cmd *Command) initSSHClient() (err error) {
	sshSection := cmd.env.sshConfig.Get(cmd.env.hostname)
	if sshSection == nil {
		return fmt.Errorf("cmd: can not find Host %q in SSH config",
			cmd.env.hostname)
	}

	log.Printf("sshSection:%+v\n", sshSection)

	cmd.sshClient, err = ssh.NewClient(sshSection)
	if err != nil {
		return fmt.Errorf("cmd: cannot create new SSH client: %w", err)
	}

	cmd.env.SSHKey = sshSection.IdentityFile[0]
	cmd.env.SSHUser = sshSection.User
	cmd.env.SSHHost = sshSection.Hostname
	cmd.env.SSHPort = strconv.Itoa(sshSection.Port)

	return nil
}
