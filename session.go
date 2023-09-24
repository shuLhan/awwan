// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"bytes"
	"errors"
	"fmt"
	"io/fs"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"text/template"

	"github.com/shuLhan/share/lib/ascii"
	"github.com/shuLhan/share/lib/ini"
	libos "github.com/shuLhan/share/lib/os"
	"github.com/shuLhan/share/lib/ssh/config"
)

// Session manage and cache SSH client and list of scripts.
// One session have one SSH client, but may contains more than one script.
type Session struct {
	cryptoc *cryptoContext

	sshc *sshClient

	vars ini.Ini

	BaseDir   string
	ScriptDir string

	SSHKey  string // The value of "IdentityFile" in SSH config.
	SSHUser string // The value of "User" in SSH config.
	SSHHost string // The value of "Hostname" in configuration.
	SSHPort string // The value of "Port" in configuration.

	hostname string
	tmpDir   string
	paths    []string
}

// NewSession create and initialize the new session based on Awwan base
// directory and the session directory.
func NewSession(aww *Awwan, sessionDir string) (ses *Session, err error) {
	var (
		logp = `NewSession`

		randomString string
	)

	ses = &Session{
		cryptoc: aww.cryptoc,

		BaseDir:   aww.BaseDir,
		ScriptDir: sessionDir,
		hostname:  filepath.Base(sessionDir),
	}

	err = ses.generatePaths()
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	err = ses.loadEnvFromPaths()
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}

	randomString = string(ascii.Random([]byte(ascii.LettersNumber), 16))
	ses.tmpDir = filepath.Join(defTmpDir, randomString)

	return ses, nil
}

// Subs return list of sub sections that have the same section name.
func (ses *Session) Subs(secName string) (subs []*ini.Section) {
	return ses.vars.Subs(secName)
}

// Vars return all variables in section and/or subsection as map of string.
func (ses *Session) Vars(path string) (vars map[string]string) {
	return ses.vars.Vars(path)
}

// Val return the last variable value defined in key path.
func (ses *Session) Val(keyPath string) string {
	return ses.vars.Val(keyPath)
}

// Vals return all variable values as slice of string.
func (ses *Session) Vals(keyPath string) []string {
	return ses.vars.Vals(keyPath)
}

// Copy file in local system.
func (ses *Session) Copy(stmt *Statement) (err error) {
	var logp = `Copy`

	if len(stmt.cmd) == 0 {
		return fmt.Errorf("%s: missing source argument", logp)
	}
	if len(stmt.args) == 0 {
		return fmt.Errorf("%s: missing destination argument", logp)
	}
	if len(stmt.args) > 1 {
		return fmt.Errorf("%s: two or more destination arguments is given", logp)
	}

	var (
		src     string
		isVault bool
	)

	src, isVault, err = ses.generateFileInput(stmt.cmd)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	err = libos.Copy(stmt.args[0], src)
	if isVault {
		// Delete the decrypted file on exit.
		var errRemove = os.Remove(src)
		if errRemove != nil {
			log.Printf(`%s: %s`, logp, errRemove)
		}
	}
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}
	return nil
}

// Get copy file from remote to local.
func (ses *Session) Get(stmt *Statement) (err error) {
	var logp = "Get"

	if len(stmt.cmd) == 0 {
		return fmt.Errorf("%s: missing source argument", logp)
	}
	if len(stmt.args) == 0 {
		return fmt.Errorf("%s: missing destination argument", logp)
	}
	if len(stmt.args) > 1 {
		return fmt.Errorf("%s: two or more destination arguments is given", logp)
	}

	err = ses.sshc.get(stmt.cmd, stmt.args[0])
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}

	return nil
}

// Put copy file from local to remote system.
func (ses *Session) Put(stmt *Statement) (err error) {
	var logp = `Put`

	if len(stmt.cmd) == 0 {
		return fmt.Errorf("%s: missing source argument", logp)
	}
	if len(stmt.args) == 0 {
		return fmt.Errorf("%s: missing destination argument", logp)
	}
	if len(stmt.args) > 1 {
		return fmt.Errorf("%s: two or more destination arguments is given", logp)
	}

	var (
		local   string
		isVault bool
	)

	local, isVault, err = ses.generateFileInput(stmt.cmd)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	err = ses.sshc.put(local, stmt.args[0])
	if isVault {
		var errRemove = os.Remove(local)
		if errRemove != nil {
			log.Printf(`%s: %s`, logp, errRemove)
		}
	}
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}
	return nil
}

