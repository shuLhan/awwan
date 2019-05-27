// Copyright 2019, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package awwan

import (
	"log"
	"os"
	"path/filepath"
	"text/template"

	libio "github.com/shuLhan/share/lib/io"
)

const cacheDir = ".cache"

//
// parseTemplate read the file input "in" and apply the environment variables,
// and write the result to ".cache" directory.
//
func parseTemplate(env *Environment, in string) (out string) {
	if libio.IsBinary(in) {
		return in
	}

	outDir := filepath.Join(env.BaseDir, cacheDir, filepath.Dir(in))
	base := filepath.Base(in)
	out = filepath.Join(outDir, base)

	err := os.MkdirAll(outDir, 0700)
	if err != nil {
		log.Fatalf("parseTemplate %s: %s\n", in, err)
	}

	tmpl, err := template.ParseFiles(in)
	if err != nil {
		log.Fatalf("parseTemplate %s: %s\n", in, err)
	}

	f, err := os.Create(out)
	if err != nil {
		log.Fatalf("parseTemplate: %s\n", err)
	}

	err = tmpl.Execute(f, env)
	if err != nil {
		log.Fatalf("parseTemplate: %s\n", err)
	}

	err = f.Close()
	if err != nil {
		log.Fatalf("parseTemplate: %s\n", err)
	}

	return out
}
