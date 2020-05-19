// Copyright 2019, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package awwan

const (
	modeLocal = "local"
	modePlay  = "play"

	envFileName = "awwan.env" // The default awwan environment file name.
	sshDir      = ".ssh"      // The default SSH config directory name.
	sshConfig   = "config"    // The default SSH config file name.
)

var (
	cmdMagicGet     = []byte("#get:")
	cmdMagicPut     = []byte("#put:")
	cmdMagicSudoGet = []byte("#get!")
	cmdMagicSudoPut = []byte("#put!")
)
