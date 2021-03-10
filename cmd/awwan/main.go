// Copyright 2019, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package main

import (
	"fmt"
	"log"
	"math"
	"os"
	"strconv"

	"git.sr.ht/~shulhan/awwan"
)

func main() {
	var (
		startAt int
		endAt   int
		err     error
	)

	log.SetFlags(0)

	if len(os.Args) <= 3 {
		usage()
	}

	startAt, err = parseArgScriptStart(os.Args[3])
	if err != nil {
		log.Fatalf("awwan: %s", err)
	}
	endAt = startAt

	if len(os.Args) >= 5 {
		endAt, err = parseArgScriptEnd(os.Args[4])
		if err != nil {
			log.Fatalf("awwan: %s", err)
		}
	}

	cmd, err := awwan.NewCommand(os.Args[1], os.Args[2], startAt, endAt)
	if err != nil {
		log.Fatalf("awwan: %s", err)
	}

	err = cmd.Run()
	if err != nil {
		log.Fatal(err)
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
	log.Println(`
awwan <command> <script> <start> [end]

command  = "local" / "play"
	The local command execute the script in current system.
	The play command execute the script in the remove server.

script = STRING
	A path to script to be executed.

start = 1*DIGITS
	The starting line number in the script.

end = 1*DIGITS / "-"
	The end of line number, default to start. The "-" means until the
	last line`)

	os.Exit(1)
}
