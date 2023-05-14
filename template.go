// SPDX-FileCopyrightText: 2019 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"fmt"
	"os"
	"path/filepath"
	"text/template"

	libos "github.com/shuLhan/share/lib/os"
)

// parseTemplate read the file input "in" and apply the session variables,
// and write the result to ".cache" directory.
func parseTemplate(ses *Session, in string) (out string, err error) {
	var (
		logp = "parseTemplate"

		tmpl   *template.Template
		f      *os.File
		outDir string
		base   string
	)

	if libos.IsBinary(in) {
		return in, nil
	}

	outDir = filepath.Join(ses.BaseDir, defCacheDir, filepath.Dir(in))
	base = filepath.Base(in)
	out = filepath.Join(outDir, base)

	err = os.MkdirAll(outDir, 0700)
	if err != nil {
		return "", fmt.Errorf("%s %s: %w", logp, in, err)
	}

	tmpl, err = template.ParseFiles(in)
	if err != nil {
		return "", fmt.Errorf("%s %s: %w", logp, in, err)
	}

	f, err = os.Create(out)
	if err != nil {
		return "", fmt.Errorf("%s %s: %w", logp, in, err)
	}

	err = tmpl.Execute(f, ses)
	if err != nil {
		return "", fmt.Errorf("%s %s: %w", logp, in, err)
	}

	err = f.Close()
	if err != nil {
		return "", fmt.Errorf("%s %s: %w", logp, in, err)
	}

	return out, nil
}
