// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"bytes"
	"fmt"
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

// Statetement contains parsed raw line from the script.
type Statement struct {
	cmd  string
	args []string
	raw  []byte
	kind int
}

// ParseStatement create and initialize new Statement from raw line.
// It will return nil if raw line is empty.
func ParseStatement(raw []byte) (stmt *Statement, err error) {
	var (
		logp = "ParseStatement"

		cmd  string
		args []string
	)

	raw = bytes.TrimSpace(raw)
	if len(raw) == 0 {
		return nil, nil
	}

	if bytes.HasPrefix(raw, cmdMagicGet) {
		raw = raw[len(cmdMagicGet):]
		cmd, args = libexec.ParseCommandArgs(string(raw))
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
		cmd, args = libexec.ParseCommandArgs(string(raw))
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
		cmd, args = libexec.ParseCommandArgs(string(raw))
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
		cmd, args = libexec.ParseCommandArgs(string(raw))
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
		cmd, args = libexec.ParseCommandArgs(string(raw))
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

	cmd, args = libexec.ParseCommandArgs(string(raw))
	stmt = &Statement{
		cmd:  cmd,
		args: args,
		raw:  raw,
	}
	return stmt, nil
}

func (stmt *Statement) String() string {
	return fmt.Sprintf("%s %s", stmt.cmd, strings.Join(stmt.args, " "))
}
