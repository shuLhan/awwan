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
