// SPDX-FileCopyrightText: 2019 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

// awwan is command line interface to configure and manage remote system
// through SSH connection.
package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"strings"

	"git.sr.ht/~shulhan/awwan"
)

const (
	cmdHelp    = "help"
	cmdVersion = "version"
)

func usage() {
	var v = `= awwan v` + awwan.Version + `

Configuration management software, infrastructure as file and directory
layout.

== USAGE

awwan <command> <arguments>

command = "help" / "local" / "play" / "serve" / "version"

	help
		Display the command usage and its description.

	local <script> <line-range>
		Execute the script in current system from line <start> until
		line <end>.

	play <script> <line-range>
		Execute the script in the remote server from line <start>
		until line <end>.

	serve <workspace>
		Run the web-user interface using <workspace> directory as base
		directory.

	version
		Print the application version to standard output.

arguments = <script> <line-range> / <workspace>

	script = STRING
		A path to script to be executed.

	workspace = STRING
		The root directory of awwan workspace, the one that contains
		the .ssh directory.

line-range = start [ "-" [end] ] *("," line-range)

	start = 1*DIGITS
		The starting line number in the script.

	end = 1*DIGITS
		The end of line number.
		Its value either empty, equal, or greater than start.

== EXAMPLES

Execute line 5, 7, and line 10 until 15 of "script.aww" in local system,

	$ awwan local myserver/script.aww 5,7,10-15

Execute line 6 and line 12 until the end of line of "script.aww" in remote
server known as "myserver",

	$ awwan play myserver/script.aww 6,12-

Run the web-user interface using the current directory as workspace,

	$ awwan serve .`

	fmt.Println(v)
}

func main() {
	var logp = "awwan"

	log.SetFlags(0)

	flag.Parse()

	if flag.NArg() <= 0 {
		usage()
		os.Exit(1)
	}

	var (
		cmdMode = strings.ToLower(flag.Arg(0))
		req     *awwan.Request
		baseDir string
		err     error
	)

	// Check for valid command and flags.
	switch cmdMode {
	case cmdHelp:
		usage()
		os.Exit(0)

	case cmdVersion:
		fmt.Println(`awwan ` + awwan.Version)
		return

	case awwan.CommandModeLocal, awwan.CommandModePlay:
		req = awwan.NewRequest(cmdMode, flag.Arg(1), flag.Arg(2))

	case awwan.CommandModeServe:
		if flag.NArg() <= 1 {
			err = fmt.Errorf("%s: missing workspace directory", cmdMode)
		} else {
			baseDir = flag.Arg(1)
		}
	default:
		err = fmt.Errorf("missing or invalid command %s", cmdMode)
	}
	if err != nil {
		log.Printf("%s: %s", logp, err)
		os.Exit(1)
	}

	var aww *awwan.Awwan

	aww, err = awwan.New(baseDir)
	if err != nil {
		log.Printf("%s: %s", logp, err)
		os.Exit(1)
	}

	switch cmdMode {
	case awwan.CommandModeLocal:
		err = aww.Local(req)
	case awwan.CommandModePlay:
		err = aww.Play(req)
	case awwan.CommandModeServe:
		err = aww.Serve()
	}
	if err != nil {
		log.Printf("%s: %s", logp, err)
		os.Exit(1)
	}
}
