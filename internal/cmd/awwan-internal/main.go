// SPDX-FileCopyrightText: 2023 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

// Program awwan-internal provides internal commands for developing and
// building awwan.
package main

import (
	"flag"
	"log"
	"strings"

	"git.sr.ht/~shulhan/awwan/internal"
)

const (
	commandModeBuild = `build`
)

func main() {
	log.SetFlags(0)

	flag.Parse()

	var (
		logp    = `awwan-internal`
		cmdMode = flag.Arg(0)

		err error
	)

	cmdMode = strings.ToLower(cmdMode)

	if cmdMode == commandModeBuild {
		err = internal.Build()
	}
	if err != nil {
		log.Fatalf(`%s: %s: %s`, logp, cmdMode, err)
	}
}
