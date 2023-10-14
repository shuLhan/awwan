// SPDX-FileCopyrightText: 2023 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

//go:build integration

package awwan

import (
	"bytes"
	"os"
	"path/filepath"
	"testing"

	"github.com/shuLhan/share/lib/test"
	"github.com/shuLhan/share/lib/test/mock"
)

func TestAwwan_Local_SudoGet(t *testing.T) {
	type testCase struct {
		desc       string
		lineRange  string
		fileDest   string
		sudoPass   string
		expContent string
		expError   string
	}

	// Load the test data.
	var (
		baseDir      = filepath.Join(`testdata`, `local`)
		testdataFile = filepath.Join(baseDir, `get.data`)

		tdata *test.Data
		err   error
	)

	tdata, err = test.LoadData(testdataFile)
	if err != nil {
		t.Fatal(err)
	}

	var (
		mockTerm = mock.ReadWriter{}

		aww *Awwan
	)

	aww, err = New(baseDir)
	if err != nil {
		t.Fatal(err)
	}

	// Mock terminal to read passphrase for private key.
	aww.cryptoc.termrw = &mockTerm

	var cases = []testCase{{
		desc:       `WithPlainFile`,
		lineRange:  `3`,
		sudoPass:   "awwan\n",
		fileDest:   filepath.Join(baseDir, `tmp`, `os-release`),
		expContent: string(tdata.Output[`tmp/os-release`]),
	}, {
		desc:      `WithInvalidPassword`,
		lineRange: `3`,
		sudoPass:  "invalid\n",
		expError:  `Local: SudoCopy: ExecLocal: exit status 1`,
	}}

	var (
		script = filepath.Join(baseDir, `get.aww`)
		mockin = &mockStdin{}

		c          testCase
		gotContent []byte
	)

	for _, c = range cases {
		t.Log(c.desc)

		var req = NewRequest(CommandModeLocal, script, c.lineRange)

		// Mock the request stdin to read password from buffer.
		mockin.buf.Reset()
		mockin.buf.WriteString(c.sudoPass)
		req.stdin = mockin

		err = aww.Local(req)
		if err != nil {
			test.Assert(t, `Local: error`, c.expError, err.Error())
			continue
		}

		gotContent, err = os.ReadFile(c.fileDest)
		if err != nil {
			t.Fatal(err)
		}

		test.Assert(t, `content`, c.expContent, string(gotContent))
	}
}

func TestAwwan_Local_SudoPut(t *testing.T) {
	type testCase struct {
		desc       string
		lineRange  string
		keyPass    string
		sudoPass   string
		fileDest   string
		expError   string
		expContent string
	}

	// Load the test data output.
	var (
		baseDir = filepath.Join(`testdata`, `local`)
		script  = filepath.Join(baseDir, `put.aww`)

		tdata *test.Data
		err   error
	)

	tdata, err = test.LoadData(filepath.Join(baseDir, `put.data`))
	if err != nil {
		t.Fatal(err)
	}

	var cases = []testCase{{
		desc:       `WithTextFile`,
		lineRange:  `7-8`,
		sudoPass:   "awwan\nawwan\n",
		fileDest:   `/etc/plain.txt`,
		expContent: string(tdata.Output[`tmp/plain.txt`]),
	}}

	var (
		mockin   = &mockStdin{}
		mockout  = &bytes.Buffer{}
		mockTerm = mock.ReadWriter{}

		aww        *Awwan
		c          testCase
		gotContent []byte
	)
	for _, c = range cases {
		t.Log(c.desc)

		aww, err = New(baseDir)
		if err != nil {
			t.Fatal(err)
		}

		// Mock terminal to read passphrase for private key.
		mockTerm.BufRead.Reset()
		mockTerm.BufRead.WriteString(c.keyPass)
		aww.cryptoc.termrw = &mockTerm

		if len(c.fileDest) != 0 {
			_ = os.Remove(c.fileDest)
		}

		var req = NewRequest(CommandModeLocal, script, c.lineRange)

		mockin.buf.Reset()
		mockin.buf.WriteString(c.sudoPass)
		req.stdin = mockin

		err = aww.Local(req)
		if err != nil {
			test.Assert(t, `Local error`, c.expError, err.Error())
			continue
		}

		t.Log(mockout.String())

		gotContent, err = os.ReadFile(c.fileDest)
		if err != nil {
			t.Fatal(err)
		}

		test.Assert(t, `content`, c.expContent, string(gotContent))
	}
}
