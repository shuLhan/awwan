// SPDX-FileCopyrightText: 2019 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"bytes"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"

	"git.sr.ht/~shulhan/awwan/internal"
	libcrypto "github.com/shuLhan/share/lib/crypto"
	"github.com/shuLhan/share/lib/http"
	"github.com/shuLhan/share/lib/memfs"
	"github.com/shuLhan/share/lib/ssh/config"
)

// Version current version of this module (library and program).
const Version = `0.7.0`

// List of command available for program awwan.
const (
	CommandModeLocal = "local"
	CommandModePlay  = "play"
	CommandModeServe = "serve"
)

const (
	defCacheDir      = ".cache"
	defEnvFileName   = "awwan.env" // The default awwan environment file name.
	defListenAddress = "127.0.0.1:17600"
	defSshConfig     = "config" // The default SSH config file name.
	defSshDir        = ".ssh"   // The default SSH config directory name.
	defTmpDir        = "/tmp"
)

// defFilePrivateKey define the default private key file name.
const defFilePrivateKey = `.awwan.key`

var (
	cmdMagicGet     = []byte("#get:")
	cmdMagicPut     = []byte("#put:")
	cmdMagicSudoGet = []byte("#get!")
	cmdMagicSudoPut = []byte("#put!")
	cmdMagicRequire = []byte("#require:")
	newLine         = []byte("\n")
)

// Awwan is the service that run script in local or remote.
// Awwan contains cache of sessions and cache of environment files.
type Awwan struct {
	BaseDir string

	// All the Host values from SSH config files.
	sshConfig *config.Config

	httpd     *http.Server // The HTTP server.
	memfsBase *memfs.MemFS // The files caches.

	// privateKey define the key for encrypt and decrypt command.
	privateKey *rsa.PrivateKey

	// termrw define the ReadWriter to prompt and read passphrase for
	// privateKey.
	// This field should be nil, only used during testing.
	termrw io.ReadWriter

	bufout bytes.Buffer
	buferr bytes.Buffer
}

// New create and initialize new Awwan service using baseDir as the root of
// Awwan workspace.
// If baseDir is empty, it will set to current working directory.
func New(baseDir string) (aww *Awwan, err error) {
	var (
		logp = "New"
	)

	aww = &Awwan{}

	if len(baseDir) > 0 {
		baseDir, err = filepath.Abs(baseDir)
		if err != nil {
			return nil, fmt.Errorf("%s: %w", logp, err)
		}
	}

	aww.BaseDir, err = lookupBaseDir(baseDir)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	fmt.Printf("--- BaseDir: %s\n", aww.BaseDir)

	return aww, nil
}

// Encrypt the file using private key from file "{{.BaseDir}}/.awwan.key".
// The encrypted file output will be on the same file path with ".vault"
// extension.
func (aww *Awwan) Encrypt(file string) (err error) {
	var (
		logp      = `Encrypt`
		fileVault = file + `.vault`
	)

	if aww.privateKey == nil {
		err = aww.loadPrivateKey()
		if err != nil {
			return fmt.Errorf(`%s: %w`, logp, err)
		}
	}

	var src []byte

	src, err = os.ReadFile(file)
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}

	var (
		hash  = sha256.New()
		label = []byte(`awwan`)

		ciphertext []byte
	)

	ciphertext, err = rsa.EncryptOAEP(hash, rand.Reader, &aww.privateKey.PublicKey, src, label)
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}

	err = os.WriteFile(fileVault, ciphertext, 0600)
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}

	return nil
}

// Local execute the script in the local machine using shell.
func (aww *Awwan) Local(req *Request) (err error) {
	if len(req.lineRange.list) == 0 {
		// No position to be executed.
		return nil
	}

	var (
		logp = "Local"

		ses        *Session
		sessionDir string
	)

	req.scriptPath = filepath.Clean(req.Script)
	req.scriptPath, err = filepath.Abs(req.scriptPath)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	sessionDir = filepath.Dir(req.scriptPath)

	ses, err = NewSession(aww.BaseDir, sessionDir)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	err = ses.loadEnvFromPaths()
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	if len(req.Content) == 0 {
		req.script, err = NewScriptForLocal(ses, req.scriptPath)
	} else {
		req.script, err = ParseScriptForLocal(ses, req.Content)
	}
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	// Create temporary directory.
	err = os.MkdirAll(ses.tmpDir, 0700)
	if err != nil {
		return fmt.Errorf("%s: %s: %w", logp, ses.tmpDir, err)
	}
	defer func() {
		err = os.RemoveAll(ses.tmpDir)
		if err != nil {
			log.Printf("%s: %s", logp, err)
		}
	}()

	var pos linePosition
	for _, pos = range req.lineRange.list {
		err = ses.executeRequires(req, pos)
		if err != nil {
			return fmt.Errorf("%s:%w", logp, err)
		}

		ses.executeScriptOnLocal(req, pos)
	}

	return nil
}

