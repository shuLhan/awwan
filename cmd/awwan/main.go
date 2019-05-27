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
	"strings"

	"github.com/shuLhan/awwan"
)

func main() {
	if len(os.Args) <= 2 {
		usage()
	}

	env := &awwan.Environment{}

	strCommand := strings.ToLower(os.Args[1])

	switch strCommand {
	case awwan.CommandModeBootstrap:
	case awwan.CommandModeLocal:
	case awwan.CommandModePlay:
	default:
		usage()
	}

	provSvcName := strings.Split(os.Args[2], "/")
	if len(provSvcName) < 2 {
		log.Println("awwan: missing service name")
		usage()
	}

	env.ServiceDir = os.Args[2]

	env.Mode = strCommand
	env.Provider = provSvcName[0]
	env.Service = provSvcName[1]

	if len(provSvcName) >= 3 {
		env.Name = provSvcName[2]
	}

	var err error
	if len(os.Args) >= 4 {
		env.ScriptStart, err = strconv.Atoi(os.Args[3])
		if err != nil {
			log.Fatalf("awwan: can not convert start parameter %s: %s",
				os.Args[3], err.Error())
		}
	}

	if env.ScriptStart < 0 {
		env.ScriptStart = 0
	}

	if len(os.Args) >= 5 {
		if os.Args[4] == "-" {
			env.ScriptEnd = math.MaxInt32
		} else {
			env.ScriptEnd, err = strconv.Atoi(os.Args[4])
			if err != nil {
				log.Fatalf("can not convert end parameter %s: %s", os.Args[4], err.Error())
			}
		}
	} else {
		env.ScriptEnd = env.ScriptStart
	}

	if env.ScriptEnd < env.ScriptStart {
		env.ScriptEnd = env.ScriptStart
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
