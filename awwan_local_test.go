// SPDX-FileCopyrightText: 2023 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

//go:build !integration

package awwan

import (
	"bytes"
	"context"
	"io/fs"
	"os"
	"path/filepath"
	"sync"
	"testing"
	"time"

	"git.sr.ht/~shulhan/pakakeh.go/lib/mlog"
	"git.sr.ht/~shulhan/pakakeh.go/lib/test"
	"git.sr.ht/~shulhan/pakakeh.go/lib/test/mock"
)

type lockBuffer struct {
	b bytes.Buffer
	sync.Mutex
}

func (lb *lockBuffer) Reset() {
	lb.Lock()
	lb.b.Reset()
	lb.Unlock()
}

func (lb *lockBuffer) String() (s string) {
	lb.Lock()
	s = lb.b.String()
	lb.Unlock()
	return s
}

func (lb *lockBuffer) Write(p []byte) (n int, err error) {
	lb.Lock()
	n, err = lb.b.Write(p)
	lb.Unlock()
	return n, err
}

func TestAwwanLocal(t *testing.T) {
	type testCase struct {
		scriptFile string
		lineRange  string
		tagOutput  string
		expError   string
	}

	var (
		baseDir   = `testdata/local`
		tdataFile = filepath.Join(baseDir, `local_test.data`)

		tdata *test.Data
		err   error
	)

	tdata, err = test.LoadData(tdataFile)
	if err != nil {
		t.Fatal(err)
	}

	var (
		mockrw = mock.ReadWriter{}
		aww    *Awwan
	)

	aww, err = New(baseDir)
	if err != nil {
		t.Fatal(err)
	}

	// Mock terminal to read passphrase for private key.
	aww.cryptoc.termrw = &mockrw

	var cases = []testCase{{
		scriptFile: filepath.Join(baseDir, `local.aww`),
		lineRange:  `1-`,
		tagOutput:  `local:1-`,
	}, {
		scriptFile: filepath.Join(baseDir, `local.aww`),
		lineRange:  `100-`,
		tagOutput:  `local:100-`,
	}, {
		// Pass directory as script.
		scriptFile: filepath.Join(baseDir, `sub`),
		lineRange:  `1-`,
		expError:   `NewExecRequest: "testdata/local/sub" is a directory`,
	}}

	var (
		ctx = context.Background()

		req *ExecRequest
		c   testCase
	)
	var logw lockBuffer
	for _, c = range cases {
		req, err = NewExecRequest(CommandModeLocal, c.scriptFile, c.lineRange)
		if err != nil {
			test.Assert(t, `error`, c.expError, err.Error())
			continue
		}

		logw.Reset()
		req.registerLogWriter(`output`, &logw)

		err = aww.Local(ctx, req)
		if err != nil {
			test.Assert(t, `error`, c.expError, err.Error())
			continue
		}

		test.Assert(t, `stdout`, string(tdata.Output[c.tagOutput]), logw.String())
	}
}

