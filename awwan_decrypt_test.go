// SPDX-FileCopyrightText: 2023 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

//go:build !integration

package awwan

import (
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
