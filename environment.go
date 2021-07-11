// Copyright 2019, Shulhan <ms@kilabit.info>. All rights reserved.
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
	"github.com/shuLhan/share/lib/ssh/config"
)

//
// environment contains all of values required to execute the script.
//
type environment struct {
	BaseDir   string // The current working directory.
	ScriptDir string // The base directory of the script.

	SSHKey  string // The value of "IdentityFile" in SSH config.
	SSHUser string // The value of "User" in SSH config.
	SSHHost string // The value of "Hostname" in configuration.
	SSHPort string // The value of "Port" in configuration.

	hostname     string // The hostname where script will be executed.
	scriptName   string // The name of the script.
	randomString string // Uniq string to copy file to /tmp/<random>

	vars      *ini.Ini       // All variables from environment files.
	sshConfig *config.Config // All the Host values from SSH config files.
}

//
// newEnvironment create and initialize new environment from the script path.
//
func newEnvironment(mode, scriptPath string) (env *environment, err error) {
	logp := "newEnvironment"

	env = &environment{}

	err = env.lookupBaseDir()
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	env.parseArgScript(scriptPath)

	paths, err := env.generatePaths()
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	err = env.loadAll(paths)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	if mode == modePlay {
		err = env.loadAllSSHConfig(paths)
		if err != nil {
			return nil, fmt.Errorf("%s: %w", logp, err)
		}
	}

	rand.Seed(time.Now().Unix())
	env.randomString = string(ascii.Random([]byte(ascii.LettersNumber), 16))

	return env, nil
}

//
// lookupBaseDir find the directory that contains ".ssh" directory from
// current working directory until "/", as the base working directory of
// awwan.
//
func (env *environment) lookupBaseDir() (err error) {
	var (
		logp  = "lookupBaseDir"
		found bool
	)

	dir, err := os.Getwd()
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	for dir != "/" {
		_, err := os.Stat(filepath.Join(dir, sshDir))
		if err == nil {
			found = true
			break
		}
		if os.IsNotExist(err) {
			dir = filepath.Dir(dir)
			continue
		}
		return fmt.Errorf("%s: %w", logp, err)
	}

	if !found {
		return fmt.Errorf("%s: cannot find .ssh directory", logp)
	}

	env.BaseDir = dir

	return nil
}

//
// generatePaths using BaseDir and ScriptDir return all paths from BaseDir
// to ScriptDir.
//
func (env *environment) generatePaths() (paths []string, err error) {
	absScriptDir, err := filepath.Abs(env.ScriptDir)
	if err != nil {
		return nil, fmt.Errorf("generatePaths %q: %w", absScriptDir, err)
	}

	if !strings.HasPrefix(absScriptDir, env.BaseDir) {
		return nil, fmt.Errorf("%q must be under %q", env.ScriptDir, env.BaseDir)
	}
	rel, err := filepath.Rel(env.BaseDir, absScriptDir)
	if err != nil {
		return nil, err
	}

	subs := strings.Split(rel, string(os.PathSeparator))
	path := env.BaseDir
	paths = make([]string, 0, len(subs)+1)
	paths = append(paths, path)
	for x := 0; x < len(subs); x++ {
		if subs[x] == "." || subs[x] == "" {
			continue
		}
		path = filepath.Join(path, subs[x])
		paths = append(paths, path)
	}

	return paths, nil
}

//
// parseArgScript parse the second argument, the script file.
//
func (env *environment) parseArgScript(path string) {
	path = filepath.Clean(path)

	env.ScriptDir = filepath.Dir(path)
	env.scriptName = filepath.Base(path)
	env.hostname = filepath.Base(env.ScriptDir)
}

//
// load the environment variables from file.
//
func (env *environment) load(file string) (err error) {
	content, err := ioutil.ReadFile(file)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return fmt.Errorf("load %q: %w", file, err)
	}

	log.Printf(">>> loading %q ...\n", file)

	err = env.parse(content)
	if err != nil {
		return fmt.Errorf("load %q: %w", file, err)
	}

	return nil
}

//
// loadAll environment file from each directory in paths.
//
func (env *environment) loadAll(paths []string) (err error) {
	for _, path := range paths {
		err = env.load(filepath.Join(path, envFileName))
		if err != nil {
			return err
		}
	}
	return nil
}

//
// loadAllSSHConfig load all SSH config from user's home directory and prepend
// each of the config inside the paths.
//
func (env *environment) loadAllSSHConfig(paths []string) (err error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("loadAllSSHConfig: %w", err)
	}

	configFile := filepath.Join(homeDir, sshDir, sshConfig)
	env.sshConfig, err = config.Load(configFile)
	if err != nil {
		return fmt.Errorf("loadAllSSHConfig: %w", err)
	}

	for _, path := range paths {
		configFile = filepath.Join(path, sshDir, sshConfig)
		otherConfig, err := config.Load(configFile)
		if err != nil {
			return fmt.Errorf("loadAllSSHConfig: %w", err)
		}
		if otherConfig == nil {
			continue
		}
		env.sshConfig.Prepend(otherConfig)
	}
	return nil
}

//
// parse the content of environment variables..
//
func (env *environment) parse(content []byte) (err error) {
	in, err := ini.Parse(content)
	if err != nil {
		return err
	}

	in.Prune()

	if env.vars == nil {
		env.vars = in
		return nil
	}

	env.vars.Rebase(in)

	return nil
}

//
// Section return a single Section that match with section and/or sub-section
// name.
// Section and subsection name is separated by ":".
//
func (env *environment) Section(secPath string) (sec *ini.Section) {
	names := strings.Split(secPath, ":")
	switch len(names) {
	case 0:
		return nil
	case 1:
		sec = env.vars.Section(names[0], "")
	default:
		sec = env.vars.Section(names[0], names[1])
	}
	return
}

//
// Subs return list of sub sections that have the same section name.
//
func (env *environment) Subs(secName string) (subs []*ini.Section) {
	return env.vars.Subs(secName)
}

//
// Vars return all variables in section and/or subsection as map of string.
//
func (env *environment) Vars(path string) (vars map[string]string) {
	return env.vars.Vars(path)
}

//
// Val return the last variable value defined in key path.
//
func (env *environment) Val(keyPath string) string {
	return env.vars.Val(keyPath)
}

//
// Vals return all variable values as slice of string.
//
func (env *environment) Vals(keyPath string) []string {
	return env.vars.Vals(keyPath)
}
