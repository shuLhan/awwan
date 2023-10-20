// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"bytes"
	"errors"
	"fmt"
	"io/fs"
	"strconv"
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

// List of mapping between magic command kind and its command string for get
// and put only.
var magicCmdGetPut = map[int][]byte{
	statementKindGet:     cmdMagicGet,
	statementKindPut:     cmdMagicPut,
	statementKindSudoGet: cmdMagicSudoGet,
	statementKindSudoPut: cmdMagicSudoPut,
}

// Statement contains parsed raw line from the script.
type Statement struct {
	owner string

	cmd  string
	args []string
	raw  []byte
	mode fs.FileMode
	kind int
}

// ParseStatement create and initialize new Statement from raw line.
// It will return nil if raw line is empty.
func ParseStatement(raw []byte) (stmt *Statement, err error) {
	var logp = `ParseStatement`

	raw = bytes.TrimSpace(raw)
	if len(raw) == 0 {
		return nil, nil
	}

	var (
		cmdKind  int
		cmdMagic []byte
	)

	for cmdKind, cmdMagic = range magicCmdGetPut {
		if !bytes.HasPrefix(raw, cmdMagic) {
			continue
		}
		raw = raw[len(cmdMagic):]
		stmt, err = parseStatementGetPut(cmdKind, raw)
		if err != nil {
			return nil, fmt.Errorf(`%s: %q: %w`, logp, cmdMagic, err)
		}
		return stmt, nil
	}

	var (
		cmd  string
		args []string
	)

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

	// Comment check MUST be the last one after magic command, since
	// both require '#' as first character.
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
	return fmt.Sprintf("%s%s %s", magicCmdGetPut[stmt.kind], stmt.cmd, strings.Join(stmt.args, " "))
}

// parseStatementGetPut parse the raw "#get" or "#put" statement.
func parseStatementGetPut(kind int, raw []byte) (stmt *Statement, err error) {
	var (
		cmd  string
		args []string
	)

	if len(raw) == 0 {
		return nil, errors.New(`missing arguments`)
	}

	stmt = &Statement{
		kind: kind,
	}

	if raw[0] != ' ' && raw[0] != '\t' {
		raw, err = stmt.parseOwnerMode(raw)
		if err != nil {
			return nil, err
		}
	}

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

	stmt.args = []string{cmd, args[0]}
	stmt.raw = raw

	return stmt, nil
}

// parseOwnerMode parse the owner and optionally the file mode for
// destination file.
// The owner and mode has the following syntax,
//
//	[ USER [ ":" GROUP ]][ "+" MODE ]
//
// The USER and/or GROUP is optional, its accept the value as in "chown".
// The MODE also optional, its value must be an octal.
func (stmt *Statement) parseOwnerMode(in []byte) (out []byte, err error) {
	var (
		sepSpace = " \t"
		sepMode  = "+"

		tmp []byte
		idx int
	)

	idx = bytes.IndexAny(in, sepSpace)
	if idx < 0 {
		return nil, nil
	}

	tmp = in[:idx]
	out = in[idx+1:]

	idx = bytes.IndexAny(tmp, sepMode)
	if idx < 0 {
		stmt.owner = string(tmp)
	} else {
		stmt.owner = string(tmp[:idx])

		var (
			modeString = string(tmp[idx+1:])
			mode       uint64
		)

		mode, err = strconv.ParseUint(modeString, 8, 32)
		if err != nil {
			return nil, err
		}

		stmt.mode = fs.FileMode(mode)
	}

	return out, nil
}
