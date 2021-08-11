// Copyright 2019, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package awwan

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"text/template"
)

//
// Script define the content of ".aww" file, line by line.
//
type Script struct {
	stmts    []*Statement
	requires []*Statement
	rawLines [][]byte
}

//
// NewScriptForLocal load the content of awwan script (".aww"), apply the
// value of session and environment variables into the script content, and
// split it into Statements.
//
func NewScriptForLocal(ses *Session, path string) (script *Script, err error) {
	logp := "NewScriptForLocal"

	content, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	script, err = ParseScriptForLocal(ses, content)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}
	return script, nil
}

//
// NewScriptForRemote load the content of awwan script (".aww"), apply the
// value of session variables into the script content, and split it into
// Statements.
//
func NewScriptForRemote(ses *Session, path string) (script *Script, err error) {
	logp := "NewScriptForRemote"

	content, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	script, err = ParseScriptForRemote(ses, content)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}
	return script, nil
}

//
// ParseScriptForLocal parse the script content by applying the session and
// environment variables and splitting it into Statement.
//
func ParseScriptForLocal(ses *Session, content []byte) (s *Script, err error) {
	return parseScript(ses, content, true)
}

//
// ParseScriptForRemote parse the script content by applying the session
// variables and splitting it into Statement.
//
func ParseScriptForRemote(ses *Session, content []byte) (s *Script, err error) {
	return parseScript(ses, content, false)
}

func parseScript(ses *Session, content []byte, isLocal bool) (script *Script, err error) {
	var (
		logp = "parseScript"
		tmpl *template.Template
		buf  bytes.Buffer
		raw  []byte
	)

	// Apply the session variables.
	tmpl = template.New("aww")

	tmpl, err = tmpl.Parse(string(content))
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	err = tmpl.Execute(&buf, ses)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	if isLocal {
		// Apply the environment variables into script content.
		raw = []byte(os.ExpandEnv(buf.String()))
	} else {
		raw = buf.Bytes()
	}

	raw = bytes.TrimRight(raw, " \t\r\n\v")
	splits := bytes.Split(raw, newLine)

	// Add empty line at the beginning to make the start index start from
	// 1, not 0.
	rawLines := [][]byte{newLine}
	rawLines = append(rawLines, splits...)
	rawLines = joinStatements(rawLines)
	rawLines = joinRequireStatements(rawLines)

	stmts := make([]*Statement, len(rawLines))
	requires := make([]*Statement, len(rawLines))

	for x, line := range rawLines {
		stmt, err := ParseStatement(line)
		if err != nil {
			return nil, fmt.Errorf("%s: line %d: %w", logp, x, err)
		}
		if stmt == nil {
			continue
		}
		if stmt.kind == statementKindRequire {
			requires[x] = stmt
		} else {
			stmts[x] = stmt
		}
	}

	script = &Script{
		stmts:    stmts,
		requires: requires,
		rawLines: rawLines,
	}

	return script, nil
}

//
// ExecuteRequires run the "#require:" statements from line 0 until
// the start argument in the local system.
//
func (scr *Script) ExecuteRequires(untilStart int) (err error) {
	for x := 0; x < untilStart; x++ {
		stmt := scr.requires[x]
		if stmt == nil {
			continue
		}

		log.Printf("--- require %d: %v\n", x, stmt)

		err = stmt.ExecLocal()
		if err != nil {
			return err
		}
	}
	return nil
}

//
// joinRequireStatements join the "#require:" statement into one line.
// For example,
//
//	#require:
//	a
//	b
//
// will be transformed into
//
//	#require: a
//	b
// and
//
//	#require: a
//	b
//
// will be leave as is.
//
func joinRequireStatements(in [][]byte) (out [][]byte) {
	out = make([][]byte, len(in))
	if len(in) > 0 {
		out[0] = in[0]
	}
	for x := 1; x < len(in); x++ {
		stmt := in[x]
		if !bytes.HasPrefix(stmt, cmdMagicRequire) {
			out[x] = in[x]
			continue
		}
		stmt = stmt[len(cmdMagicRequire):]
		if len(stmt) != 0 {
			// #require: already has command on the same line.
			out[x] = in[x]
			continue
		}
		if x+1 == len(in) {
			break
		}
		if in[x+1][0] == '#' {
			// Empty require statement followed by comment or
			// magic command.
			out[x] = nil
			continue
		}

		stmt = in[x]
		stmt = append(stmt, ' ')
		stmt = append(stmt, in[x+1]...)
		out[x] = stmt
		in[x+1] = nil
	}
	return out
}

//
// joinStatements join multiline statements that ends with "\" into single
// line.
//
// For example,
//
//	a\
//	b
//	c
//
// will become,
//
//	a b
//	c
//
func joinStatements(in [][]byte) (out [][]byte) {
	out = make([][]byte, len(in))

	if len(in) > 0 {
		out[0] = nil
	}
	for x := 1; x < len(in); x++ {
		stmt := bytes.TrimSpace(in[x])
		if len(stmt) == 0 {
			in[x] = nil
			out[x] = nil
			continue
		}

		endc := len(stmt) - 1
		if stmt[endc] != '\\' {
			in[x] = nil
			out[x] = stmt
			continue
		}

		stmt = bytes.TrimRight(stmt, "\\ \t")
		stmt = append(stmt, ' ')

		y := x + 1
		for ; y < len(in); y++ {
			nextStmt := bytes.TrimSpace(in[y])
			if len(nextStmt) == 0 {
				in[y] = nil
				out[y] = nil
				break
			}

			endc = len(nextStmt) - 1
			lastc := nextStmt[endc]

			if lastc == '\\' {
				nextStmt = bytes.TrimRight(nextStmt, "\\ \t")
				nextStmt = append(nextStmt, ' ')
			}

			stmt = append(stmt, nextStmt...)

			in[y] = nil
			if lastc != '\\' {
				break
			}
		}
		out[x] = stmt
		x = y
	}
	return out
}
