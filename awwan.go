// SPDX-FileCopyrightText: 2019 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"git.sr.ht/~shulhan/pakakeh.go/lib/ini"
	"git.sr.ht/~shulhan/pakakeh.go/lib/sshconfig"

	"git.sr.ht/~shulhan/awwan/internal"
)

// Version current version of this module (library and program).
var Version = `0.12.0`

// osGetwd define the handler to get current working directory.
//
// This variable will be overriden in testing to test running awwan in sub
// directory of workspace.
var osGetwd = os.Getwd

// timeNow define a function that return the current time.
//
// This variable will be overriden in testing to mock time.
var timeNow = time.Now

// List of command available for program awwan.
const (
	CommandModeDecrypt = `decrypt`
	CommandModeEncrypt = `encrypt`
	CommandModeEnvGet  = `env-get`
	CommandModeEnvSet  = `env-set`
	CommandModeLocal   = `local`
	CommandModePlay    = `play`
	CommandModeServe   = `serve`
)

const (
	defCacheDir    = `.cache`
	defEnvFileName = `awwan.env` // The default awwan environment file name.
	defSSHConfig   = `config`    // The default SSH config file name.
	defSSHDir      = `.ssh`      // The default SSH config directory name.
)

// defEncryptExt default file extension for encrypted file.
const defEncryptExt = `.vault`

// defFileEnvVault default awwan environment file name that is encrypted.
const defFileEnvVault = `.awwan.env.vault`

// defTmpDirLocal default temporary directory in local.
const defTmpDirLocal = `.cache/`

// defTmpDirPlay default temporary directory in remote.
const defTmpDirPlay = `~/.cache/awwan`

// Awwan is the service that run script in local or remote.
// Awwan contains cache of sessions and cache of environment files.
type Awwan struct {
	cryptoc *cryptoContext

	// All the Host values from SSH config files.
	sshConfig *sshconfig.Config

	httpd *httpServer

	BaseDir string

	// currDir contains the current working directory.
	currDir string
}

// New create and initialize new Awwan service using baseDir as the root of
// Awwan workspace.
// If baseDir is empty, it will set to current working directory.
func New(baseDir string) (aww *Awwan, err error) {
	var (
		logp = "New"
	)

	aww = &Awwan{}

	err = aww.init(baseDir)
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}

	return aww, nil
}

func (aww *Awwan) init(baseDir string) (err error) {
	if len(baseDir) > 0 {
		baseDir, err = filepath.Abs(baseDir)
		if err != nil {
			return err
		}
	}

	aww.currDir, err = osGetwd()
	if err != nil {
		return err
	}

	aww.BaseDir, err = lookupBaseDir(baseDir, aww.currDir)
	if err != nil {
		return err
	}

	log.Printf(`--- BaseDir: %s`, aww.BaseDir)

	aww.cryptoc = newCryptoContext(aww.BaseDir)

	return nil
}

// Decrypt the file using private key from file
// "{{.BaseDir}}/.ssh/awwan.key".
// The encrypted file must have extension ".vault", otherwise it will return
// an error.
// The decrypted file output will be written in the same directory without
// the ".vault" extension in filePlain.
func (aww *Awwan) Decrypt(fileVault string) (filePlain string, err error) {
	var (
		logp = `Decrypt`
		ext  = filepath.Ext(fileVault)
	)

	if ext != defEncryptExt {
		return ``, fmt.Errorf(`%s: invalid extension, expecting %s, got %s`, logp, defEncryptExt, ext)
	}

	var ciphertext []byte

	ciphertext, err = os.ReadFile(fileVault)
	if err != nil {
		return ``, fmt.Errorf(`%s: %w`, logp, err)
	}

	var plaintext []byte

	plaintext, err = aww.cryptoc.decrypt(ciphertext)
	if err != nil {
		return ``, fmt.Errorf(`%s: %w`, logp, err)
	}

	filePlain = strings.TrimSuffix(fileVault, defEncryptExt)

	err = os.WriteFile(filePlain, plaintext, 0600)
	if err != nil {
		return ``, fmt.Errorf(`%s: %w`, logp, err)
	}

	return filePlain, nil
}

// Encrypt the file using private key from file
// "{{.BaseDir}}/.ssh/awwan.key".
// The encrypted file output will be on the same file path with ".vault"
// extension in fileVault.
func (aww *Awwan) Encrypt(file string) (fileVault string, err error) {
	var logp = `Encrypt`

	var src []byte

	src, err = os.ReadFile(file)
	if err != nil {
		return ``, fmt.Errorf(`%s: %w`, logp, err)
	}

	var ciphertext []byte

	ciphertext, err = aww.cryptoc.encrypt(src)
	if err != nil {
		return ``, fmt.Errorf(`%s: %w`, logp, err)
	}

	fileVault = file + `.vault`

	err = os.WriteFile(fileVault, ciphertext, 0600)
	if err != nil {
		return ``, fmt.Errorf(`%s: %w`, logp, err)
	}

	return fileVault, nil
}

