// SPDX-FileCopyrightText: 2023 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

//go:build !integration

package awwan

import (
	"bytes"
	"os"
	"path/filepath"
	"testing"

	"github.com/shuLhan/share/lib/test"
	"github.com/shuLhan/share/lib/test/mock"
)

func TestAwwanDecrypt(t *testing.T) {
	type testCase struct {
		baseDir    string
		fileVault  string
		passphrase string
		expError   string
	}

	var cases = []testCase{{
		baseDir:    filepath.Join(`testdata`, `decrypt-with-passphrase`),
		fileVault:  `.awwan.env`,
		passphrase: "s3cret\r",
		expError:   `Decrypt: invalid extension, expecting .vault, got .env`,
	}, {
		baseDir:    filepath.Join(`testdata`, `decrypt-with-passphrase`),
		fileVault:  `.awwan.env.vault`,
		passphrase: "invalidpassphrase\r",
		expError:   `LoadPrivateKeyInteractive: x509: decryption password incorrect`,
	}, {
		baseDir:    filepath.Join(`testdata`, `decrypt-with-passphrase`),
		fileVault:  `.awwan.env.vault`,
		passphrase: "s3cret\r",
	}, {
		baseDir:    filepath.Join(`testdata`, `decrypt-wrong-privatekey`),
		fileVault:  `.awwan.env.vault`,
		passphrase: "news3cret\r",
		expError:   `Decrypt: DecryptOaep: crypto/rsa: decryption error`,
	}, {
		baseDir:   filepath.Join(`testdata`, `decrypt-with-passphrase`),
		fileVault: `.awwan.env.vault`,
		expError:  `Decrypt: private key is missing or not loaded`,
	}}

	var (
		mockrw = mock.ReadWriter{}

		c         testCase
		err       error
		filePlain string
		fileVault string
	)

	for _, c = range cases {
		var aww = Awwan{}
		fileVault = filepath.Join(c.baseDir, c.fileVault)

		err = aww.init(c.baseDir)
		if err != nil {
			test.Assert(t, `Decrypt`, c.expError, err.Error())
			continue
		}

		// Write the passphrase to standard input to be read
		// interactively.
		mockrw.BufRead.WriteString(c.passphrase)
		aww.cryptoc.termrw = &mockrw

		filePlain, err = aww.Decrypt(fileVault)
		if err != nil {
			test.Assert(t, `Decrypt`, c.expError, err.Error())
			continue
		}

		_, err = os.Stat(filePlain)
		if err != nil {
			t.Fatal(err)
		}
	}
}

func TestAwwanEncrypt(t *testing.T) {
	type testCase struct {
		baseDir    string
		file       string
		passphrase string
		expError   string
	}

	var cases = []testCase{{
		baseDir:    filepath.Join(`testdata`, `encrypt-with-passphrase`),
		file:       `.awwan.env`,
		passphrase: "s3cret\r",
	}, {
		baseDir:  filepath.Join(`testdata`, `encrypt-with-passphrase`),
		file:     `.awwan.env`,
		expError: `Encrypt: private key is missing or not loaded`,
	}, {
		baseDir:    filepath.Join(`testdata`, `encrypt-with-passphrase`),
		file:       `.awwan.env`,
		passphrase: "invalids3cret\r",
		expError:   `Encrypt: LoadPrivateKeyInteractive: x509: decryption password incorrect`,
	}, {
		baseDir:    filepath.Join(`testdata`, `encrypt-without-rsa`),
		file:       `.awwan.env`,
		passphrase: "s3cret\r",
		expError:   `Encrypt: the private key type must be RSA, got *ed25519.PrivateKey`,
	}, {
		baseDir: filepath.Join(`testdata`, `encrypt-without-passphrase`),
		file:    `.awwan.env`,
	}}

	var (
		mockrw = mock.ReadWriter{}

		c         testCase
		err       error
		filePlain string
		fileVault string
	)

	for _, c = range cases {
		var aww = Awwan{}
		filePlain = filepath.Join(c.baseDir, c.file)

		err = aww.init(c.baseDir)
		if err != nil {
			test.Assert(t, `Encrypt`, c.expError, err.Error())
			continue
		}

		// Write the passphrase to standard input to be read
		// interactively.
		mockrw.BufRead.WriteString(c.passphrase)
		aww.cryptoc.termrw = &mockrw

		fileVault, err = aww.Encrypt(filePlain)
		if err != nil {
			test.Assert(t, `Encrypt`, c.expError, err.Error())
			continue
		}

		_, err = os.Stat(fileVault)
		if err != nil {
			test.Assert(t, `os.Stat`, c.expError, err.Error())
		}
	}
}