// Play execute the script in the remote machine using SSH.
func (aww *Awwan) Play(req *Request) (err error) {
	if len(req.lineRange.list) == 0 {
		// No position to be executed.
		return nil
	}

	var (
		logp = "Play"

		sessionDir string
		ses        *Session
		sshSection *config.Section
		mkdirStmt  string
		rmdirStmt  string
	)

	req.scriptPath = filepath.Clean(req.Script)
	req.scriptPath, err = filepath.Abs(req.scriptPath)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	sessionDir = filepath.Dir(req.scriptPath)

	ses, err = NewSession(aww.BaseDir, sessionDir)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	err = ses.loadEnvFromPaths()
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	if aww.sshConfig == nil {
		err = aww.loadSshConfig()
		if err != nil {
			return fmt.Errorf("%s: %w", logp, err)
		}
	}

	sshSection = aww.sshConfig.Get(ses.hostname)
	if sshSection == nil {
		return fmt.Errorf("%s: can not find Host %q in SSH config", logp, ses.hostname)
	}

	err = ses.initSSHClient(req, sshSection)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	if len(req.Content) == 0 {
		req.script, err = NewScriptForRemote(ses, req.scriptPath)
	} else {
		req.script, err = ParseScriptForRemote(ses, req.Content)
	}
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	// Create temporary directory ...
	mkdirStmt = fmt.Sprintf("mkdir %s", ses.tmpDir)

	err = ses.sshClient.Execute(mkdirStmt)
	if err != nil {
		return fmt.Errorf("%s: %s: %w", logp, mkdirStmt, err)
	}
	defer func() {
		rmdirStmt = fmt.Sprintf("rm -rf %s", ses.tmpDir)
		err = ses.sshClient.Execute(rmdirStmt)
		if err != nil {
			log.Printf("%s: %s", logp, err)
		}
	}()

	var pos linePosition
	for _, pos = range req.lineRange.list {
		err = ses.executeRequires(req, pos)
		if err != nil {
			return fmt.Errorf("%s: %w", logp, err)
		}

		ses.executeScriptOnRemote(req, pos)
	}

	return nil
}

// Serve start the web-user interface that serve awwan actions through HTTP.
func (aww *Awwan) Serve() (err error) {
	var (
		logp          = "Serve"
		envDev        = os.Getenv(internal.EnvDevelopment)
		memfsBaseOpts = &memfs.Options{
			Root: aww.BaseDir,
			Excludes: []string{
				`.*/\.git`,
				"node_modules",
				"vendor",
				`.*\.(bz|bz2|gz|iso|jar|tar|xz|zip)`,
			},
			TryDirect: true, // Only store the file structures in the memory.
		}

		serverOpts *http.ServerOptions
	)

	aww.memfsBase, err = memfs.New(memfsBaseOpts)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	if len(envDev) > 0 {
		go internal.Watch()
	}

	serverOpts = &http.ServerOptions{
		Memfs:   internal.MemfsWww,
		Address: defListenAddress,
	}
	aww.httpd, err = http.NewServer(serverOpts)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	err = aww.registerHttpApis()
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	fmt.Printf("--- Starting HTTP server at http://%s\n", serverOpts.Address)

	return aww.httpd.Start()
}

// loadSshConfig load all SSH config from user's home and the awwan base
// directory.
func (aww *Awwan) loadSshConfig() (err error) {
	var (
		logp = "loadSshConfig"

		baseDirConfig *config.Config
		homeDir       string
		configFile    string
	)

	homeDir, err = os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	configFile = filepath.Join(homeDir, defSshDir, defSshConfig)
	aww.sshConfig, err = config.Load(configFile)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	configFile = filepath.Join(aww.BaseDir, defSshDir, defSshConfig)

	baseDirConfig, err = config.Load(configFile)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}
	if baseDirConfig == nil {
		return nil
	}
	aww.sshConfig.Prepend(baseDirConfig)

	return nil
}

// loadPrivateKey from file "{{.BaseDir}}/.awwan.key".
func (aww *Awwan) loadPrivateKey() (err error) {
	var (
		fileKey = filepath.Join(aww.BaseDir, defFilePrivateKey)

		pkey crypto.PrivateKey
		ok   bool
	)

	pkey, err = libcrypto.LoadPrivateKeyInteractive(aww.termrw, fileKey)
	if err != nil {
		return err
	}

	aww.privateKey, ok = pkey.(*rsa.PrivateKey)
	if !ok {
		return fmt.Errorf(`the private key type must be RSA, got %T`, pkey)
	}

	return nil
}

// lookupBaseDir find the directory that contains ".ssh" directory from
// current working directory until "/", as the base working directory of
// awwan.
func lookupBaseDir(baseDir string) (dir string, err error) {
	var (
		logp  = "lookupBaseDir"
		found bool
	)

	if len(baseDir) > 0 {
		_, err = os.Stat(filepath.Join(baseDir, defSshDir))
		if err != nil {
			return "", fmt.Errorf("%s: cannot find .ssh directory on %s", logp, baseDir)
		}
		return baseDir, nil
	}

	dir, err = os.Getwd()
	if err != nil {
		return "", fmt.Errorf("%s: %w", logp, err)
	}

	for dir != "/" {
		_, err = os.Stat(filepath.Join(dir, defSshDir))
		if err == nil {
			found = true
			break
		}
		if os.IsNotExist(err) {
			dir = filepath.Dir(dir)
			continue
		}
		return "", fmt.Errorf("%s: %w", logp, err)
	}
	if !found {
		return "", fmt.Errorf("%s: cannot find .ssh directory", logp)
	}
	return dir, nil
}
