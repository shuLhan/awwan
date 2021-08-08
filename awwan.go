// Copyright 2019, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package awwan

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/shuLhan/share/lib/os/exec"
	"github.com/shuLhan/share/lib/ssh/config"
)

const (
	Version = "0.4.0-devel"

	CommandModeLocal = "local"
	CommandModePlay  = "play"

	defEnvFileName = "awwan.env" // The default awwan environment file name.
	defCacheDir    = ".cache"
	defSshConfig   = "config" // The default SSH config file name.
	defSshDir      = ".ssh"   // The default SSH config directory name.
	defTmpDir      = "/tmp"
)

var (
	cmdMagicGet     = []byte("#get:")
	cmdMagicPut     = []byte("#put:")
	cmdMagicSudoGet = []byte("#get!")
	cmdMagicSudoPut = []byte("#put!")
	cmdMagicRequire = []byte("#require:")
	newLine         = []byte("\n")
)

//
// Awwan is the service that run script in local or remote.
// Awwan contains cache of sessions and cache of environment files.
//
type Awwan struct {
	BaseDir string

	// All the Host values from SSH config files.
	sshConfig *config.Config
}

//
// New create and initialize new Awwan service using baseDir as the root of
// Awwan workspace.
// If baseDir is empty, it will set to current working directory.
//
func New(baseDir string) (aww *Awwan, err error) {
	logp := "New"

	aww = &Awwan{}

	aww.BaseDir, err = lookupBaseDir(baseDir)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	return aww, nil
}

func (aww *Awwan) Local(scriptPath string, startAt, endAt int) (err error) {
	logp := "Local"

	scriptPath = filepath.Clean(scriptPath)
	sessionDir := filepath.Dir(scriptPath)

	ses, err := NewSession(aww.BaseDir, sessionDir)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	err = ses.loadEnvFromPaths()
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	script, err := NewScript(ses, scriptPath)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	maxLines := len(script.statements)
	if startAt >= maxLines {
		return fmt.Errorf("%s: start index %d out of range %d", logp, startAt, maxLines)
	}
	if endAt > maxLines {
		endAt = maxLines - 1
	}

	// Create temporary directory.
	mkdirStmt := fmt.Sprintf("mkdir %s", ses.tmpDir)
	err = exec.Run(mkdirStmt, os.Stdout, os.Stderr)
	if err != nil {
		return fmt.Errorf("%s: %s: %w", logp, mkdirStmt, err)
	}
	defer func() {
		err = os.RemoveAll(ses.tmpDir)
		if err != nil {
			log.Printf("%s: %s", logp, err)
		}
	}()

	err = script.ExecuteRequires(startAt)
	if err != nil {
		return fmt.Errorf("%s:%w", logp, err)
	}

	ses.executeScriptOnLocal(script, startAt, endAt)

	return nil
}

func (aww *Awwan) Play(scriptPath string, startAt, endAt int) (err error) {
	logp := "Play"

	scriptPath = filepath.Clean(scriptPath)
	sessionDir := filepath.Dir(scriptPath)

	ses, err := NewSession(aww.BaseDir, sessionDir)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	err = ses.loadEnvFromPaths()
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	if aww.sshConfig == nil {
		err = aww.loadSshConfig()
		if err != nil {
			return fmt.Errorf("%s: %w", logp, err)
		}
	}

	sshSection := aww.sshConfig.Get(ses.hostname)
	if sshSection == nil {
		return fmt.Errorf("%s: can not find Host %q in SSH config", logp, ses.hostname)
	}

	err = ses.initSSHClient(sshSection)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	script, err := NewScript(ses, scriptPath)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	maxLines := len(script.statements)
	if startAt >= maxLines {
		return fmt.Errorf("%s: start index %d out of range %d", logp, startAt, maxLines)
	}
	if endAt > maxLines {
		endAt = maxLines - 1
	}

	// Create temporary directory ...
	mkdirStmt := fmt.Sprintf("mkdir %s", ses.tmpDir)

	err = ses.sshClient.Execute(mkdirStmt)
	if err != nil {
		return fmt.Errorf("%s: %s: %w", logp, mkdirStmt, err)
	}
	defer func() {
		rmdirStmt := fmt.Sprintf("rm -rf %s", ses.tmpDir)
		err := ses.sshClient.Execute(rmdirStmt)
		if err != nil {
			log.Printf("%s: %s", logp, err)
		}
	}()

	err = script.ExecuteRequires(startAt)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	ses.executeScriptOnRemote(script, startAt, endAt)

	return nil
}

//
// loadSshConfig load all SSH config from user's home and the awwan base
// directoy.
//
func (aww *Awwan) loadSshConfig() (err error) {
	logp := "loadSshConfig"

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	configFile := filepath.Join(homeDir, defSshDir, defSshConfig)
	aww.sshConfig, err = config.Load(configFile)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	configFile = filepath.Join(aww.BaseDir, defSshDir, defSshConfig)
	baseDirConfig, err := config.Load(configFile)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}
	if baseDirConfig == nil {
		return nil
	}
	aww.sshConfig.Prepend(baseDirConfig)

	return nil
}

//
// lookupBaseDir find the directory that contains ".ssh" directory from
// current working directory until "/", as the base working directory of
// awwan.
//
func lookupBaseDir(baseDir string) (dir string, err error) {
	var (
		logp  = "lookupBaseDir"
		found bool
	)

	if len(baseDir) > 0 {
		_, err = os.Stat(filepath.Join(dir, defSshDir))
		if err != nil {
			return "", fmt.Errorf("%s: cannot find .ssh directory on %s", logp, baseDir)
		}
		return baseDir, nil
	}

	dir, err = os.Getwd()
	if err != nil {
		return "", fmt.Errorf("%s: %w", logp, err)
	}

	for dir != "/" {
		_, err = os.Stat(filepath.Join(dir, defSshDir))
		if err == nil {
			found = true
			break
		}
		if os.IsNotExist(err) {
			dir = filepath.Dir(dir)
			continue
		}
		return "", fmt.Errorf("%s: %w", logp, err)
	}
	if !found {
		return "", fmt.Errorf("%s: cannot find .ssh directory", logp)
	}
	return dir, nil
}
