// SPDX-FileCopyrightText: 2023 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

// Program www-awwan serve the awwan.org website.
//
// This command must be run/build from root repository.
package main

import (
	"flag"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"

	"git.sr.ht/~shulhan/awwan/internal"
	"git.sr.ht/~shulhan/ciigo"
	"github.com/shuLhan/share/lib/memfs"
)

// MemfsWww contains the embedded files under "_wui/doc" for website.
var MemfsWww *memfs.MemFS

func main() {
	var flagDev = flag.Bool(`dev`, false, `Watch local changes`)

	flag.Parse()

	var (
		binName   = filepath.Base(os.Args[0])
		optsServe = &ciigo.ServeOptions{
			Mfs:            MemfsWww,
			Address:        `127.0.0.1:4358`,
			ConvertOptions: internal.DocConvertOpts,
			IsDevelopment:  *flagDev,
		}

		err error
	)

	var qsignal = make(chan os.Signal, 1)
	signal.Notify(qsignal, syscall.SIGQUIT, syscall.SIGTERM)
	go func() {
		var sig = <-qsignal
		log.Printf(`--- Stopping %s due to signal %v`, binName, sig)
		os.Exit(0)
	}()

	log.Printf(`--- Starting %s at http://%s with dev=%v`, binName,
		optsServe.Address, *flagDev)

	err = ciigo.Serve(optsServe)
	if err != nil {
		log.Fatal(err)
	}
}
