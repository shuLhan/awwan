// SPDX-FileCopyrightText: 2023 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

//go:build !integration

package awwan

import (
	"bytes"
	"path/filepath"
	"testing"

	"github.com/shuLhan/share/lib/test"
	"github.com/shuLhan/share/lib/test/mock"
)

func TestAwwanLocal(t *testing.T) {
	var (
		baseDir    = `testdata/local`
		scriptDir  = baseDir
		scriptFile = filepath.Join(scriptDir, `local.aww`)
		tdataFile  = filepath.Join(scriptDir, `local_test.data`)
		mockrw     = mock.ReadWriter{}

		tdata *test.Data
		aww   *Awwan
		err   error
	)

	tdata, err = test.LoadData(tdataFile)
	if err != nil {
		t.Fatal(err)
	}

	aww, err = New(baseDir)
	if err != nil {
		t.Fatal(err)
	}

	// Mock terminal to read passphrase for private key.
	aww.cryptoc.termrw = &mockrw

	var (
		req = NewRequest(CommandModeLocal, scriptFile, `1-`)

		logw bytes.Buffer
	)

	req.registerLogWriter(`output`, &logw)

	err = aww.Local(req)
	if err != nil {
		t.Fatal(err)
	}

	var exp = string(tdata.Output[`local:output`])
	test.Assert(t, `stdout`, exp, logw.String())
}
