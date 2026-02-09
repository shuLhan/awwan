// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: 2023 M. Shulhan <ms@kilabit.info>

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

	"git.sr.ht/~shulhan/ciigo"
	"git.sr.ht/~shulhan/pakakeh.go/lib/http"
	"git.sr.ht/~shulhan/pakakeh.go/lib/memfs"
	"git.sr.ht/~shulhan/pakakeh.go/lib/systemd"

	"git.sr.ht/~shulhan/awwan/internal"
)

const defAddress = `127.0.0.1:4358`

// MemfsWww contains the embedded files under "_wui/doc" for website.
var MemfsWww *memfs.MemFS

func main() {
	var flagAddress = flag.String(`address`, defAddress, `Address to listen for client`)
	var flagDev = flag.Bool(`dev`, false, `Watch local changes`)

	flag.Parse()

	// mfsPub serve static files to public.
	// For example, program to be downloaded.
	var pubOpts = &memfs.Options{
		Root:        `/srv/awwan`,
		MaxFileSize: -1,
		TryDirect:   true,
	}
	if *flagDev {
		pubOpts.Root = `_bin`
	}

	var (
		mfsPub *memfs.MemFS
		err    error
	)

	mfsPub, err = memfs.New(pubOpts)
	if err != nil {
		log.Fatal(err)
	}

	MemfsWww.Merge(mfsPub)

	var (
		binName = filepath.Base(os.Args[0])
		qsignal = make(chan os.Signal, 1)
	)
	signal.Notify(qsignal, syscall.SIGQUIT, syscall.SIGTERM)
	go func() {
		var sig = <-qsignal
		log.Printf(`--- Stopping %s due to signal %v`, binName, sig)
		os.Exit(0)
	}()

	log.Printf(`--- Starting %s at http://%s with dev=%v`, binName, *flagAddress, *flagDev)

	var optsServe = ciigo.ServeOptions{
		ServerOptions: http.ServerOptions{
			Memfs:   MemfsWww,
			Address: *flagAddress,
		},
		IsDevelopment: *flagDev,
	}

	listeners, err := systemd.Listeners(true)
	if err != nil {
		log.Fatal(err)
	}
	if len(listeners) > 1 {
		log.Fatal(`too many listeners received for activation`)
	}
	if len(listeners) == 1 {
		optsServe.Listener = listeners[0]
		gotAddr := optsServe.Listener.Addr().String()
		if gotAddr != optsServe.Address {
			log.Fatalf(`invalid Listener address, got %s, want %s`,
				gotAddr, optsServe.Address)
		}
	}

	err = ciigo.Serve(optsServe, internal.DocConvertOpts)
	if err != nil {
		log.Fatal(err)
	}
}
