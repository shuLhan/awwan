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
	"github.com/shuLhan/share/lib/memfs"
)

var memFS *memfs.MemFS

func main() {
	var flagDev = flag.Bool(`dev`, false, `Watch local changes`)

	flag.Parse()

	var (
		binName          = filepath.Base(os.Args[0])
		cmd              = flag.Arg(0)
		ciigoConvertOpts = ciigo.ConvertOptions{
			Root:         `_www/doc`,
			HtmlTemplate: `_www/doc/template.gohtml`,
		}
	)

	switch cmd {
	case `embed`:
		doEmbed(ciigoConvertOpts)
		return
	}

	var (
		optsServe = &ciigo.ServeOptions{
			Mfs:            memFS,
			Address:        `127.0.0.1:4358`,
			ConvertOptions: ciigoConvertOpts,
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

// doEmbed embed the files in "_www/doc" into memfswww.
func doEmbed(ciigoConvertOpts ciigo.ConvertOptions) {
	var optsEmbed = ciigo.EmbedOptions{
		ConvertOptions: ciigoConvertOpts,
		EmbedOptions: memfs.EmbedOptions{
			PackageName: `main`,
			VarName:     `memFS`,
			GoFileName:  `internal/cmd/www-awwan/memfs.go`,
		},
	}

	var err = ciigo.GoEmbed(&optsEmbed)
	if err != nil {
		log.Fatalf(`doEmbed: %s`, err)
	}
}
