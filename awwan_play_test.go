// SPDX-FileCopyrightText: 2023 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

//go:build integration

package awwan

import (
	"io/fs"
	"os"
	"path/filepath"
	"testing"

	"github.com/shuLhan/share/lib/test"
)

type testCaseGetPut struct {
	desc      string
	fileDest  string
	lineRange string

	expContent string
	expError   string

	expMode fs.FileMode
}

func TestAwwan_Play_Get(t *testing.T) {
	var (
		baseDir    = `testdata/play`
		scriptDir  = filepath.Join(baseDir, `awwanssh.test`)
		scriptFile = filepath.Join(scriptDir, `get.aww`)

		tdata *test.Data
		aww   *Awwan
		err   error
	)

	tdata, err = test.LoadData(filepath.Join(scriptDir, `get_test.data`))
	if err != nil {
		t.Fatal(err)
	}

	aww, err = New(baseDir)
	if err != nil {
		t.Fatal(err)
	}

	var cases = []testCaseGetPut{{
		desc:      `WithoutPermission`,
		lineRange: `3`,
		expError:  string(tdata.Output[`WithoutPermission:error`]),
	}, {
		desc:       `WithMode`,
		lineRange:  `7`,
		fileDest:   filepath.Join(scriptDir, `tmp`, `get_with_mode.txt`),
		expContent: string(tdata.Output[`/etc/os-release`]),
		expMode:    0624,
	}, {
		desc:       `WithOwner`,
		lineRange:  `12`,
		fileDest:   filepath.Join(scriptDir, `tmp`, `get_with_owner.txt`),
		expContent: string(tdata.Output[`/etc/os-release`]),
		expMode:    0644,
		expError:   string(tdata.Output[`WithOwner:error`]),
	}}

	var (
		c          testCaseGetPut
		fi         os.FileInfo
		gotContent []byte
	)

	for _, c = range cases {
		t.Log(c.desc)

		if len(c.fileDest) != 0 {
			_ = os.Remove(c.fileDest)
		}

		var req = NewRequest(CommandModePlay, scriptFile, c.lineRange)

		err = aww.Play(req)
		if err != nil {
			test.Assert(t, `play error`, c.expError, err.Error())
		}

		if len(c.fileDest) == 0 {
			continue
		}

		// File successfully copied but maybe error when setting
		// owner or permission.

		gotContent, err = os.ReadFile(c.fileDest)
		if err != nil {
			t.Fatal(err)
		}

		test.Assert(t, `content`, c.expContent, string(gotContent))

		fi, err = os.Stat(c.fileDest)
		if err != nil {
			t.Fatal(err)
		}

		test.Assert(t, `mode`, c.expMode, fi.Mode().Perm())
	}
}

func TestAwwan_Play_Put(t *testing.T) {
	var (
		baseDir    = `testdata/play`
		scriptDir  = filepath.Join(baseDir, `awwanssh.test`)
		scriptFile = filepath.Join(scriptDir, `put.aww`)

		tdata *test.Data
		aww   *Awwan
		err   error
	)

	tdata, err = test.LoadData(filepath.Join(scriptDir, `put_test.data`))
	if err != nil {
		t.Fatal(err)
	}

	aww, err = New(baseDir)
	if err != nil {
		t.Fatal(err)
	}

	var cases = []testCaseGetPut{{
		desc:      `WithoutPermission`,
		lineRange: `3`,
		expError:  string(tdata.Output[`WithoutPermission:error`]),
	}, {
		desc:       `WithMode`,
		lineRange:  `7`,
		fileDest:   `/home/awwanssh/put_with_mode.txt`,
		expContent: string(tdata.Output[`plain.txt`]),
		expMode:    0624,
	}, {
		desc:       `WithOwner`,
		lineRange:  `12`,
		fileDest:   `/home/awwanssh/put_with_owner.txt`,
		expContent: string(tdata.Output[`plain.txt`]),
		expMode:    0666,
		expError:   string(tdata.Output[`WithOwner:error`]),
	}}

	var (
		c          testCaseGetPut
		fi         os.FileInfo
		gotContent []byte
	)

	for _, c = range cases {
		t.Log(c.desc)

		if len(c.fileDest) != 0 {
			_ = os.Remove(c.fileDest)
		}

		var req = NewRequest(CommandModePlay, scriptFile, c.lineRange)

		err = aww.Play(req)
		if err != nil {
			test.Assert(t, `play error`, c.expError, err.Error())
		}

		if len(c.fileDest) == 0 {
			continue
		}

		// File successfully copied but maybe error when setting
		// owner or permission.

		gotContent, err = os.ReadFile(c.fileDest)
		if err != nil {
			t.Fatal(err)
		}

		test.Assert(t, `content`, c.expContent, string(gotContent))

		fi, err = os.Stat(c.fileDest)
		if err != nil {
			t.Fatal(err)
		}

		test.Assert(t, `mode`, c.expMode, fi.Mode().Perm())
	}
}