func TestAwwanLocalCancel(t *testing.T) {
	var (
		baseDir    = `testdata/local`
		scriptFile = filepath.Join(baseDir, `cancel.aww`)
		tdataFile  = filepath.Join(baseDir, `cancel_test.data`)
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

	var execReq *ExecRequest

	execReq, err = NewExecRequest(CommandModeLocal, scriptFile, `1`)
	if err != nil {
		t.Fatal(err)
	}

	var logw lockBuffer

	execReq.registerLogWriter(`output`, &logw)

	var ctx = context.Background()

	go func() {
		var err2 = aww.Local(ctx, execReq)
		t.Logf(`LocalCancel: error: %s`, err2)
	}()

	// Wait for actual exec.CommandContext to run ...
	time.Sleep(500 * time.Millisecond)

	test.Assert(t, `stdout`, string(tdata.Output[`cancel`]), logw.String())
}

func TestAwwanLocal_Get(t *testing.T) {
	type testCase struct {
		desc       string
		lineRange  string
		fileDest   string
		expContent string
		expError   string

		expFileMode fs.FileMode
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
		mockrw = mock.ReadWriter{}

		aww *Awwan
	)

	aww, err = New(baseDir)
	if err != nil {
		t.Fatal(err)
	}

	// Mock terminal to read passphrase for private key.
	aww.cryptoc.termrw = &mockrw

	var cases = []testCase{{
		desc:        `PlainFile`,
		lineRange:   `1`,
		fileDest:    filepath.Join(baseDir, `tmp`, `get_plain.txt`),
		expContent:  string(tdata.Output[`tmp/get_plain.txt`]),
		expFileMode: fs.FileMode(384),
	}, {
		desc:        `WithMode`,
		lineRange:   `5`,
		fileDest:    filepath.Join(baseDir, `tmp`, `get_with_mode.txt`),
		expContent:  string(tdata.Output[`tmp/get_plain.txt`]),
		expFileMode: fs.FileMode(0561),
	}, {
		desc:      `WithOwner`,
		lineRange: `7`,
		expError:  `Local: Copy: chown root:root: exit status 1`,
	}}

	var (
		ctx    = context.Background()
		script = filepath.Join(baseDir, `get.aww`)

		c          testCase
		gotContent []byte
	)

	for _, c = range cases {
		t.Log(c.desc)

		_ = os.Remove(c.fileDest)

		var req *ExecRequest

		req, err = NewExecRequest(CommandModeLocal, script, c.lineRange)
		if err != nil {
			t.Fatal(err)
		}

		err = aww.Local(ctx, req)
		if err != nil {
			test.Assert(t, `Local: error`, c.expError, err.Error())
			continue
		}

		gotContent, err = os.ReadFile(c.fileDest)
		if err != nil {
			t.Fatal(err)
		}

		test.Assert(t, `content`, c.expContent, string(gotContent))

		var fi os.FileInfo

		fi, err = os.Stat(c.fileDest)
		if err != nil {
			t.Fatal(err)
		}

		test.Assert(t, `mode`, c.expFileMode, fi.Mode())
	}
}

func TestAwwanLocal_Put(t *testing.T) {
	type testCase struct {
		desc       string
		passphrase string
		lineRange  string
		fileDest   string
		expError   string
		expContent string
		expMode    fs.FileMode
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
		desc:       `With text file`,
		lineRange:  `1`,
		fileDest:   filepath.Join(baseDir, `tmp`, `plain.txt`),
		expContent: string(tdata.Output[`tmp/plain.txt`]),
		expMode:    384,
	}, {
		desc:      `With text file, one of value is encrypted`,
		lineRange: `3`,
		expError:  string(tdata.Output[`missing_val_encrypted`]),
	}, {
		desc:       `With encrypted file`,
		lineRange:  `5`,
		passphrase: "s3cret\r",
		fileDest:   filepath.Join(baseDir, `tmp`, `decrypted.txt`),
		expContent: string(tdata.Output[`tmp/decrypted.txt`]),
		expMode:    384,
	}, {
		desc:      `With encrypted file, empty passphrase`,
		lineRange: `5`,
		expError:  string(tdata.Output[`encrypted_empty_passphrase.stderr`]),
	}, {
		desc:       `With encrypted file, invalid passphrase`,
		passphrase: "invalid\r",
		lineRange:  `5`,
		expError:   string(tdata.Output[`encrypted_invalid_passphrase`]),
	}, {
		desc:       `With mode`,
		lineRange:  `10`,
		fileDest:   filepath.Join(baseDir, `tmp`, `put_with_mode.txt`),
		expContent: string(tdata.Output[`tmp/plain.txt`]),
		expMode:    0611,
	}, {
		desc:      `With owner`,
		lineRange: `12`,
		fileDest:  filepath.Join(baseDir, `tmp`, `put_with_owner.txt`),
		expError:  `Local: Copy: chown audio:audio: exit status 1`,
	}, {
		desc:       `With $noparse`,
		lineRange:  `18`,
		fileDest:   filepath.Join(baseDir, `tmp`, `plain_noparse.txt`),
		expContent: string(tdata.Output[`tmp/plain_noparse.txt`]),
		expMode:    0600,
	}}

	var (
		ctx    = context.Background()
		mockrw = mock.ReadWriter{}

		aww        *Awwan
		c          testCase
		gotContent []byte
	)
	for _, c = range cases {
		t.Log(c.desc)

		if len(c.fileDest) != 0 {
			_ = os.Remove(c.fileDest)
		}

		aww, err = New(baseDir)
		if err != nil {
			t.Fatal(err)
		}

		// Mock terminal to read passphrase for private key.
		mockrw.BufRead.Reset()
		mockrw.BufRead.WriteString(c.passphrase)
		aww.cryptoc.termrw = &mockrw

		if len(c.fileDest) != 0 {
			_ = os.Remove(c.fileDest)
		}

		var req *ExecRequest

		req, err = NewExecRequest(CommandModeLocal, script, c.lineRange)
		if err != nil {
			t.Fatal(err)
		}

		err = aww.Local(ctx, req)
		if err != nil {
			test.Assert(t, `Local error`, c.expError, err.Error())
			continue
		}

		if len(c.fileDest) == 0 {
			continue
		}

		gotContent, err = os.ReadFile(c.fileDest)
		if err != nil {
			t.Fatal(err)
		}

		test.Assert(t, `content`, c.expContent, string(gotContent))

		var fi os.FileInfo

		fi, err = os.Stat(c.fileDest)
		if err != nil {
			t.Fatal(err)
		}

		test.Assert(t, `mode`, c.expMode, fi.Mode())
	}
}

