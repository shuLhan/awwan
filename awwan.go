// Copyright 2019, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package awwan

import "fmt"

const (
	Version = "0.4.0-devel"

	CommandModeLocal = "local"
	CommandModePlay  = "play"

	envFileName = "awwan.env" // The default awwan environment file name.
	sshDir      = ".ssh"      // The default SSH config directory name.
	sshConfig   = "config"    // The default SSH config file name.
)

var (
	cmdMagicGet     = []byte("#get:")
	cmdMagicPut     = []byte("#put:")
	cmdMagicSudoGet = []byte("#get!")
	cmdMagicSudoPut = []byte("#put!")
	cmdMagicRequire = []byte("#require:")
)

//
// Awwan is service that run script in local or play mode.
//
type Awwan struct {
}

//
// New create and initialize new Awwan service.
//
func New() *Awwan {
	return &Awwan{}
}

func (aww *Awwan) Local(script string, start, end int) (err error) {
	logp := "Local"

	cmd, err := NewCommand(CommandModeLocal, script, start, end)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	return cmd.doLocal()
}

func (aww *Awwan) Play(script string, start, end int) (err error) {
	logp := "Play"

	cmd, err := NewCommand(CommandModePlay, script, start, end)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	return cmd.doPlay()
}
