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
		baseDir:   filepath.Join(`testdata`, `decrypt-with-passphrase`),
		fileVault: `.awwan.env`,
		expError:  `Decrypt: invalid extension, expecting .vault, got .env`,
	}, {
		baseDir:    filepath.Join(`testdata`, `decrypt-with-passphrase`),
		fileVault:  `.awwan.env.vault`,
		passphrase: "invalidpassphrase\r",
		expError:   `Decrypt: LoadPrivateKeyInteractive: x509: decryption password incorrect`,
	}, {
		baseDir:    filepath.Join(`testdata`, `decrypt-with-passphrase`),
		fileVault:  `.awwan.env.vault`,
		passphrase: "s3cret\r",
	}, {
		baseDir:    filepath.Join(`testdata`, `decrypt-wrong-privatekey`),
		fileVault:  `.awwan.env.vault`,
		passphrase: "news3cret\r",
		expError:   `Decrypt: DecryptOaep: crypto/rsa: decryption error`,
	}}

	var (
		mockrw = mock.ReadWriter{}

		c         testCase
		aww       *Awwan
		err       error
		filePlain string
		fileVault string
	)

	for _, c = range cases {
		fileVault = filepath.Join(c.baseDir, c.fileVault)

		aww, err = New(c.baseDir)
		if err != nil {
			t.Fatal(err)
		}

		if len(c.passphrase) != 0 {
			// Write the passphrase to standard input to be read
			// interactively.
			mockrw.BufRead.WriteString(c.passphrase)
			aww.termrw = &mockrw
		} else {
			aww.termrw = nil
		}

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

		c   testCase
		aww *Awwan
		err error
	)

	for _, c = range cases {
		var (
			filePlain = filepath.Join(c.baseDir, c.file)
			fileVault = filepath.Join(c.baseDir, `.awwan.env.vault`)
		)

		aww, err = New(c.baseDir)
		if err != nil {
			t.Fatal(err)
		}

		if len(c.passphrase) != 0 {
			// Write the passphrase to standard input to be read
			// interactively.
			mockrw.BufRead.WriteString(c.passphrase)
			aww.termrw = &mockrw
		} else {
			aww.termrw = nil
		}

		err = aww.Encrypt(filePlain)
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
