// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io/fs"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"text/template"

	"git.sr.ht/~shulhan/pakakeh.go/lib/ini"
	libos "git.sr.ht/~shulhan/pakakeh.go/lib/os"
	libexec "git.sr.ht/~shulhan/pakakeh.go/lib/os/exec"
	"git.sr.ht/~shulhan/pakakeh.go/lib/sshconfig"
)

// Session manage environment and SSH client.
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
	dirTmp   string
	paths    []string
}

// NewSession create and initialize the new session based on Awwan base
// directory and the session directory.
func NewSession(aww *Awwan, sessionDir string) (ses *Session, err error) {
	var logp = `NewSession`

	log.Printf(`--- NewSession %q`, relativePath(aww.BaseDir, sessionDir))

	ses = &Session{
		cryptoc: aww.cryptoc,

		BaseDir:   aww.BaseDir,
		ScriptDir: sessionDir,
		hostname:  filepath.Base(sessionDir),
		dirTmp:    defTmpDirLocal,
	}

	err = ses.generatePaths()
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	err = ses.loadEnvFromPaths()
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}

	return ses, nil
}

// Subs return list of sub sections that have the same section name.
func (ses *Session) Subs(secName string) (subs []*ini.Section) {
	return ses.vars.Subs(secName)
}

// Vars return all variables in section and/or subsection as map of string.
// It will panic if the no variables found.
func (ses *Session) Vars(path string) (vars map[string]string) {
	vars = ses.vars.Vars(path)
	if len(vars) == 0 {
		var msg = fmt.Sprintf(`%q is empty`, path)
		panic(msg)
	}
	return vars
}

// Val return the last variable value defined in key path.
// It will panic if the value is empty.
func (ses *Session) Val(keyPath string) (val string) {
	val = ses.vars.Val(keyPath)
	if len(val) == 0 {
		var msg = fmt.Sprintf(`%q is empty`, keyPath)
		panic(msg)
	}
	return val
}

// Vals return all variable values as slice of string.
// It will panic if the no variables found.
func (ses *Session) Vals(keyPath string) (list []string) {
	list = ses.vars.Vals(keyPath)
	if len(list) == 0 {
		var msg = fmt.Sprintf(`%q is empty`, keyPath)
		panic(msg)
	}
	return list
}

// Copy file in local system.
func (ses *Session) Copy(req *ExecRequest, stmt *Statement) (err error) {
	var (
		logp = `Copy`
		src  = stmt.args[0]
		dst  = stmt.args[1]

		isVault bool
	)

	switch stmt.kind {
	case statementKindGet, statementKindSudoGet:
		// NO-OP.
	case statementKindPut, statementKindSudoPut:
		src, isVault, err = ses.generateFileInput(stmt, src)
		if err != nil {
			return fmt.Errorf(`%s: %w`, logp, err)
		}
	}

	err = libos.Copy(dst, src)
	if isVault {
		// Delete the decrypted file on exit.
		var errRemove = os.Remove(src)
		if errRemove != nil {
			req.mlog.Errf(`%s: %s`, logp, errRemove)
		}
	}
	if err != nil {
		return err
	}

	if stmt.mode != 0 {
		err = os.Chmod(dst, stmt.mode)
		if err != nil {
			return fmt.Errorf(`%s: %w`, logp, err)
		}
	}
	if len(stmt.owner) != 0 {
		var cmd = fmt.Sprintf(`chown %s %s`, stmt.owner, dst)
		err = libexec.Run(cmd, nil, nil)
		if err != nil {
			return fmt.Errorf(`%s: chown %s: %w`, logp, stmt.owner, err)
		}
	}
	return nil
}

// Get copy file from remote to local.
func (ses *Session) Get(stmt *Statement) (err error) {
	var (
		logp = `Get`
		src  = stmt.args[0]
		dst  = stmt.args[1]
	)

	err = ses.sshc.get(src, dst)
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}
	if stmt.mode != 0 {
		err = os.Chmod(dst, stmt.mode)
		if err != nil {
			return fmt.Errorf(`%s: chmod %o %q: %w`, logp, stmt.mode, dst, err)
		}
	}
	if len(stmt.owner) != 0 {
		var chownStmt = fmt.Sprintf(`chown %s %q`, stmt.owner, dst)
		err = libexec.Run(chownStmt, nil, nil)
		if err != nil {
			return fmt.Errorf(`%s: %s: %w`, logp, chownStmt, err)
		}
	}
	return nil
}

