// Copyright 2019, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package awwan

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"text/template"

	libbytes "github.com/shuLhan/share/lib/bytes"
)

//
// script define the content of ".aww" file, line by line.
//
type script struct {
	requires   [][]byte
	Statements [][]byte
}

//
// newScript load the content of awwan script (".aww"), apply the value of
// environment variables into the script content, and split each statement by
// lines.
//
func newScript(env *environment, path string) (s *script, err error) {
	logp := "newScript"

	content, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	s, err = parseScript(env, content)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	s.parseMagicRequire()

	return s, nil
}

//
// parseScript parse the script content by applying the environment values and
// splitting it into statements.
//
func parseScript(env *environment, content []byte) (s *script, err error) {
	var (
		logp = "parseScript"
		tmpl *template.Template
		buf  bytes.Buffer
	)

	tmpl = template.New("aww")

	tmpl, err = tmpl.Parse(string(content))
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	err = tmpl.Execute(&buf, env)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	stmts := bytes.Split(buf.Bytes(), []byte{'\n'})
	stmts = append([][]byte{{}}, stmts...)

	s = &script{
		Statements: stmts,
	}

	s.join()

	return s, nil
}

//
// join all statements that ends with "\" into single statement.
//
func (s *script) join() {
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

func (s *script) parseMagicRequire() {
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
