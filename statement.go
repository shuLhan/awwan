// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"bytes"
	"errors"
	"fmt"
	"strings"

	libexec "github.com/shuLhan/share/lib/os/exec"
)

const (
	statementKindDefault int = iota
	statementKindComment
	statementKindRequire
	statementKindGet
	statementKindPut
	statementKindSudoGet
	statementKindSudoPut
)

// List of magic command.
var (
	cmdMagicGet     = []byte(`#get:`)
	cmdMagicPut     = []byte(`#put:`)
	cmdMagicSudoGet = []byte(`#get!`)
	cmdMagicSudoPut = []byte(`#put!`)
	cmdMagicRequire = []byte(`#require:`)
)

// Statement contains parsed raw line from the script.
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
		logp = `ParseStatement`

		cmd  string
		args []string
	)

	raw = bytes.TrimSpace(raw)
	if len(raw) == 0 {
		return nil, nil
	}

	if bytes.HasPrefix(raw, cmdMagicGet) {
		raw = raw[len(cmdMagicGet):]
		stmt, err = parseStatementGetPut(statementKindGet, raw)
		if err != nil {
			return nil, fmt.Errorf(`%s: %q: %w`, logp, cmdMagicGet, err)
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
		stmt, err = parseStatementGetPut(statementKindSudoGet, raw)
		if err != nil {
			return nil, fmt.Errorf(`%s: %q: %w`, logp, cmdMagicSudoGet, err)
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

// parseStatementGetPut parse the raw "#get" or "#put" statement.
func parseStatementGetPut(kind int, raw []byte) (stmt *Statement, err error) {
	var (
		cmd  string
		args []string
	)

	cmd, args = libexec.ParseCommandArgs(string(raw))
	if len(cmd) == 0 {
		return nil, errors.New(`missing arguments`)
	}
	if len(args) == 0 {
		return nil, errors.New(`missing destination file`)
	}
	if len(args) > 1 {
		return nil, errors.New(`too many arguments`)
	}
	stmt = &Statement{
		kind: kind,
		args: []string{cmd, args[0]},
		raw:  raw,
	}
	return stmt, nil
}
