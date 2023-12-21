// SPDX-FileCopyrightText: 2023 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"log"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestMain(m *testing.M) {
	defLogTimeFormat = `----/--/-- --:--:--`

	timeNow = func() time.Time {
		return time.Date(2023, time.November, 26, 15, 21, 00, 00, time.UTC)
	}

	os.Exit(m.Run())
}

// testInitWorkspace initialize the awwan workspace with ".ssh" directory
// and optional "awwan.key" and "awwan.pass" file.
func testInitWorkspace(dir string, awwanKey, awwanPass []byte) {
	var (
		logp   = `testInitWorkspace`
		dirSSH = filepath.Join(dir, defSSHDir)
	)

	var err = os.Mkdir(dirSSH, 0700)
	if err != nil {
		log.Fatalf(`%s: %s`, logp, err)
	}

	var file string
	if len(awwanKey) != 0 {
		file = filepath.Join(dirSSH, defFilePrivateKey)
		err = os.WriteFile(file, awwanKey, 0600)
		if err != nil {
			log.Fatalf(`%s: %s`, logp, err)
		}
	}

	if len(awwanPass) != 0 {
		file = filepath.Join(dirSSH, defFilePassphrase)
		err = os.WriteFile(file, awwanPass, 0600)
		if err != nil {
			log.Fatalf(`%s: %s`, logp, err)
		}
	}
}

func mockOsGetwd(t *testing.T, dir string) {
	t.Cleanup(func() {
		osGetwd = os.Getwd
	})
	osGetwd = func() (string, error) {
		return dir, nil
	}
}
