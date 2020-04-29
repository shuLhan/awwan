// Copyright 2019, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package awwan

import (
	"fmt"
	"io/ioutil"
	"log"
	"math"
	"math/rand"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/shuLhan/share/lib/ascii"
	"github.com/shuLhan/share/lib/ini"
	"github.com/shuLhan/share/lib/ssh"
)

//
// Environment contains all of values required to execute the script.
//
type Environment struct {
	BaseDir   string // The current working directory.
	ScriptDir string // The base directory of the script.

	mode         string // One of the mode to execute the script.
	hostname     string // The hostname where script will be executed.
	scriptPath   string // Location of the script in file system.
	scriptName   string // The name of the script.
	scriptStart  int
	scriptEnd    int
	randomString string // Uniq string to copy file to /tmp/<random>

	vars      *ini.Ini    // All variables from environment files.
	sshConfig *ssh.Config // All the Host values from SSH config files.
}

//
// NewEnvironment create and initialize new Environment from command line
// arguments.
// The first argument must be the mode of command.
// The second argument is the script to be executed.
// The third argument is the line number where we want to start execute the
// script.
// The fourth argument is the line number where the script execution will end.
//
func NewEnvironment(args []string) (env *Environment, err error) {
	if len(args) < 2 {
		return nil, fmt.Errorf("invalid arguments")
	}

	env = &Environment{}

	env.BaseDir, err = os.Getwd()
	if err != nil {
		return nil, fmt.Errorf("NewEnvironment: %w", err)
	}

	err = env.parseArgMode(args[0])
	if err != nil {
		return nil, err
	}

	env.parseArgScript(args[1])

	if len(args) >= 3 {
		err = env.parseArgScriptStart(args[2])
		if err != nil {
			return nil, err
		}
	}

	if len(args) >= 4 {
		err = env.parseArgScriptEnd(args[3])
		if err != nil {
			return nil, err
		}
	} else {
		env.scriptEnd = env.scriptStart
	}

	paths, err := env.generatePaths()
	if err != nil {
		return nil, fmt.Errorf("NewEnvironment: %w", err)
	}

	err = env.loadAll(paths)
	if err != nil {
		return nil, fmt.Errorf("NewEnvironment: %w", err)
	}

	err = env.loadAllSSHConfig(paths)
	if err != nil {
		return nil, fmt.Errorf("NewEnvironment: %w", err)
	}

	rand.Seed(time.Now().Unix())
	env.randomString = string(ascii.Random([]byte(ascii.LettersNumber), 16))

	return env, nil
}

//
// generatePaths using BaseDir and ScriptDir return all paths from BaseDir
// to ScriptDir.
//
func (env *Environment) generatePaths() (paths []string, err error) {
	absScriptDir, err := filepath.Abs(env.ScriptDir)
	if err != nil {
		return nil, fmt.Errorf("generatePaths %q: %w", absScriptDir, err)
	}

	if !filepath.HasPrefix(absScriptDir, env.BaseDir) {
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
// parseArgMode parse the first argument given to environment, the mode of
// execution.
//
func (env *Environment) parseArgMode(mode string) (err error) {
	env.mode = strings.ToLower(mode)

	switch env.mode {
	case modeLocal:
	case modePlay:
	default:
		return fmt.Errorf("unknown mode %q", env.mode)
	}
	return nil
}

//
// parseArgScript parse the second argument, the script file.
//
func (env *Environment) parseArgScript(path string) {
	path = filepath.Clean(path)

	env.ScriptDir = filepath.Dir(path)
	env.scriptName = filepath.Base(path)
	env.hostname = filepath.Base(env.ScriptDir)
	env.scriptPath = path
}

//
// parseArgScriptStart parse the third argument, the line start number.
//
func (env *Environment) parseArgScriptStart(start string) (err error) {
	env.scriptStart, err = strconv.Atoi(start)
	if err != nil {
		fmt.Errorf("invalid start %q: %w", start, err)
	}

	if env.scriptStart < 0 {
		env.scriptStart = 0
	}

	return nil
}

//
// parseArgScriptEnd parse the fourth argument, the line end number or "-" for
// the end of line.
//
func (env *Environment) parseArgScriptEnd(end string) (err error) {
	if end == "-" {
		env.scriptEnd = math.MaxInt32
	} else {
		env.scriptEnd, err = strconv.Atoi(os.Args[4])
		if err != nil {
			return fmt.Errorf("invalid end %q: %w", end, err)
		}
	}
	if env.scriptEnd < env.scriptStart {
		env.scriptEnd = env.scriptStart
	}

	return nil
}

//
// load the environment variables from file.
//
func (env *Environment) load(file string) (err error) {
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
func (env *Environment) loadAll(paths []string) (err error) {
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
func (env *Environment) loadAllSSHConfig(paths []string) (err error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("loadAllSSHConfig: %w", err)
	}

	configFile := filepath.Join(homeDir, sshDir, sshConfig)
	env.sshConfig, err = ssh.NewConfig(configFile)
	if err != nil {
		return fmt.Errorf("loadAllSSHConfig: %w", err)
	}

	for _, path := range paths {
		configFile = filepath.Join(path, sshDir, sshConfig)
		otherConfig, err := ssh.NewConfig(configFile)
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
func (env *Environment) parse(content []byte) (err error) {
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
func (env *Environment) Section(secPath string) (sec *ini.Section) {
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
func (env *Environment) Subs(secName string) (subs []*ini.Section) {
	return env.vars.Subs(secName)
}

//
// Vars return all variables in section and/or subsection as map of string.
//
func (env *Environment) Vars(path string) (vars map[string]string) {
	return env.vars.Vars(path)
}

//
// Val return the last variable value defined in key path.
//
func (env *Environment) Val(keyPath string) string {
	return env.vars.Val(keyPath)
}

//
// Vals return all variable values as slice of string.
//
func (env *Environment) Vals(keyPath string) []string {
	return env.vars.Vals(keyPath)
}
