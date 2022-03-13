// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"bytes"
	"testing"

	"github.com/shuLhan/share/lib/test"
)

func TestJoinRequireStatements(t *testing.T) {
	in := bytes.Split([]byte(`
#require:
a
b
#require: c
#require:
#get:
#require:`), newLine)

	exp := [][]byte{
		nil,
		[]byte("#require: a"),
		nil,
		[]byte("b"),
		[]byte("#require: c"),
		nil,
		[]byte("#get:"),
		nil,
	}

	got := joinRequireStatements(in)
	test.Assert(t, "joinRequireStatements", exp, got)
}

func TestJoinStatements(t *testing.T) {
	cases := []struct {
		in  [][]byte
		exp [][]byte
	}{{
		in: bytes.Split([]byte(`
a
b \
c
d \
e 	\
f
g`), newLine),
		exp: [][]byte{
			nil,
			[]byte("a"),
			[]byte("b c"),
			nil,
			[]byte("d e f"),
			nil,
			nil,
			[]byte("g"),
		},
	}}
	for _, c := range cases {
		got := joinStatements(c.in)
		test.Assert(t, "joinStatements", c.exp, got)
	}
}