// Put copy file from local to remote system.
func (ses *Session) Put(ctx context.Context, req *ExecRequest, stmt *Statement) (err error) {
	var (
		logp = `Put`
		src  = stmt.args[0]
		dst  = stmt.args[1]

		isVault bool
	)

	src, isVault, err = ses.generateFileInput(stmt, src)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	err = ses.sshc.put(src, dst)
	if isVault {
		var errRemove = os.Remove(src)
		if errRemove != nil {
			req.mlog.Errf(`%s: %s`, logp, errRemove)
		}
	}
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}
	if stmt.mode != 0 {
		err = ses.sshc.chmod(ctx, dst, stmt.mode)
		if err != nil {
			return fmt.Errorf(`%s: %w`, logp, err)
		}
	}
	if len(stmt.owner) != 0 {
		err = ses.sshc.chown(ctx, dst, stmt.owner)
		if err != nil {
			return fmt.Errorf(`%s: %w`, logp, err)
		}
	}
	return nil
}

// SudoCopy copy file in local system using sudo.
func (ses *Session) SudoCopy(ctx context.Context, req *ExecRequest, stmt *Statement) (err error) {
	var (
		logp = `SudoCopy`
		src  = stmt.args[0]
		dst  = stmt.args[1]

		isVault bool
	)

	switch stmt.kind {
	case statementKindGet, statementKindSudoGet:
		// NO-OP.
	case statementKindPut, statementKindSudoPut:
		src, isVault, err = ses.generateFileInput(stmt, src)
		if err != nil {
			return fmt.Errorf(`%s: %w`, logp, err)
		}
	}

	var sudoCp = &Statement{
		kind: statementKindDefault,
		cmd:  `sudo`,
		args: []string{"cp", src, dst},
		raw:  []byte(fmt.Sprintf(`sudo cp %q %q`, src, dst)),
	}

	err = ExecLocal(ctx, req, sudoCp)
	if isVault {
		var errRemove = os.Remove(src)
		if errRemove != nil {
			req.mlog.Errf(`%s: %s`, logp, errRemove)
		}
	}
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	if stmt.mode != 0 {
		var (
			fsmode    = strconv.FormatUint(uint64(stmt.mode), 8)
			sudoChmod = &Statement{
				kind: statementKindDefault,
				cmd:  `sudo`,
				args: []string{`chmod`, fsmode, dst},
				raw:  []byte(fmt.Sprintf(`sudo chmod %o %q`, stmt.mode, dst)),
			}
		)
		err = ExecLocal(ctx, req, sudoChmod)
		if err != nil {
			return fmt.Errorf(`%s: chmod: %w`, logp, err)
		}
	}
	if len(stmt.owner) != 0 {
		var sudoChown = &Statement{
			kind: statementKindDefault,
			cmd:  `sudo`,
			args: []string{`chown`, stmt.owner, dst},
			raw:  []byte(fmt.Sprintf(`sudo chown %s %q`, stmt.owner, dst)),
		}
		err = ExecLocal(ctx, req, sudoChown)
		if err != nil {
			return fmt.Errorf(`%s: chown: %w`, logp, err)
		}
	}

	return nil
}

// SudoGet copy file from remote, that may not readable by remote user, to
// local using sudo.
// If the owner and/or mode is set, it will also applied using sudo on local
// host, after the file has been retrieved.
func (ses *Session) SudoGet(ctx context.Context, req *ExecRequest, stmt *Statement) (err error) {
	var (
		logp = `SudoGet`
		src  = stmt.args[0]
		dst  = stmt.args[1]
	)

	err = ses.sshc.sudoGet(ctx, src, dst)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	if stmt.mode != 0 {
		err = ses.localSudoChmod(ctx, req, dst, stmt.mode)
		if err != nil {
			return fmt.Errorf(`%s: %w`, logp, err)
		}
	}
	if len(stmt.owner) != 0 {
		err = ses.localSudoChown(ctx, req, dst, stmt.owner)
		if err != nil {
			return fmt.Errorf(`%s: %w`, logp, err)
		}
	}

	return nil
}

// SudoPut copy file from local to remote using sudo.
func (ses *Session) SudoPut(ctx context.Context, req *ExecRequest, stmt *Statement) (err error) {
	var (
		logp = `SudoPut`
		src  = stmt.args[0]
		dst  = stmt.args[1]

		isVault bool
	)

	src, isVault, err = ses.generateFileInput(stmt, src)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	err = ses.sshc.sudoPut(ctx, src, dst)
	if isVault {
		var errRemove = os.Remove(src)
		if errRemove != nil {
			req.mlog.Errf(`%s: %s`, logp, errRemove)
		}
	}
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	if stmt.mode != 0 {
		err = ses.sshc.sudoChmod(ctx, dst, stmt.mode)
		if err != nil {
			return fmt.Errorf(`%s: %w`, logp, err)
		}
	}
	if len(stmt.owner) != 0 {
		err = ses.sshc.sudoChown(ctx, dst, stmt.owner)
		if err != nil {
			return fmt.Errorf(`%s: %w`, logp, err)
		}
	}

	return nil
}