// SudoCopy copy file in local system using sudo.
func (ses *Session) SudoCopy(req *Request, stmt *Statement, withParseInput bool) (err error) {
	var (
		logp = "SudoCopy"

		sudoCp *Statement
		src    string
	)

	if len(stmt.cmd) == 0 {
		return fmt.Errorf("%s: missing source argument", logp)
	}
	if len(stmt.args) == 0 {
		return fmt.Errorf("%s: missing destination argument", logp)
	}
	if len(stmt.args) > 1 {
		return fmt.Errorf("%s: two or more destination arguments is given", logp)
	}

	var isVault bool

	if withParseInput {
		src, isVault, err = ses.generateFileInput(stmt.cmd)
		if err != nil {
			return fmt.Errorf("%s: %w", logp, err)
		}
	} else {
		src = stmt.cmd
	}

	sudoCp = &Statement{
		kind: statementKindDefault,
		cmd:  "sudo",
		args: []string{"cp", src, stmt.args[0]},
		raw:  []byte("sudo cp " + src + " " + stmt.args[0]),
	}

	err = ses.ExecLocal(req, sudoCp)
	if isVault {
		var errRemove = os.Remove(src)
		if errRemove != nil {
			log.Printf(`%s: %s`, logp, errRemove)
		}
	}
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}
	return nil
}

// SudoGet copy file from remote that can be accessed by root on remote, to
// local.
func (ses *Session) SudoGet(stmt *Statement) (err error) {
	var logp = `SudoGet`

	if len(stmt.cmd) == 0 {
		return fmt.Errorf("%s: missing source argument", logp)
	}
	if len(stmt.args) == 0 {
		return fmt.Errorf("%s: missing destination argument", logp)
	}
	if len(stmt.args) > 1 {
		return fmt.Errorf("%s: two or more destination arguments is given", logp)
	}

	err = ses.sshc.sudoGet(stmt.cmd, stmt.args[0])
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}
	return nil
}

// SudoPut copy file from local to remote using sudo.
func (ses *Session) SudoPut(stmt *Statement) (err error) {
	var logp = `SudoPut`

	if len(stmt.cmd) == 0 {
		return fmt.Errorf("%s: missing source argument", logp)
	}
	if len(stmt.args) == 0 {
		return fmt.Errorf("%s: missing destination argument", logp)
	}
	if len(stmt.args) > 1 {
		return fmt.Errorf("%s: two or more destination arguments is given", logp)
	}

	var (
		local   string
		isVault bool
	)

	local, isVault, err = ses.generateFileInput(stmt.cmd)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	err = ses.sshc.sudoPut(local, stmt.args[0])
	if isVault {
		var errRemove = os.Remove(local)
		if errRemove != nil {
			log.Printf(`%s: %s`, logp, errRemove)
		}
	}
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	return nil
}

// ExecLocal execute the command with its arguments in local environment where
// the output and error send to os.Stdout and os.Stderr respectively.
func (ses *Session) ExecLocal(req *Request, stmt *Statement) (err error) {
	var (
		args = string(stmt.raw)
		cmd  = exec.Command(`/bin/sh`, `-c`, args)
	)
	cmd.Stdout = req.stdout
	cmd.Stderr = req.stderr
	return cmd.Run()
}

// executeRequires run the "#require:" statements from line 0 until
// the start argument in the local system.
func (ses *Session) executeRequires(req *Request, pos linePosition) (err error) {
	var (
		stmt *Statement
		x    int64
	)

	for x = 0; x <= pos.start; x++ {
		stmt = req.script.requires[x]
		if stmt == nil {
			continue
		}

		fmt.Fprintf(req.stdout, "--- require %d: %v\n", x, stmt)

		err = ses.ExecLocal(req, stmt)
		if err != nil {
			return err
		}
	}
	return nil
}

