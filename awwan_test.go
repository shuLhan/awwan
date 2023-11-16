// SPDX-FileCopyrightText: 2023 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"log"
	"os"
	"path/filepath"
	"testing"
)

func TestMain(m *testing.M) {
	defLogTimeFormat = `-`

	os.Exit(m.Run())
}

// testInitWorkspace initialize the awwan workspace with ".ssh" directory
// and optional "awwan.key" and "awwan.pass" file.
func testInitWorkspace(dir string, awwanKey, awwanPass []byte) {
	var (
		logp   = `testInitWorkspace`
		dirSsh = filepath.Join(dir, defSshDir)
	)

	var err = os.Mkdir(dirSsh, 0700)
	if err != nil {
		log.Fatalf(`%s: %s`, logp, err)
	}

	var file string
	if len(awwanKey) != 0 {
		file = filepath.Join(dirSsh, defFilePrivateKey)
		err = os.WriteFile(file, awwanKey, 0600)
		if err != nil {
			log.Fatalf(`%s: %s`, logp, err)
		}
	}

	if len(awwanPass) != 0 {
		file = filepath.Join(dirSsh, defFilePassphrase)
		err = os.WriteFile(file, awwanPass, 0600)
		if err != nil {
			log.Fatalf(`%s: %s`, logp, err)
		}
	}
}