// EnvGet get the value of environment based on the key.
// This method is similar to [Session.Val] when executed inside the script.
//
// The dir parameter is optional, its define the directory where environment
// files will be loaded, recursively, from BaseDir to dir.
// If its empty default to the current directory.
//
// The key parameter is using the "<section>:<sub>:<name>" format.
//
// If the key is not exist it will return an empty string.
func (aww *Awwan) EnvGet(dir, key string) (val string, err error) {
	var logp = `EnvGet`

	dir = strings.TrimSpace(dir)
	if len(dir) == 0 {
		dir = aww.currDir
	}

	key = strings.TrimSpace(key)
	if len(key) == 0 {
		return ``, fmt.Errorf(`%s: empty key`, logp)
	}

	var unqkey string

	unqkey, err = strconv.Unquote(key)
	if err == nil {
		key = unqkey
	}

	var ses *Session

	ses, err = NewSession(aww, dir)
	if err != nil {
		return ``, fmt.Errorf(`%s: %w`, logp, err)
	}

	val = ses.vars.Val(key)

	return val, nil
}

// EnvKeys load environment files from BaseDir to path and return all its
// keys.
// The path is optional, default to BaseDir if its empty.
func (aww *Awwan) EnvKeys(path string) (keys []string, err error) {
	var (
		logp = `EnvKeys`

		dir string
		fi  os.FileInfo
	)

	if path == `` {
		path = aww.BaseDir
	}

	fi, err = os.Stat(path)
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}

	if fi.IsDir() {
		dir = path
	} else {
		dir = filepath.Dir(path)
	}

	var ses *Session

	ses, err = NewSession(aww, dir)
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}

	keys = ses.vars.Keys()

	return keys, nil
}

// EnvSet set the value in the environment file based on the key.
//
// The file parameter point to "awwan.env" or INI formatted file.
//
// The key is using the "<section>:<sub>:<name>" format.
func (aww *Awwan) EnvSet(file, key, val string) (err error) {
	var logp = `EnvSet`

	file = strings.TrimSpace(file)
	if len(file) == 0 {
		return fmt.Errorf(`%s: empty file`, logp)
	}

	key = strings.TrimSpace(key)
	if len(key) == 0 {
		return fmt.Errorf(`%s: empty key`, logp)
	}

	val = strings.TrimSpace(val)
	if len(val) == 0 {
		return fmt.Errorf(`%s: empty value`, logp)
	}

	var (
		tags   []string
		unqkey string
	)
	unqkey, err = strconv.Unquote(key)
	if err == nil {
		key = unqkey
	}

	tags = ini.ParseTag(key)

	if len(tags[0]) == 0 {
		return fmt.Errorf(`%s: missing section in key`, logp)
	}
	if len(tags[2]) == 0 {
		return fmt.Errorf(`%s: missing name in key`, logp)
	}

	var env *ini.Ini

	env, err = ini.Open(file)
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}

	var ok bool

	ok = env.Set(tags[0], tags[1], tags[2], val)
	if !ok {
		return fmt.Errorf(`%s: failed to set environment`, logp)
	}

	err = env.Save(file)
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}

	return nil
}

// Local execute the script in the local machine using shell.
func (aww *Awwan) Local(ctx context.Context, req *ExecRequest) (err error) {
	var (
		logp       = `Local`
		sessionDir = filepath.Dir(req.scriptPath)

		ses *Session
		pos linePosition
	)

	if len(req.lineRange.list) == 0 {
		// No position to be executed.
		goto out
	}

	ses, err = NewSession(aww, sessionDir)
	if err != nil {
		goto out
	}

	if len(req.Content) == 0 {
		req.script, err = NewScript(ses, req.scriptPath)
	} else {
		req.script, err = ParseScript(ses, req.scriptPath, req.Content)
	}
	if err != nil {
		goto out
	}

	// Create temporary directory.
	err = os.MkdirAll(ses.dirTmp, 0700)
	if err != nil {
		goto out
	}

	req.mlog.Outf(`=== BEGIN: %s %s %s`, req.Mode, req.Script, req.LineRange)
	for _, pos = range req.lineRange.list {
		select {
		case <-ctx.Done():
			err = ctx.Err()
			goto out
		default:
			err = ses.executeRequires(ctx, req, pos)
			if err != nil {
				goto out
			}

			err = ses.executeScriptOnLocal(ctx, req, pos)
			if err != nil {
				goto out
			}
		}
	}
	req.mlog.Outf(`=== END: %s %s %s`, req.Mode, req.Script, req.LineRange)
out:
	if err != nil {
		req.mlog.Errf(`!!! %s`, err)
		err = fmt.Errorf(`%s: %w`, logp, err)
	}
	req.close()
	return err
}