// ExecLocal execute the command with its arguments in local environment
// where the output and error send to os.Stdout and os.Stderr respectively.
//
// If the statement command is "sudo" and stdin is non-nil, sudo will run
// with "-S" option to read password from stdin instead of from terminal.
//
// The raw field must be used when generating Command to handle arguments
// with quotes.
func ExecLocal(ctx context.Context, req *ExecRequest, stmt *Statement) (err error) {
	if stmt.cmd == `sudo` {
		if req.stdin != nil {
			var raw = make([]byte, 0, len(stmt.raw))
			raw = append(raw, []byte(`sudo -S`)...)
			raw = append(raw, bytes.TrimPrefix(stmt.raw, []byte(`sudo`))...)
			stmt.raw = raw
		}
	}

	//nolint:gosec
	var cmd = exec.CommandContext(ctx, `/bin/sh`, `-c`, string(stmt.raw))

	cmd.Stdin = req.stdin
	cmd.Stdout = req.mlog
	cmd.Stderr = req.mlog

	err = cmd.Run()
	if err != nil {
		return fmt.Errorf(`ExecLocal: %w`, err)
	}
	return nil
}

// close the session and release all resources.
func (ses *Session) close() (err error) {
	ses.cryptoc = nil
	if ses.sshc != nil {
		err = ses.sshc.close()
		ses.sshc = nil
	}
	return err
}

