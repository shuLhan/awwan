// Copyright 2019, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package main

import (
	"flag"
	"fmt"
	"log"
	"math"
	"strconv"
	"strings"

	"git.sr.ht/~shulhan/awwan"
)

func main() {
	var (
		logp             = "awwan"
		script           string
		startAt          int
		endAt            int
		err              error
		flagCommandLocal bool
		flagCommandPlay  bool
		flagHelp         bool
		flagVersion      bool
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

	cmdMode := strings.ToLower(flag.Arg(0))

	// Check for valid command and flags.
	switch cmdMode {
	case awwan.CommandModeLocal:
		flagCommandLocal = true
	case awwan.CommandModePlay:
		flagCommandPlay = true
	default:
		log.Printf("%s: missing or invalid command %s\n", logp, cmdMode)
		flag.Usage()
	}

	if flagCommandLocal || flagCommandPlay {
		if flag.NArg() <= 2 {
			flag.Usage()
		}

		script = flag.Arg(1)

		startAt, err = parseArgScriptStart(flag.Arg(2))
		if err != nil {
			log.Fatalf("%s: %s", logp, err)
		}
		endAt = startAt

		if flag.NArg() >= 4 {
			endAt, err = parseArgScriptEnd(flag.Arg(3))
			if err != nil {
				log.Fatalf("%s: %s", logp, err)
			}
			if endAt < startAt {
				endAt = startAt
			}
		}
	}

	aww, err := awwan.New("")
	if err != nil {
		log.Printf("%s: %s", logp, err)
		return
	}

	if flagCommandLocal {
		err = aww.Local(script, startAt, endAt)
	}
	if flagCommandPlay {
		err = aww.Play(script, startAt, endAt)
	}
	if err != nil {
		log.Printf("%s: %s", logp, err)
	}
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
	log.Printf(`
= awwan v%s

== USAGE

	awwan <command> <script> <start> [end]

== OPTIONS

command  = "local" / "play"
	The local command execute the script in current system.
	The play command execute the script in the remote server.

script = STRING
	A path to script to be executed.

start = 1*DIGITS
	The starting line number in the script.

end = 1*DIGITS / "-"
	The end of line number, default to start. The "-" means until the
	last line.
`, awwan.Version)
}

func version() {
	fmt.Printf("awwan %s\n", awwan.Version)
}