// Play execute the script in the remote machine using SSH.
func (aww *Awwan) Play(ctx context.Context, req *ExecRequest) (err error) {
	var (
		logp       = `Play`
		sessionDir = filepath.Dir(req.scriptPath)

		ses        *Session
		sshSection *sshconfig.Section
		pos        linePosition
	)

	if len(req.lineRange.list) == 0 {
		// No position to be executed.
		goto out
	}

	ses, err = NewSession(aww, sessionDir)
	if err != nil {
		goto out
	}

	// Always load the SSH config, in case we run on "serve" and
	// .ssh/config changed by user.

	err = aww.loadSSHConfig()
	if err != nil {
		goto out
	}

	sshSection = aww.sshConfig.Get(ses.hostname)
	if sshSection == nil {
		err = fmt.Errorf(`can not find Host %q in SSH config`, ses.hostname)
		goto out
	}

	err = ses.initSSHClient(req, sshSection)
	if err != nil {
		goto out
	}

	if len(req.Content) == 0 {
		req.script, err = NewScript(ses, req.scriptPath)
	} else {
		req.script, err = ParseScript(ses, req.scriptPath, req.Content)
	}
	if err != nil {
		goto out
	}

	req.mlog.Outf(`=== BEGIN: %s %s %s`, req.Mode, req.Script, req.LineRange)
	for _, pos = range req.lineRange.list {
		select {
		case <-ctx.Done():
			err = ctx.Err()
			goto out
		default:
			err = ses.executeRequires(ctx, req, pos)
			if err != nil {
				goto out
			}

			err = ses.executeScriptOnRemote(ctx, req, pos)
			if err != nil {
				goto out
			}
		}
	}
	req.mlog.Outf(`=== END: %s %s %s`, req.Mode, req.Script, req.LineRange)
out:
	if ses != nil {
		var errclose = ses.close()
		if errclose != nil {
			req.mlog.Errf(`!!! %s`, errclose)
		}
	}
	if err != nil {
		req.mlog.Errf(`!!! %s`, err)
		err = fmt.Errorf(`%s: %s`, logp, err)
	}
	req.close()
	return err
}

// Serve start the web-user interface that serve awwan through HTTP.
func (aww *Awwan) Serve(address string, isDev bool) (err error) {
	var logp = `Serve`

	if isDev {
		go internal.Watch()
	}

	aww.httpd, err = newHTTPServer(aww, address)
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}

	return aww.httpd.start()
}

// loadSSHConfig load all SSH config from user's home and the awwan base
// directory.
func (aww *Awwan) loadSSHConfig() (err error) {
	var (
		logp = `loadSSHConfig`

		baseDirConfig *sshconfig.Config
		homeDir       string
		configFile    string
	)

	homeDir, err = os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	configFile = filepath.Join(homeDir, defSSHDir, defSSHConfig)
	aww.sshConfig, err = sshconfig.Load(configFile)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	configFile = filepath.Join(aww.BaseDir, defSSHDir, defSSHConfig)

	baseDirConfig, err = sshconfig.Load(configFile)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}
	if baseDirConfig == nil {
		return nil
	}
	aww.sshConfig.Merge(baseDirConfig)

	return nil
}

// lookupBaseDir find the directory that contains ".ssh" directory from
// current working directory until "/", as the base working directory of
// awwan.
func lookupBaseDir(baseDir, currDir string) (dir string, err error) {
	var (
		logp  = "lookupBaseDir"
		found bool
	)

	if len(baseDir) > 0 {
		_, err = os.Stat(filepath.Join(baseDir, defSSHDir))
		if err != nil {
			return "", fmt.Errorf("%s: cannot find .ssh directory on %s", logp, baseDir)
		}
		return baseDir, nil
	}

	dir = currDir

	for dir != "/" {
		_, err = os.Stat(filepath.Join(dir, defSSHDir))
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

// relativePath return the relative path based on dir.
// It will return path without dir prefix on success or unchanged if dir is
// not a prefix of path or has any error.
func relativePath(dir, path string) (relpath string) {
	var err error
	relpath, err = filepath.Rel(dir, path)
	if err != nil {
		relpath = path
	}
	return relpath
}
