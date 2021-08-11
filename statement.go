// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package awwan

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"strings"

	libexec "github.com/shuLhan/share/lib/os/exec"
)

const (
	statementKindDefault = iota
	statementKindComment
	statementKindRequire
	statementKindGet
	statementKindPut
	statementKindSudoGet
	statementKindSudoPut
)

//
// Statetement contains parsed raw line from the script.
//
type Statement struct {
	kind int
	cmd  string
	args []string
	raw  []byte
}

//
// ParseStatement create and initialize new Statement from raw line.
// It will return nil if raw line is empty.
//
func ParseStatement(raw []byte) (stmt *Statement, err error) {
	logp := "ParseStatement"

	raw = bytes.TrimSpace(raw)
	if len(raw) == 0 {
		return nil, nil
	}

	if bytes.HasPrefix(raw, cmdMagicGet) {
		raw = raw[len(cmdMagicGet):]
		cmd, args := libexec.ParseCommandArgs(string(raw))
		if len(cmd) == 0 || len(args) == 0 {
			return nil, fmt.Errorf("%s: %s missing argument", logp, cmdMagicGet)
		}
		stmt = &Statement{
			kind: statementKindGet,
			cmd:  cmd,
			args: args,
			raw:  raw,
		}
		return stmt, nil
	}
	if bytes.HasPrefix(raw, cmdMagicPut) {
		raw = raw[len(cmdMagicPut):]
		cmd, args := libexec.ParseCommandArgs(string(raw))
		if len(cmd) == 0 || len(args) == 0 {
			return nil, fmt.Errorf("%s: %s missing argument", logp, cmdMagicPut)
		}
		stmt = &Statement{
			kind: statementKindPut,
			cmd:  cmd,
			args: args,
			raw:  raw,
		}
		return stmt, nil
	}
	if bytes.HasPrefix(raw, cmdMagicSudoGet) {
		raw = raw[len(cmdMagicSudoGet):]
		cmd, args := libexec.ParseCommandArgs(string(raw))
		if len(cmd) == 0 || len(args) == 0 {
			return nil, fmt.Errorf("%s: %s missing argument", logp, cmdMagicSudoGet)
		}
		stmt = &Statement{
			kind: statementKindSudoGet,
			cmd:  cmd,
			args: args,
			raw:  raw,
		}
		return stmt, nil
	}
	if bytes.HasPrefix(raw, cmdMagicSudoPut) {
		raw = raw[len(cmdMagicSudoPut):]
		cmd, args := libexec.ParseCommandArgs(string(raw))
		if len(cmd) == 0 || len(args) == 0 {
			return nil, fmt.Errorf("%s: %s missing argument", logp, cmdMagicSudoPut)
		}
		stmt = &Statement{
			kind: statementKindSudoPut,
			cmd:  cmd,
			args: args,
			raw:  raw,
		}
		return stmt, nil
	}
	if bytes.HasPrefix(raw, cmdMagicRequire) {
		raw = raw[len(cmdMagicRequire):]
		cmd, args := libexec.ParseCommandArgs(string(raw))
		stmt = &Statement{
			kind: statementKindRequire,
			cmd:  cmd,
			args: args,
			raw:  raw,
		}
		return stmt, nil
	}
	if raw[0] == '#' {
		stmt = &Statement{
			kind: statementKindComment,
			raw:  raw,
		}
		return stmt, nil
	}

	cmd, args := libexec.ParseCommandArgs(string(raw))
	stmt = &Statement{
		cmd:  cmd,
		args: args,
		raw:  raw,
	}
	return stmt, nil
}

//
// ExecLocal execute the command with its arguments in local environment where
// the output and error send to os.Stdout and os.Stderr respectively.
//
func (stmt *Statement) ExecLocal() (err error) {
	cmd := exec.Command(stmt.cmd, stmt.args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func (stmt *Statement) String() string {
	return fmt.Sprintf("%s %s", stmt.cmd, strings.Join(stmt.args, " "))
}
