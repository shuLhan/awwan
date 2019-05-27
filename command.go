// Copyright 2019, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package awwan

import (
	"bytes"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"

	libssh "github.com/shuLhan/share/lib/ssh"
)

//
// Command contains the environment, script, and SSH client per one command
// execution.
//
type Command struct {
	script    *script
	env       *Environment
	sshClient *libssh.Client
}

//
// New create new command from environment.
//
func New(env *Environment) (cmd *Command) {
	cmd = &Command{
		env: env,
	}

	env.initialize()

	return cmd
}

//
// copy file in local system.
//
func (cmd *Command) copy(stmt []byte) (err error) {
	return
}

func (cmd *Command) doBootstrap() {
	cmd.script = newScript(cmd.env, cmd.env.scriptPath)
	cmd.initSSHClient()
	cmd.executeScript()
}

func (cmd *Command) doPlay() {
	cmd.script = newScript(cmd.env, cmd.env.scriptPath)
	cmd.initSSHClient()
	cmd.executeScript()
}

func (cmd *Command) doLocal() {
	cmd.script = newScript(cmd.env, cmd.env.scriptPath)
	cmd.executeLocalScript()
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
// put copy file from local to remote system.
// Syntax,
//
//	#put: <local> <remote>
//
func (cmd *Command) put(stmt []byte) (err error) {
	stmt = bytes.TrimSpace(stmt[5:])

	paths := bytes.Fields(stmt)
	if len(paths) != 2 {
		err = fmt.Errorf("invalid put statement: %s", stmt)
		log.Println(err)
		return
	}

	local := parseTemplate(cmd.env, string(paths[0]))
	remote := string(paths[1])

	return cmd.sshClient.Put(local, remote)
}

//
// Run the script.
//
func (cmd *Command) Run() {
	switch cmd.env.Mode {
	case CommandModeBootstrap:
		cmd.doBootstrap()
	case CommandModeLocal:
		cmd.doLocal()
	case CommandModePlay:
		cmd.doPlay()
	}
}

//
// exec execute command on local system.
//
func (cmd *Command) exec(stmt string) (err error) {
	cmds := strings.Fields(stmt)
	localCmd := exec.Command(cmds[0], cmds[1:]...)
	localCmd.Stdout = os.Stdout
	localCmd.Stderr = os.Stderr

	return localCmd.Run()
}

func (cmd *Command) executeLocalScript() {
	for x := cmd.env.ScriptStart; x <= cmd.env.ScriptEnd; x++ {
		stmt := cmd.script.Statements[x]

		stmt = bytes.TrimSpace(stmt)

		if len(stmt) == 0 {
			continue
		}
		if bytes.HasPrefix(stmt, []byte("#put:")) {
			err := cmd.copy(stmt)
			if err != nil {
				break
			}
			continue
		}
		if bytes.HasPrefix(stmt, []byte("#get:")) {
			err := cmd.copy(stmt)
			if err != nil {
				break
			}
			continue
		}
		if stmt[0] == '#' {
			continue
		}

		fmt.Printf(">>> local %d: %s\n\n", x, stmt)

		err := cmd.exec(string(stmt))
		if err != nil {
			log.Println("cmd: Execute: " + err.Error())
			break
		}
	}
}

func (cmd *Command) executeScript() {
	for x := cmd.env.ScriptStart; x <= cmd.env.ScriptEnd; x++ {
		stmt := cmd.script.Statements[x]

		stmt = bytes.TrimSpace(stmt)

		if len(stmt) == 0 {
			continue
		}
		if bytes.HasPrefix(stmt, []byte("##")) {
			continue
		}
		if bytes.HasPrefix(stmt, []byte("#put:")) {
			err := cmd.put(stmt)
			if err != nil {
				break
			}
			continue
		}
		if bytes.HasPrefix(stmt, []byte("#get:")) {
			err := cmd.get(stmt)
			if err != nil {
				break
			}
			continue
		}

		fmt.Printf(">>> %s: %d: %s\n\n", cmd.sshClient, x, stmt)

		err := cmd.sshClient.Execute(string(stmt))
		if err != nil {
			log.Println("cmd: Execute: " + err.Error())
			break
		}
	}
}

func (cmd *Command) initSSHClient() {
	var remoteUser string

	if cmd.env.Mode == CommandModeBootstrap {
		remoteUser = cmd.env.Val("ssh::bootstrap-as")
		if len(remoteUser) == 0 {
			remoteUser = cmd.env.Val("ssh::user")
		}
	} else {
		remoteUser = cmd.env.Val("ssh::user")
	}

	strPort := cmd.env.Val("ssh::port")

	remotePort, err := strconv.Atoi(strPort)
	if err != nil {
		log.Fatalf("cmd: cannot convert port %q to number: %s", strPort, err.Error())
	}

	cc := &libssh.ClientConfig{
		Environments:   cmd.env.Vars("ssh:environment"),
		WorkingDir:     cmd.env.BaseDir,
		PrivateKeyFile: filepath.Join(cmd.env.ServiceDir, "private.pem"),
		RemoteUser:     remoteUser,
		RemoteHost:     cmd.env.Val("ssh::host"),
		RemotePort:     remotePort,
	}

	cmd.sshClient, err = libssh.NewClient(cc)
	if err != nil {
		log.Fatal("cmd: cannot create new SSH client: " + err.Error())
	}
}
