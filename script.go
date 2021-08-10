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

	"github.com/shuLhan/share/lib/os/exec"
)

//
// Script define the content of ".aww" file, line by line.
//
type Script struct {
	requires   [][]byte
	statements [][]byte
}

//
// NewScript load the content of awwan script (".aww"), apply the value of
// session variables into the script content, and split each statement by
// lines.
//
func NewScript(ses *Session, path string) (s *Script, err error) {
	logp := "NewScript"

	content, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	s, err = ParseScript(ses, content)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	s.parseMagicRequire()

	return s, nil
}

//
// ParseScript parse the script content by applying the session variables and
// splitting it into statements.
//
func ParseScript(ses *Session, content []byte) (s *Script, err error) {
	var (
		logp = "ParseScript"
		tmpl *template.Template
		buf  bytes.Buffer
	)

	tmpl = template.New("aww")

	tmpl, err = tmpl.Parse(string(content))
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	err = tmpl.Execute(&buf, ses)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	raw := buf.Bytes()
	raw = bytes.TrimRight(raw, " \t\r\n\v")
	splits := bytes.Split(raw, newLine)

	// Add empty line at the beginning to make the start index start from
	// 1, not 0.
	stmts := [][]byte{newLine}
	stmts = append(stmts, splits...)
	stmts = joinStatements(stmts)
	stmts = joinRequireStatements(stmts)

	s = &Script{
		statements: stmts,
	}

	return s, nil
}

//
// ExecuteRequires run the #require: statements in the local.
//
func (scr *Script) ExecuteRequires(untilStart int) (err error) {
	for x := 0; x < untilStart; x++ {
		stmt := scr.requires[x]
		if len(stmt) == 0 {
			continue
		}

		log.Printf("--- require %d: %s\n", x, stmt)

		err = exec.Run(string(stmt), os.Stdout, os.Stderr)
		if err != nil {
			return err
		}
	}

	return nil
}

func (s *Script) parseMagicRequire() {
	s.requires = make([][]byte, len(s.statements))

	for x, stmt := range s.statements {
		if !bytes.HasPrefix(stmt, []byte(cmdMagicRequire)) {
			continue
		}
		if len(s.statements) > x+1 {
			s.requires[x+1] = bytes.TrimSpace(s.statements[x+1])
		}
	}
}

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
