// SPDX-FileCopyrightText: 2023 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"bytes"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"errors"
	"fmt"
	"hash"
	"io"
	"io/fs"
	"log"
	"os"
	"path/filepath"

	libcrypto "git.sr.ht/~shulhan/pakakeh.go/lib/crypto"
)

// defFilePrivateKey define the default private key file name.
const defFilePrivateKey = `awwan.key`

// defFilePassphrase define the file that contains passphrase for private
// key.
const defFilePassphrase = `awwan.pass`

// errPrivateKeyMissing returned when private key file is missing or not
// loaded when command require loading encrypted file.
var errPrivateKeyMissing = errors.New(`private key is missing or not loaded`)

// cryptoContext hold fields and operation for encryption and decryption.
type cryptoContext struct {
	hash hash.Hash

	// privateKey the key for encrypt and decrypt command.
	privateKey *rsa.PrivateKey

	// termrw the ReadWriter to prompt and read passphrase for
	// privateKey.
	// This field should be nil, only used during testing.
	termrw io.ReadWriter

	baseDir string

	label []byte
}

func newCryptoContext(baseDir string) (cryptoc *cryptoContext) {
	cryptoc = &cryptoContext{
		hash:    sha256.New(),
		baseDir: baseDir,
		label:   []byte(`awwan`),
	}
	return cryptoc
}

func (cryptoc *cryptoContext) decrypt(cipher []byte) (plain []byte, err error) {
	if cryptoc.privateKey == nil {
		err = cryptoc.loadPrivateKey()
		if err != nil {
			return nil, err
		}
		if cryptoc.privateKey == nil {
			return nil, errPrivateKeyMissing
		}
	}

	plain, err = libcrypto.DecryptOaep(cryptoc.hash, rand.Reader,
		cryptoc.privateKey, cipher, cryptoc.label)
	if err != nil {
		return nil, err
	}

	return plain, nil
}

func (cryptoc *cryptoContext) encrypt(plain []byte) (cipher []byte, err error) {
	if cryptoc.privateKey == nil {
		err = cryptoc.loadPrivateKey()
		if err != nil {
			return nil, err
		}
		if cryptoc.privateKey == nil {
			return nil, errPrivateKeyMissing
		}
	}

	cipher, err = libcrypto.EncryptOaep(cryptoc.hash, rand.Reader,
		&cryptoc.privateKey.PublicKey, plain, cryptoc.label)
	if err != nil {
		return nil, err
	}

	return cipher, nil
}

// loadPrivateKey from file "{{.BaseDir}}/.ssh/awwan.key" if its exist.
func (cryptoc *cryptoContext) loadPrivateKey() (err error) {
	var (
		fileKey = filepath.Join(cryptoc.baseDir, `.ssh`, defFilePrivateKey)

		pkey crypto.PrivateKey
		ok   bool
	)

	_, err = os.Stat(fileKey)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return nil
		}
		return err
	}

	var pass []byte

	pass, err = cryptoc.loadPassphrase()
	if err != nil {
		return err
	}

	log.Printf(`--- Loading private key file %q (enter to skip passphrase) ...`,
		relativePath(cryptoc.baseDir, fileKey))

	if len(pass) == 0 {
		pkey, err = libcrypto.LoadPrivateKeyInteractive(cryptoc.termrw, fileKey)
		if err != nil {
			if errors.Is(err, libcrypto.ErrEmptyPassphrase) {
				// Ignore empty passphrase error, in case the
				// command does not need to decrypt files when
				// running.
				return nil
			}
			return err
		}
	} else {
		pkey, err = libcrypto.LoadPrivateKey(fileKey, pass)
		if err != nil {
			return err
		}
	}

	cryptoc.privateKey, ok = pkey.(*rsa.PrivateKey)
	if !ok {
		return fmt.Errorf(`the private key type must be RSA, got %T`, pkey)
	}

	return nil
}

// loadPassphrase load passphrase from file ".ssh/awwan.pass".
func (cryptoc *cryptoContext) loadPassphrase() (pass []byte, err error) {
	var (
		logp     = `loadPassphrase`
		filePass = filepath.Join(cryptoc.baseDir, `.ssh`, defFilePassphrase)
	)

	_, err = os.Stat(filePass)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return nil, nil
		}
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}

	log.Printf(`--- Loading passphrase file %q ...`, relativePath(cryptoc.baseDir, filePass))

	pass, err = os.ReadFile(filePass)
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}

	pass = bytes.TrimSpace(pass)

	return pass, nil
}