func (ses *Session) executeScriptOnLocal(req *Request, pos linePosition) {
	var max = int64(len(req.script.stmts))
	if pos.start > max {
		return
	}
	if pos.end == 0 {
		pos.end = max - 1
	}

	for x := pos.start; x <= pos.end; x++ {
		stmt := req.script.stmts[x]
		if stmt == nil {
			continue
		}
		if stmt.kind == statementKindComment {
			continue
		}
		if stmt.kind == statementKindRequire {
			continue
		}

		fmt.Fprintf(req.stdout, "\n--> local: %3d: %s\n", x, stmt.raw)

		var err error
		switch stmt.kind {
		case statementKindDefault:
			err = ses.ExecLocal(req, stmt)
		case statementKindGet:
			err = ses.Copy(stmt)
		case statementKindPut:
			err = ses.Copy(stmt)
		case statementKindSudoGet:
			err = ses.SudoCopy(req, stmt, false)
		case statementKindSudoPut:
			err = ses.SudoCopy(req, stmt, true)
		}
		if err != nil {
			fmt.Fprintf(req.stderr, "!!! %s\n", err)
			break
		}
	}
}

func (ses *Session) executeScriptOnRemote(req *Request, pos linePosition) {
	var max = int64(len(req.script.stmts))
	if pos.start > max {
		return
	}
	if pos.end == 0 {
		pos.end = max - 1
	}

	for x := pos.start; x <= pos.end; x++ {
		stmt := req.script.stmts[x]
		if stmt == nil {
			continue
		}
		if stmt.kind == statementKindComment {
			continue
		}
		if stmt.kind == statementKindRequire {
			continue
		}

		fmt.Fprintf(req.stdout, "\n--> %s: %3d: %s %s\n",
			ses.sshc.conn, x, stmt.cmd, stmt.args)

		var err error
		switch stmt.kind {
		case statementKindDefault:
			err = ses.sshc.conn.Execute(string(stmt.raw))
		case statementKindGet:
			err = ses.Get(stmt)
		case statementKindPut:
			err = ses.Put(stmt)
		case statementKindSudoGet:
			err = ses.SudoGet(stmt)
		case statementKindSudoPut:
			err = ses.SudoPut(stmt)
		}
		if err != nil {
			fmt.Fprintf(req.stderr, "!!! %s\n", err)
			break
		}
	}
}

// generateFileInput read the content of file input "in", apply the session
// variables, and write the result to ".cache" directory, and return the
// output file path as "out".
//
// For example, if the input file path is "{{.BaseDir}}/a/b/script" then the
// output file path would be "{{.BaseDir}}/.cache/a/b/script".
func (ses *Session) generateFileInput(in string) (out string, isVault bool, err error) {
	// Check if the file is binary first, since binary file will not get
	// encrypted.
	if libos.IsBinary(in) {
		return in, false, nil
	}

	var (
		logp = `generateFileInput`

		contentInput []byte
	)

	contentInput, isVault, err = ses.loadFileInput(in)
	if err != nil {
		return ``, false, fmt.Errorf(`%s: %w`, logp, err)
	}

	var tmpl = template.New(in)

	tmpl, err = tmpl.Parse(string(contentInput))
	if err != nil {
		return ``, false, fmt.Errorf(`%s: %w`, logp, err)
	}

	var contentOut bytes.Buffer

	err = tmpl.Execute(&contentOut, ses)
	if err != nil {
		return ``, false, fmt.Errorf(`%s: %w`, logp, err)
	}

	var (
		outDir = filepath.Join(ses.BaseDir, defCacheDir, filepath.Dir(in))
		base   = filepath.Base(in)
	)

	err = os.MkdirAll(outDir, 0700)
	if err != nil {
		return ``, false, fmt.Errorf(`%s: %s: %w`, logp, outDir, err)
	}

	out = filepath.Join(outDir, base)

	err = os.WriteFile(out, contentOut.Bytes(), 0600)
	if err != nil {
		return ``, false, fmt.Errorf(`%s: %s: %w`, logp, out, err)
	}

	return out, isVault, nil
}

