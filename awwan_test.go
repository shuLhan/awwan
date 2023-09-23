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

		// Write the passphrase to standard input to be read
		// interactively.
		mockrw.BufRead.WriteString(c.passphrase)
		aww.termrw = &mockrw

		err = aww.init(c.baseDir)
		if err != nil {
			test.Assert(t, `Decrypt`, c.expError, err.Error())
			continue
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
		baseDir:  filepath.Join(`testdata`, `encrypt-with-passphrase`),
		file:     `.awwan.env`,
		expError: `Encrypt: private key is missing or not loaded`,
	}, {
		baseDir:    filepath.Join(`testdata`, `encrypt-with-passphrase`),
		file:       `.awwan.env`,
		passphrase: "invalids3cret\r",
		expError:   `LoadPrivateKeyInteractive: x509: decryption password incorrect`,
	}, {
		baseDir:    filepath.Join(`testdata`, `encrypt-without-rsa`),
		file:       `.awwan.env`,
		passphrase: "s3cret\r",
		expError:   `the private key type must be RSA, got *ed25519.PrivateKey`,
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

		// Write the passphrase to standard input to be read
		// interactively.
		mockrw.BufRead.WriteString(c.passphrase)
		aww.termrw = &mockrw

		err = aww.init(c.baseDir)
		if err != nil {
			test.Assert(t, `Encrypt`, c.expError, err.Error())
			continue
		}

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

func TestAwwanLocal_withEncryption(t *testing.T) {
	type testCase struct {
		script    string
		lineRange string
		tdataOut  string
	}

	var (
		tdata *test.Data
		err   error
	)

	tdata, err = test.LoadData(`testdata/encrypt/test.data`)
	if err != nil {
		t.Fatal(err)
	}

	var (
		basedir = filepath.Join(`testdata`, `encrypt`)
		mockout = bytes.Buffer{}
		mockerr = bytes.Buffer{}
		mockrw  = mock.ReadWriter{}
		aww     = Awwan{}
	)

	// Mock terminal to read passphrase for private key.
	mockrw.BufRead.WriteString("s3cret\r")
	aww.termrw = &mockrw

	err = aww.init(basedir)
	if err != nil {
		t.Fatal(err)
	}

	var cases = []testCase{{
		script:    filepath.Join(basedir, `local.aww`),
		lineRange: `1`,
		tdataOut:  `local.aww:1`,
	}, {
		script:    filepath.Join(basedir, `sub`, `local.aww`),
		lineRange: `1`,
		tdataOut:  `sub/local.aww:1`,
	}}

	var c testCase

	for _, c = range cases {
		var req = NewRequest(CommandModeLocal, c.script, c.lineRange)

		mockout.Reset()
		mockerr.Reset()
		req.stdout = &mockout
		req.stderr = &mockerr

		err = aww.Local(req)
		if err != nil {
			t.Fatal(err)
		}

		test.Assert(t, `stdout`, string(tdata.Output[c.tdataOut]), mockout.String())
	}
}
