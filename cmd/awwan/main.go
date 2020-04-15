// Copyright 2019, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package main

import (
	"fmt"
	"log"
	"os"

	"github.com/shuLhan/awwan"
)

func main() {
	if len(os.Args) <= 2 {
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
	fmt.Println(`
	awwan <commands> <service> [start] [end]

	commands     = "bootstrap" | "local" | "play"

	service      = provider "/" service_name "/" node_name

	provider     = "virtualbox" | "aws" | "gcp"

	service_name = "ec2" | "vm"

	node_name    = 1*ALPHANUM ( "." / "-" / ALPHANUM )

	start        = 1*DIGITS

	end          = 1*DIGITS / "-"`)
	os.Exit(1)
}
