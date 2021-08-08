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

	libbytes "github.com/shuLhan/share/lib/bytes"
	"github.com/shuLhan/share/lib/os/exec"
)

//
// Script define the content of ".aww" file, line by line.
//
type Script struct {
	Statements [][]byte

	requires [][]byte
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

	rawb := buf.Bytes()
	rawb = bytes.TrimRight(rawb, " \t\r\n\v")

	stmts := bytes.Split(rawb, []byte{'\n'})
	// Add empty line at the beginning to make the start index start from
	// 1, not 0.
	stmts = append([][]byte{{}}, stmts...)

	s = &Script{
		Statements: stmts,
	}

	s.join()

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

//
// join all statements that ends with "\" into single statement.
//
func (s *Script) join() {
	for x := 0; x < len(s.Statements); x++ {
		if len(s.Statements[x]) == 0 {
			continue
		}

		endc := len(s.Statements[x]) - 1
		if s.Statements[x][endc] != '\\' {
			continue
		}

		s.Statements[x][endc] = ' '

		y := x + 1
		for ; y < len(s.Statements); y++ {
			if len(s.Statements[y]) == 0 {
				break
			}

			endc = len(s.Statements[y]) - 1
			lastc := s.Statements[y][endc]

			if lastc == '\\' {
				s.Statements[y][endc] = ' '
			}

			s.Statements[x] = append(s.Statements[x], s.Statements[y]...)
			s.Statements[y] = nil

			if lastc != '\\' {
				break
			}
		}
		s.Statements[x] = libbytes.MergeSpaces(s.Statements[x])
		x = y
	}
}

func (s *Script) parseMagicRequire() {
	s.requires = make([][]byte, len(s.Statements))

	for x, stmt := range s.Statements {
		if !bytes.HasPrefix(stmt, cmdMagicRequire) {
			continue
		}
		if len(s.Statements) > x+1 {
			s.requires[x+1] = bytes.TrimSpace(s.Statements[x+1])
		}
	}
}