func TestAwwanLocal_withEncryption(t *testing.T) {
	type testCase struct {
		desc      string
		script    string
		lineRange string
		pass      string
		expError  string
		expStderr string
		expStdout string
	}

	var (
		tdata *test.Data
		err   error
	)

	tdata, err = test.LoadData(`testdata/local/local_encrypted.data`)
	if err != nil {
		t.Fatal(err)
	}

	var (
		basedir = filepath.Join(`testdata`, `local`)
		mockrw  = mock.ReadWriter{}
		aww     = Awwan{}
	)

	err = aww.init(basedir)
	if err != nil {
		t.Fatal(err)
	}

	aww.cryptoc.termrw = &mockrw

	var cases = []testCase{{
		desc:      `With encrypted value`,
		script:    filepath.Join(basedir, `local_encrypted.aww`),
		lineRange: `3`,
		pass:      "s3cret\r",
		expStderr: string(tdata.Output[`echo_encrypted:stderr`]),
		expStdout: string(tdata.Output[`echo_encrypted:stdout`]),
	}, {
		desc:      `With encrypted value, no passphrase`,
		script:    filepath.Join(basedir, `local_encrypted.aww`),
		lineRange: `3`,
		expError:  string(tdata.Output[`echo_encrypted_no_pass:error`]),
		expStderr: string(tdata.Output[`echo_encrypted_no_pass:stderr`]),
		expStdout: string(tdata.Output[`echo_encrypted_no_pass:stdout`]),
	}, {
		desc:      `With encrypted value, invalid passphrase`,
		script:    filepath.Join(basedir, `local_encrypted.aww`),
		lineRange: `3`,
		pass:      "invalid\r",
		expError:  string(tdata.Output[`echo_encrypted_invalid_pass:error`]),
		expStderr: string(tdata.Output[`echo_encrypted_invalid_pass:stderr`]),
		expStdout: string(tdata.Output[`echo_encrypted_invalid_pass:stdout`]),
	}, {
		desc:      `With encrypted value in sub`,
		script:    filepath.Join(basedir, `sub`, `local_encrypted.aww`),
		lineRange: `1`,
		pass:      "s3cret\r",
		expStderr: string(tdata.Output[`sub_echo_encrypted:stderr`]),
		expStdout: string(tdata.Output[`sub_echo_encrypted:stdout`]),
	}}

	var (
		ctx = context.Background()

		c   testCase
		req *ExecRequest
	)
	var testerr bytes.Buffer
	var namederr = mlog.NewNamedWriter(`testerr`, &testerr)
	var testout bytes.Buffer
	var namedout = mlog.NewNamedWriter(`testout`, &testout)
	for _, c = range cases {
		t.Log(c.desc)

		req, err = NewExecRequest(CommandModeLocal, c.script, c.lineRange)
		if err != nil {
			t.Fatal(err)
		}

		testerr.Reset()
		testout.Reset()
		req.mlog.RegisterErrorWriter(namederr)
		req.mlog.RegisterOutputWriter(namedout)

		// Mock terminal to read passphrase for private key.
		mockrw.BufRead.Reset()
		mockrw.BufRead.WriteString(c.pass)
		aww.cryptoc.privateKey = nil

		err = aww.Local(ctx, req)
		if err != nil {
			test.Assert(t, `Local error`, c.expError, err.Error())
		}

		test.Assert(t, c.desc+`: stderr`, c.expStderr, testerr.String())
		test.Assert(t, c.desc+`: stdout`, c.expStdout, testout.String())
	}
}
