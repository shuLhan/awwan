// SPDX-FileCopyrightText: 2023 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

//go:build integration

package awwan

import (
	"bytes"
	"context"
	"io/fs"
	"os"
	"path/filepath"
	"testing"

	"git.sr.ht/~shulhan/pakakeh.go/lib/test"
)

type testCaseGetPut struct {
	desc      string
	lineRange string

	sudoPass string
	fileDest string

	expContent string
	expError   string

	expMode fs.FileMode
}

func TestAwwan_Play_withLocal(t *testing.T) {
	type testCase struct {
		scriptFile string
		lineRange  string
		expOutput  string
		expError   string
	}

	var (
		baseDir   = `testdata/play`
		scriptDir = filepath.Join(baseDir, `awwanssh.test`)
		tdataFile = filepath.Join(scriptDir, `play_test.data`)

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

	var cases = []testCase{{
		scriptFile: filepath.Join(scriptDir, `play.aww`),
		lineRange:  `1-`,
		expOutput:  string(tdata.Output[`play_with_local:output`]),
	}, {
		scriptFile: filepath.Join(scriptDir, `tmp`),
		expError:   `NewExecRequest: "testdata/play/awwanssh.test/tmp" is a directory`,
	}}

	var (
		ctx = context.Background()

		c    testCase
		req  *ExecRequest
		logw bytes.Buffer
	)

	for _, c = range cases {
		req, err = NewExecRequest(CommandModePlay, c.scriptFile, c.lineRange)
		if err != nil {
			test.Assert(t, `NewExecRequest: error`, c.expError, err.Error())
			continue
		}

		logw.Reset()
		req.registerLogWriter(`output`, &logw)

		err = aww.Play(ctx, req)
		if err != nil {
			test.Assert(t, `Play: error`, c.expError, err.Error())
			continue
		}

		test.Assert(t, `Local`, c.expOutput, logw.String())
	}
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
		ctx = context.Background()

		req        *ExecRequest
		c          testCaseGetPut
		fi         os.FileInfo
		gotContent []byte
	)

	for _, c = range cases {
		t.Log(c.desc)

		if len(c.fileDest) != 0 {
			_ = os.Remove(c.fileDest)
		}

		req, err = NewExecRequest(CommandModePlay, scriptFile, c.lineRange)
		if err != nil {
			t.Fatal(err)
		}

		err = aww.Play(ctx, req)
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
		ctx = context.Background()

		req        *ExecRequest
		c          testCaseGetPut
		fi         os.FileInfo
		gotContent []byte
	)

	for _, c = range cases {
		t.Log(c.desc)

		if len(c.fileDest) != 0 {
			_ = os.Remove(c.fileDest)
		}

		req, err = NewExecRequest(CommandModePlay, scriptFile, c.lineRange)
		if err != nil {
			t.Fatal(err)
		}

		err = aww.Play(ctx, req)
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

func TestAwwan_Play_SudoGet(t *testing.T) {
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
		desc:       `WithMode`,
		lineRange:  `14`,
		sudoPass:   "awwan\n",
		fileDest:   filepath.Join(scriptDir, `tmp`, `sudoget_with_mode.txt`),
		expContent: string(tdata.Output[`/etc/crypttab`]),
		expMode:    0601,
	}, {
		desc:       `WithOwner`,
		lineRange:  `16`,
		sudoPass:   "awwan\n",
		fileDest:   filepath.Join(scriptDir, `tmp`, `sudoget_with_owner.txt`),
		expContent: string(tdata.Output[`/etc/crypttab`]),
		expMode:    420,
	}, {
		desc:       `WithOwnerAndMode`,
		lineRange:  `18`,
		sudoPass:   "awwan\nawwan\n",
		fileDest:   filepath.Join(scriptDir, `tmp`, `sudoget_with_owner_mode.txt`),
		expContent: string(tdata.Output[`/etc/crypttab`]),
		expMode:    0602,
	}}

	var (
		ctx    = context.Background()
		mockin = &mockStdin{}

		req        *ExecRequest
		c          testCaseGetPut
		fi         os.FileInfo
		gotContent []byte
	)

	for _, c = range cases {
		t.Log(c.desc)

		if len(c.fileDest) != 0 {
			_ = os.Remove(c.fileDest)
		}

		req, err = NewExecRequest(CommandModePlay, scriptFile, c.lineRange)
		if err != nil {
			t.Fatal(err)
		}

		// Mock the request stdin to read password from buffer.
		mockin.buf.Reset()
		mockin.buf.WriteString(c.sudoPass)
		req.stdin = mockin

		err = aww.Play(ctx, req)
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

func TestAwwan_Play_SudoPut(t *testing.T) {
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
		desc:       `WithMode`,
		lineRange:  `14`,
		fileDest:   `/home/awwanssh/sudoput_with_mode.txt`,
		expContent: string(tdata.Output[`plain.txt`]),
		expMode:    0604,
	}, {
		desc:       `WithOwner`,
		lineRange:  `16`,
		fileDest:   `/home/awwanssh/sudoput_with_owner.txt`,
		expContent: string(tdata.Output[`plain.txt`]),
		expMode:    0600,
	}, {
		desc:       `WithOwnerAndMode`,
		lineRange:  `18`,
		fileDest:   `/home/awwanssh/sudoput_with_owner_mode.txt`,
		expContent: string(tdata.Output[`plain.txt`]),
		expMode:    0602,
	}}

	var (
		ctx = context.Background()

		req        *ExecRequest
		c          testCaseGetPut
		fi         os.FileInfo
		gotContent []byte
	)

	for _, c = range cases {
		t.Log(c.desc)

		if len(c.fileDest) != 0 {
			_ = os.Remove(c.fileDest)
		}

		req, err = NewExecRequest(CommandModePlay, scriptFile, c.lineRange)
		if err != nil {
			t.Fatal(err)
		}

		err = aww.Play(ctx, req)
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