// generatePaths using baseDir return all paths from BaseDir to ScriptDir.
func (ses *Session) generatePaths() (err error) {
	logp := "generatePaths"

	absScriptDir, err := filepath.Abs(ses.ScriptDir)
	if err != nil {
		return fmt.Errorf("%s: %s: %w", logp, absScriptDir, err)
	}

	if !strings.HasPrefix(absScriptDir, ses.BaseDir) {
		return fmt.Errorf("%s: %q must be under %q", logp, ses.ScriptDir, ses.BaseDir)
	}

	rel, err := filepath.Rel(ses.BaseDir, absScriptDir)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	subs := strings.Split(rel, string(os.PathSeparator))
	path := ses.BaseDir

	ses.paths = make([]string, 0, len(subs)+1)
	ses.paths = append(ses.paths, path)

	for x := 0; x < len(subs); x++ {
		if subs[x] == "." || subs[x] == "" {
			continue
		}
		path = filepath.Join(path, subs[x])
		ses.paths = append(ses.paths, path)
	}
	return nil
}

func (ses *Session) initSSHClient(req *Request, sshSection *config.Section) (err error) {
	var (
		logp          = "initSSHClient"
		lastIdentFile string
	)

	if len(sshSection.IdentityFile) > 0 {
		lastIdentFile = sshSection.IdentityFile[len(sshSection.IdentityFile)-1]
	}

	ses.sshc, err = newSshClient(sshSection, ses.tmpDir, req.stdout, req.stderr)
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}

	ses.SSHKey = lastIdentFile
	ses.SSHUser = sshSection.User()
	ses.SSHHost = sshSection.Hostname()
	ses.SSHPort = sshSection.Port()

	return nil
}

// loadEnvFromPaths load environment file from each directory in paths.
func (ses *Session) loadEnvFromPaths() (err error) {
	var (
		logp = "loadEnvFromPaths"

		path     string
		awwanEnv string
	)

	for _, path = range ses.paths {
		// Load unencrypted "awwan.env".
		awwanEnv = filepath.Join(path, defEnvFileName)

		err = ses.loadFileEnv(awwanEnv, false)
		if err != nil {
			return fmt.Errorf(`%s: %w`, logp, err)
		}

		// Load encrypted ".awwan.env.vault".
		awwanEnv = filepath.Join(path, defFileEnvVault)

		err = ses.loadFileEnv(awwanEnv, true)
		if err != nil {
			return fmt.Errorf(`%s: %w`, logp, err)
		}
	}
	return nil
}

func (ses *Session) loadFileEnv(awwanEnv string, isVault bool) (err error) {
	var content []byte

	content, err = os.ReadFile(awwanEnv)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return fmt.Errorf(`%s: %w`, awwanEnv, err)
	}

	fmt.Printf("--- loading %q ...\n", awwanEnv)

	if isVault {
		content, err = ses.cryptoc.decrypt(content)
		if err != nil {
			return err
		}
	}

	err = ses.loadRawEnv(content)
	if err != nil {
		return err
	}

	return nil
}

// loadFileInput read the input file for Copy or Put operation.
// If the original input file does not exist, try loading the encrypted file
// with ".vault" extension.
//
// On success, it will return the content of file and true if the file is
// from encrypted file .vault.
func (ses *Session) loadFileInput(path string) (content []byte, isVault bool, err error) {
	content, err = os.ReadFile(path)
	if err == nil {
		return content, false, nil
	}
	if !errors.Is(err, fs.ErrNotExist) {
		return nil, false, err
	}

	path = path + defEncryptExt

	content, err = os.ReadFile(path)
	if err != nil {
		return nil, false, err
	}

	content, err = ses.cryptoc.decrypt(content)
	if err != nil {
		return nil, false, err
	}

	return content, true, nil
}

func (ses *Session) loadRawEnv(content []byte) (err error) {
	var in *ini.Ini

	in, err = ini.Parse(content)
	if err != nil {
		return err
	}

	in.Prune()
	ses.vars.Rebase(in)

	return nil
}
