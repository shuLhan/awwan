// SPDX-FileCopyrightText: 2023 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

//go:build !integration

package awwan

import (
	"os"
	"path/filepath"
	"testing"

	"git.sr.ht/~shulhan/pakakeh.go/lib/test"
	"git.sr.ht/~shulhan/pakakeh.go/lib/test/mock"
)

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
