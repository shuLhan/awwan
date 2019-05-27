// Copyright 2019, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package awwan

import (
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/shuLhan/share/lib/ini"
)

type Environment struct {
	Mode        string
	ServiceDir  string
	ScriptStart int
	ScriptEnd   int

	Provider string
	Service  string
	Name     string

	// BaseDir contains the current working directory.
	BaseDir string

	scriptPath string
	// vars contains all variables in environment.
	vars *ini.Ini
}

func (env *Environment) initialize() {
	var err error

	env.BaseDir, err = os.Getwd()
	if err != nil {
		log.Fatal("environment: os.Getwd: " + err.Error())
	}

	fi, err := os.Stat(env.ServiceDir)
	if err != nil {
		log.Fatal("loadScript: " + err.Error())
	}

	switch env.Mode {
	case CommandModeBootstrap:
		if fi.IsDir() {
			env.scriptPath = filepath.Join(env.ServiceDir, "bootstrap.aww")
		} else {
			env.scriptPath = env.ServiceDir
			env.ServiceDir = filepath.Dir(env.ServiceDir)
		}

	case CommandModeLocal, CommandModePlay:
		if fi.IsDir() {
			env.scriptPath = filepath.Join(env.ServiceDir, "play.aww")
		} else {
			env.scriptPath = env.ServiceDir
			env.ServiceDir = filepath.Dir(env.ServiceDir)
		}
	}

	env.load(filepath.Join(env.BaseDir, "env.ini"))
	env.load(filepath.Join(env.ServiceDir, "env.ini"))
}

func (env *Environment) load(file string) {
	content, err := ioutil.ReadFile(file)
	if err != nil {
		if os.IsNotExist(err) {
			return
		}
		log.Fatal("environment: ioutil.ReadFile: " + err.Error())
	}

	env.parseEnvironment(content)
}

func (env *Environment) parseEnvironment(content []byte) {
	in, err := ini.Parse(content)
	if err != nil {
		log.Fatal("environment: ini.Parse: " + err.Error())
	}

	in.Prune()

	if env.vars == nil {
		env.vars = in
		return
	}

	env.vars.Rebase(in)
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
