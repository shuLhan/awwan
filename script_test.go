// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

//go:build !integration

package awwan

import (
	"bytes"
	"testing"

	"git.sr.ht/~shulhan/pakakeh.go/lib/test"
)

func TestJoinRequireStatements(t *testing.T) {
	var (
		in  [][]byte
		exp [][]byte
		got [][]byte
	)

	in = bytes.Split([]byte(`
#require:
a
b
#require: c
#require:
#get:
#require:`), []byte("\n"))

	exp = [][]byte{
		nil,
		[]byte("#require: a"),
		nil,
		[]byte("b"),
		[]byte("#require: c"),
		nil,
		[]byte("#get:"),
		nil,
	}

	got = joinRequireStatements(in)
	test.Assert(t, "joinRequireStatements", exp, got)
}

func TestJoinStatements(t *testing.T) {
	type testCase struct {
		in  [][]byte
		exp [][]byte
	}

	var (
		tdata *test.Data
		err   error
	)

	tdata, err = test.LoadData(`testdata/script_joinStatements_test.data`)
	if err != nil {
		t.Fatal(err)
	}

	var cases = []testCase{{
		in: bytes.Split(tdata.Input[`case_0`], []byte("\n")),
		exp: [][]byte{
			nil,
			[]byte("a"),
			[]byte("b c"),
			nil,
			[]byte("d e 	f"),
			nil,
			nil,
			[]byte(`gh,i`),
			nil,
			[]byte(`j k`),
			nil,
		},
	}}

	var (
		c   testCase
		got [][]byte
	)

	for _, c = range cases {
		got = joinStatements(c.in)
		test.Assert(t, "joinStatements", c.exp, got)
	}
}
