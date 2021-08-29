package main

import (
	"log"
	"os"

	"github.com/shuLhan/share/lib/memfs"
)

func main() {
	logp := "internal/cmd/memfs_www"

	memfsWwwOpts := &memfs.Options{
		Root: "_www",
		Excludes: []string{
			`.*\.adoc`,
			`.*\.json`,
			`.*\.ts`,
			`/wui`,
		},
	}

	memfsWww, err := memfs.New(memfsWwwOpts)
	if err != nil {
		log.Printf("%s: %s", logp, err)
		os.Exit(1)
	}

	err = memfsWww.GoGenerate("awwan", "memfsWww", "memfs_www.go", "")
	if err != nil {
		log.Printf("%s: %s", logp, err)
		os.Exit(1)
	}
}