func TestAwwanEncryptDecrypt_withPassFile(t *testing.T) {
	var (
		baseDir = filepath.Join(`testdata`, `encrypt-with-passfile`)

		tdata *test.Data
		err   error
	)

	tdata, err = test.LoadData(filepath.Join(baseDir, `test.data`))
	if err != nil {
		t.Fatal(err)
	}

	var aww *Awwan

	aww, err = New(baseDir)
	if err != nil {
		t.Fatal(err)
	}

	var (
		filePlain = filepath.Join(baseDir, `plain.txt`)
		fileVault string
	)

	fileVault, err = aww.Encrypt(filePlain)
	if err != nil {
		t.Fatal(err)
	}

	filePlain, err = aww.Decrypt(fileVault)
	if err != nil {
		t.Fatal(err)
	}

	var (
		expContent = tdata.Output[`plain.txt`]
		gotContent []byte
	)

	gotContent, err = os.ReadFile(filePlain)
	if err != nil {
		t.Fatal(err)
	}

	test.Assert(t, `content`, string(expContent), string(gotContent))
}

func TestAwwanLocal_withEncryption(t *testing.T) {
	type testCase struct {
		desc      string
		script    string
		lineRange string
		pass      string
		expError  string
		expStdout string
		expStderr string
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
		mockout = bytes.Buffer{}
		mockerr = bytes.Buffer{}
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
		expStdout: string(tdata.Output[`echo_encrypted`]),
	}, {
		desc:      `With encrypted value, no passphrase`,
		script:    filepath.Join(basedir, `local_encrypted.aww`),
		lineRange: `3`,
		expError:  string(tdata.Output[`echo_encrypted_no_pass`]),
	}, {
		desc:      `With encrypted value, invalid passphrase`,
		script:    filepath.Join(basedir, `local_encrypted.aww`),
		lineRange: `3`,
		pass:      "invalid\r",
		expError:  string(tdata.Output[`echo_encrypted_invalid_pass`]),
	}, {
		desc:      `With encrypted value in sub`,
		script:    filepath.Join(basedir, `sub`, `local_encrypted.aww`),
		lineRange: `1`,
		pass:      "s3cret\r",
		expStdout: string(tdata.Output[`sub_echo_encrypted`]),
	}}

	var c testCase

	for _, c = range cases {
		t.Logf(c.desc)

		var req = NewRequest(CommandModeLocal, c.script, c.lineRange)

		mockout.Reset()
		mockerr.Reset()
		req.stdout = &mockout
		req.stderr = &mockerr

		// Mock terminal to read passphrase for private key.
		mockrw.BufRead.Reset()
		mockrw.BufRead.WriteString(c.pass)
		aww.cryptoc.privateKey = nil

		err = aww.Local(req)
		if err != nil {
			test.Assert(t, `Local error`, c.expError, err.Error())
		}

		test.Assert(t, `stderr`, c.expStderr, mockerr.String())
		test.Assert(t, `stdout`, c.expStdout, mockout.String())
	}
}

func TestAwwanLocal_Get(t *testing.T) {
	type testCase struct {
		desc       string
		lineRange  string
		fileDest   string
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
		desc:       `Get_PlainFile`,
		lineRange:  `1`,
		fileDest:   filepath.Join(baseDir, `tmp`, `get_plain.txt`),
		expContent: string(tdata.Output[`tmp/get_plain.txt`]),
	}}

	var (
		script = filepath.Join(baseDir, `get.aww`)

		c          testCase
		gotContent []byte
	)

	for _, c = range cases {
		t.Log(c.desc)

		var req = NewRequest(CommandModeLocal, script, c.lineRange)

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

func TestAwwanLocalPut(t *testing.T) {
	type testCase struct {
		desc       string
		passphrase string
		lineRange  string
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
		desc:       `With text file`,
		lineRange:  `1`,
		fileDest:   filepath.Join(baseDir, `tmp`, `plain.txt`),
		expContent: string(tdata.Output[`tmp/plain.txt`]),
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
	}, {
		desc:      `With encrypted file, empty passphrase`,
		lineRange: `5`,
		expError:  string(tdata.Output[`encrypted_empty_passphrase.stderr`]),
	}, {
		desc:       `With encrypted file, invalid passphrase`,
		passphrase: "invalid\r",
		lineRange:  `5`,
		expError:   string(tdata.Output[`encrypted_invalid_passphrase`]),
	}}

	var (
		mockout = bytes.Buffer{}
		mockerr = bytes.Buffer{}
		mockrw  = mock.ReadWriter{}

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
		mockrw.BufRead.Reset()
		mockrw.BufRead.WriteString(c.passphrase)
		aww.cryptoc.termrw = &mockrw

		if len(c.fileDest) != 0 {
			_ = os.Remove(c.fileDest)
		}

		var req = NewRequest(CommandModeLocal, script, c.lineRange)

		mockout.Reset()
		mockerr.Reset()
		req.stdout = &mockout
		req.stderr = &mockerr

		err = aww.Local(req)
		if err != nil {
			test.Assert(t, `Local error`, c.expError, err.Error())
			continue
		}

		if len(c.fileDest) != 0 {
			gotContent, err = os.ReadFile(c.fileDest)
			if err != nil {
				t.Fatal(err)
			}

			test.Assert(t, `content`, c.expContent, string(gotContent))
		}
	}
}
