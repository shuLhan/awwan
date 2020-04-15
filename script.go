// Copyright 2019, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package awwan

import (
	"bytes"
	"io/ioutil"
	"log"
	"text/template"
)

//
// script define the content of ".aww" file, line by line.
//
type script struct {
	Statements [][]byte
}

//
// newScript load the content of awwan script (".aww"), apply the value of
// environment variables into the script content, and split each statement by
// lines.
//
func newScript(env *Environment, path string) *script {
	content, err := ioutil.ReadFile(path)
	if err != nil {
		log.Fatal("newScript: ioutil.ReadFile: " + err.Error())
	}

	s := parseScript(env, content)

	if env.scriptEnd >= len(s.Statements) {
		env.scriptEnd = len(s.Statements) - 1
	}

	return s
}

//
// parseScript parse the script content by applying the environment values and
// splitting it into statements.
//
func parseScript(env *Environment, content []byte) (s *script) {
	var (
		tmpl *template.Template
		buf  bytes.Buffer
		err  error
	)

	tmpl = template.New("aww")

	tmpl, err = tmpl.Parse(string(content))
	if err != nil {
		log.Fatal("newScript: template.Parse: " + err.Error())
	}

	err = tmpl.Execute(&buf, env)
	if err != nil {
		log.Fatal("newScript: template.Execute: " + err.Error())
	}

	stmts := bytes.Split(buf.Bytes(), []byte{'\n'})
	stmts = append([][]byte{{}}, stmts...)

	s = &script{
		Statements: stmts,
	}

	s.join()

	return
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
		x = y
	}
}
