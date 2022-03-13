// Copyright 2019, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

//
// awwan is command line interface to configure and manage remote system
// through SSH connection.
//
package main

import (
	"flag"
	"fmt"
	"log"
	"math"
	"os"
	"strconv"
	"strings"

	"git.sr.ht/~shulhan/awwan"
)

func main() {
	var (
		logp = "awwan"

		req         *awwan.Request
		aww         *awwan.Awwan
		cmdMode     string
		baseDir     string
		err         error
		flagHelp    bool
		flagVersion bool
	)

	log.SetFlags(0)

	flag.Usage = usage
	flag.BoolVar(&flagVersion, "version", false, "Display version and exit.")
	flag.BoolVar(&flagHelp, "help", false, "Display the command usage and its description.")
	flag.Parse()

	if flagHelp {
		flag.Usage()
	}
	if flagVersion {
		version()
		return
	}
	if flag.NArg() <= 0 {
		flag.Usage()
	}

	cmdMode = strings.ToLower(flag.Arg(0))

	// Check for valid command and flags.
	switch cmdMode {
	case awwan.CommandModeBuild:
	case awwan.CommandModeLocal:
		req, err = parseArgScriptStartEnd(cmdMode)
	case awwan.CommandModePlay:
		req, err = parseArgScriptStartEnd(cmdMode)
	case awwan.CommandModeServe:
		if flag.NArg() <= 1 {
			err = fmt.Errorf("%s: missing workspace directory", cmdMode)
		} else {
			baseDir = flag.Arg(1)
			req = awwan.NewRequest()
		}
	default:
		err = fmt.Errorf("missing or invalid command %s", cmdMode)
	}
	if err != nil {
		log.Printf("%s: %s", logp, err)
		os.Exit(1)
	}

	aww, err = awwan.New(baseDir)
	if err != nil {
		log.Printf("%s: %s", logp, err)
		os.Exit(1)
	}

	switch cmdMode {
	case awwan.CommandModeBuild:
		err = aww.Build()
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

func parseArgScriptStartEnd(cmdMode string) (req *awwan.Request, err error) {
	if flag.NArg() <= 2 {
		return nil, fmt.Errorf("%s: missing start and/or end arguments", cmdMode)
	}

	req = awwan.NewRequest()

	req.Script = flag.Arg(1)

	req.BeginAt, err = parseArgScriptStart(flag.Arg(2))
	if err != nil {
		return nil, err
	}
	req.EndAt = req.BeginAt

	if flag.NArg() >= 4 {
		req.EndAt, err = parseArgScriptEnd(flag.Arg(3))
		if err != nil {
			return nil, err
		}
		if req.EndAt < req.BeginAt {
			req.EndAt = req.BeginAt
		}
	}

	return req, nil
}

//
// parseArgScriptStart parse the third argument, the line start number.
//
func parseArgScriptStart(in string) (out int, err error) {
	out, err = strconv.Atoi(in)
	if err != nil {
		return 0, fmt.Errorf("invalid start at argument %q: %w", in, err)
	}
	if out < 0 {
		out = 0
	}
	return out, nil
}

//
// parseArgScriptEnd parse the fourth argument, the line end number or "-" for
// the last line.
//
func parseArgScriptEnd(in string) (out int, err error) {
	if in == "-" {
		return math.MaxInt32, nil
	}
	out, err = strconv.Atoi(in)
	if err != nil {
		return 0, fmt.Errorf("invalid end at argument %q: %w", in, err)
	}
	return out, nil
}

func usage() {
	log.Printf(`= awwan v%s

Configuration management software, infrastructure as file and directory
layout.

== USAGE

awwan <command> <arguments>

command = "local" | "play" | "serve"

	local <script> <start> [end]
		Execute the script in current system from line <start> until
		line <end>.

	play <script> <start> [end]
		Execute the script in the remote server from line <start>
		until line <end>.

	serve <workspace>
		Run the web-user interface using <workspace> directory as base
		directory.

arguments = <script> <start> [end] | <workspace>

	script = STRING
		A path to script to be executed.

	start = 1*DIGITS
		The starting line number in the script.

	end = 1*DIGITS | "-"
		The end of line number, default to start. The "-" means until
		the last line.

	workspace = STRING
		The directory that contains the .ssh directory.

== EXAMPLES

Execute only line 5 of "script.aww" on local system,

	$ awwan local myserver/script.aww 5

Execute line 5 until end of line of "script.aww" on remote server known as
"myserver",

	$ awwan play myserver/script.aww 5 -

Run the web-user interface using the current directory as workspace,

	$ awwan serve .

`, awwan.Version)
	os.Exit(1)
}

func version() {
	fmt.Printf("awwan %s\n", awwan.Version)
}
