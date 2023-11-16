// SPDX-FileCopyrightText: 2023 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"os"
	"path/filepath"
	"testing"
)

func TestMain(m *testing.M) {
	defLogTimeFormat = `-`

	os.Exit(m.Run())
}

func testInitWorkspace(dir string) {
	var path = filepath.Join(dir, defSshDir)

	var err = os.Mkdir(path, 0700)
	if err != nil {
		panic(err)
	}
}
