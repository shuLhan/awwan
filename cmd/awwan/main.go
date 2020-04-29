// Copyright 2019, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package main

import (
	"log"
	"os"

	"github.com/shuLhan/awwan"
)

func main() {
	if len(os.Args) <= 3 {
		usage()
	}

	env, err := awwan.NewEnvironment(os.Args[1:])
	if err != nil {
		log.Println(err)
		usage()
	}

	cmd := awwan.New(env)

	cmd.Run()
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
	last line
`)
	os.Exit(1)
}