// executeRequires run the "#require:" statements from line 0 until
// the start argument in the local system.
func (ses *Session) executeRequires(ctx context.Context, req *ExecRequest, pos linePosition) (err error) {
	if pos.start >= int64(len(req.script.requires)) {
		return nil
	}

	var (
		stmt *Statement
		x    int64
	)

	for x = 0; x <= pos.start; x++ {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
			stmt = req.script.requires[x]
			if stmt == nil {
				continue
			}

			req.mlog.Outf(`--- require %d: %v`, x, stmt)

			err = ExecLocal(ctx, req, stmt)
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func (ses *Session) executeScriptOnLocal(ctx context.Context, req *ExecRequest, pos linePosition) (err error) {
	var max = int64(len(req.script.stmts))
	if pos.start > max {
		return
	}
	if pos.end == 0 {
		pos.end = max - 1
	}

	for x := pos.start; x <= pos.end; x++ {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
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

			req.mlog.Outf(`--> %3d: %s`, x, stmt.String())

			switch stmt.kind {
			case statementKindDefault:
				err = ExecLocal(ctx, req, stmt)
			case statementKindGet:
				err = ses.Copy(req, stmt)
			case statementKindLocal:
				err = ExecLocal(ctx, req, stmt)
			case statementKindPut:
				err = ses.Copy(req, stmt)
			case statementKindSudoGet:
				err = ses.SudoCopy(ctx, req, stmt)
			case statementKindSudoPut:
				err = ses.SudoCopy(ctx, req, stmt)
			}
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func (ses *Session) executeScriptOnRemote(ctx context.Context, req *ExecRequest, pos linePosition) (err error) {
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

		req.mlog.Outf(`--> %3d: %s`, x, stmt.String())

		switch stmt.kind {
		case statementKindDefault:
			err = ses.sshc.conn.Execute(ctx, string(stmt.raw))
		case statementKindGet:
			err = ses.Get(stmt)
		case statementKindLocal:
			err = ExecLocal(ctx, req, stmt)
		case statementKindPut:
			err = ses.Put(ctx, req, stmt)
		case statementKindSudoGet:
			err = ses.SudoGet(ctx, req, stmt)
		case statementKindSudoPut:
			err = ses.SudoPut(ctx, req, stmt)
		}
		if err != nil {
			return err
		}
	}
	return nil
}

// generateFileInput read the content of file input "in", apply the session
// variables, and write the result to ".cache" directory, and return the
// output file path as "out".
//
// For example, if the input file path is "{{.BaseDir}}/a/b/script" then the
// output file path would be "{{.BaseDir}}/.cache/a/b/script".
func (ses *Session) generateFileInput(stmt *Statement, in string) (out string, isVault bool, err error) {
	// Check if the file is binary first, since binary file will not get
	// encrypted.
	if !strings.HasSuffix(in, defEncryptExt) && libos.IsBinary(in) {
		return in, false, nil
	}

	var logp = `generateFileInput`
	var newContent []byte

	newContent, isVault, err = ses.loadFileInput(in)
	if err != nil {
		var relPathInput = relativePath(ses.BaseDir, in)
		return ``, false, fmt.Errorf(`%s %q: %w`, logp, relPathInput, err)
	}

	if !stmt.optNoparse {
		newContent, err = ses.render(in, newContent)
		if err != nil {
			return ``, false, fmt.Errorf(`%s: %w`, logp, err)
		}
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

	err = os.WriteFile(out, newContent, 0600)
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

func (ses *Session) initSSHClient(req *ExecRequest, sshSection *sshconfig.Section) (err error) {
	var (
		logp          = "initSSHClient"
		lastIdentFile string
	)

	if len(sshSection.IdentityFile) > 0 {
		lastIdentFile = sshSection.IdentityFile[len(sshSection.IdentityFile)-1]
	}

	ses.sshc, err = newSSHClient(req, sshSection)
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
		path     string
		awwanEnv string
	)

	for _, path = range ses.paths {
		// Load unencrypted "awwan.env".
		awwanEnv = filepath.Join(path, defEnvFileName)

		err = ses.loadFileEnv(awwanEnv, false)
		if err != nil {
			return err
		}

		// Load encrypted ".awwan.env.vault".
		awwanEnv = filepath.Join(path, defFileEnvVault)

		err = ses.loadFileEnv(awwanEnv, true)
		if err != nil {
			if errors.Is(err, errPrivateKeyMissing) {
				log.Println(err)
				continue
			}
			return err
		}
	}
	return nil
}

func (ses *Session) loadFileEnv(awwanEnv string, isVault bool) (err error) {
	var (
		relPath = relativePath(ses.BaseDir, awwanEnv)

		content []byte
	)

	content, err = os.ReadFile(awwanEnv)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return fmt.Errorf(`%s: %w`, relPath, err)
	}

	log.Printf(`--- Loading %q ...`, relativePath(ses.BaseDir, awwanEnv))

	if isVault {
		content, err = ses.cryptoc.decrypt(content)
		if err != nil {
			return fmt.Errorf(`%s: %w`, relPath, err)
		}
	}

	err = ses.loadRawEnv(content)
	if err != nil {
		return fmt.Errorf(`%s: %w`, relPath, err)
	}

	return nil
}

// loadFileInput read the input file for Copy or Put operation.
//
// If the input path end with ".vault" suffix, the file will be decrypted
// first.
//
// On success, it will return the content of file and true if the file is
// from encrypted file .vault.
func (ses *Session) loadFileInput(path string) (content []byte, isVault bool, err error) {
	if strings.HasSuffix(path, defEncryptExt) {
		content, err = os.ReadFile(path)
		if err != nil {
			return nil, true, err
		}
		content, err = ses.cryptoc.decrypt(content)
		if err != nil {
			return nil, true, err
		}
		return content, true, nil
	}

	content, err = os.ReadFile(path)
	if err != nil {
		return nil, false, err
	}
	return content, false, nil
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

// localSudoChmod change the file permission in local environment using
// sudo.
func (ses *Session) localSudoChmod(ctx context.Context, req *ExecRequest, file string, mode fs.FileMode) (err error) {
	var (
		fsmode    = strconv.FormatUint(uint64(mode), 8)
		sudoChmod = &Statement{
			kind: statementKindDefault,
			cmd:  `sudo`,
			args: []string{`chmod`, fsmode, file},
			raw:  []byte(fmt.Sprintf(`sudo chmod %o %q`, mode, file)),
		}
	)
	err = ExecLocal(ctx, req, sudoChmod)
	if err != nil {
		return fmt.Errorf(`%s: %w`, sudoChmod.raw, err)
	}
	return nil
}

// localSudoChown change the file owner in local environment using sudo.
func (ses *Session) localSudoChown(ctx context.Context, req *ExecRequest, file, owner string) (err error) {
	var sudoChown = &Statement{
		kind: statementKindDefault,
		cmd:  `sudo`,
		args: []string{`chown`, owner, file},
		raw:  []byte(fmt.Sprintf(`sudo chown %s %q`, owner, file)),
	}
	err = ExecLocal(ctx, req, sudoChown)
	if err != nil {
		return fmt.Errorf(`%s: %w`, sudoChown.raw, err)
	}
	return nil
}

// render apply the session and environment variables into input stream `in`
// and return the result.
// It will return an error if the input cannot be parsed or one variable
// is not exists.
func (ses *Session) render(path string, in []byte) (out []byte, err error) {
	var relpath string

	relpath, err = filepath.Rel(ses.BaseDir, path)
	if err != nil {
		relpath = path
	}

	var tmpl = template.New(relpath)

	tmpl, err = tmpl.Parse(string(in))
	if err != nil {
		return nil, err
	}

	var buf bytes.Buffer
	err = tmpl.Execute(&buf, ses)
	if err != nil {
		return nil, err
	}

	out = buf.Bytes()

	return out, nil
}
