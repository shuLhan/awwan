// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

//go:build !integration

package awwan

import (
	"testing"

	"git.sr.ht/~shulhan/pakakeh.go/lib/test"
)

func TestParseStatement(t *testing.T) {
	type testCase struct {
		exp      *Statement
		expError string
		raw      []byte
	}

	var cases = []testCase{{
		raw:      []byte(`#get: `),
		expError: `ParseStatement: "#get:": missing arguments`,
	}, {
		raw:      []byte(`#get: src `),
		expError: `ParseStatement: "#get:": missing destination file`,
	}, {
		raw:      []byte(`#get: src dst dst2 `),
		expError: `ParseStatement: "#get:": too many arguments`,
	}, {
		raw: []byte(`#get: src dst`),
		exp: &Statement{
			kind: statementKindGet,
			args: []string{`src`, `dst`},
			raw:  []byte(` src dst`),
		},
	}, {
		raw: []byte(`#get: a\ b c`),
		exp: &Statement{
			kind: statementKindGet,
			args: []string{`a b`, `c`},
			raw:  []byte(` a\ b c`),
		},
	}, {
		raw:      []byte(`#get:user:group `),
		expError: `ParseStatement: "#get:": missing arguments`,
	}, {
		raw:      []byte(`#get:user:group src`),
		expError: `ParseStatement: "#get:": missing destination file`,
	}, {
		raw: []byte(`#get:user:group src dst`),
		exp: &Statement{
			kind:  statementKindGet,
			owner: `user:group`,
			args:  []string{`src`, `dst`},
			raw:   []byte(`src dst`),
		},
	}, {
		raw:      []byte(`#get:+800 src dst`),
		expError: `ParseStatement: "#get:": strconv.ParseUint: parsing "800": invalid syntax`,
	}, {
		raw: []byte(`#get:user:group+561 src dst`),
		exp: &Statement{
			kind:  statementKindGet,
			owner: `user:group`,
			mode:  369,
			args:  []string{`src`, `dst`},
			raw:   []byte(`src dst`),
		},
	}, {
		raw: []byte(`#get:user:group+0561 src dst`),
		exp: &Statement{
			kind:  statementKindGet,
			owner: `user:group`,
			mode:  0561,
			args:  []string{`src`, `dst`},
			raw:   []byte(`src dst`),
		},
	}, {
		raw:      []byte(`#get! `),
		expError: `ParseStatement: "#get!": missing arguments`,
	}, {
		raw:      []byte(`#get! src `),
		expError: `ParseStatement: "#get!": missing destination file`,
	}, {
		raw:      []byte(`#get! src dst dst2 `),
		expError: `ParseStatement: "#get!": too many arguments`,
	}, {
		raw: []byte(`#get! a\	b	c`),
		exp: &Statement{
			kind: statementKindSudoGet,
			args: []string{`a	b`, `c`},
			raw:  []byte(` a\	b	c`),
		},
	}, {
		raw:      []byte(`#put: `),
		expError: `ParseStatement: "#put:": missing arguments`,
	}, {
		raw:      []byte(`#put: src `),
		expError: `ParseStatement: "#put:": missing destination file`,
	}, {
		raw:      []byte(`#put: src dst dst2 `),
		expError: `ParseStatement: "#put:": too many arguments`,
	}, {
		raw: []byte(`#put: a bc\ `),
		exp: &Statement{
			kind: statementKindPut,
			args: []string{`a`, `bc`},
			raw:  []byte(` a bc\`),
		},
	}, {
		raw:      []byte(`#put! `),
		expError: `ParseStatement: "#put!": missing arguments`,
	}, {
		raw:      []byte(`#put! src `),
		expError: `ParseStatement: "#put!": missing destination file`,
	}, {
		raw:      []byte(`#put! src dst dst2 `),
		expError: `ParseStatement: "#put!": too many arguments`,
	}, {
		raw: []byte(`#put! a	bc `),
		exp: &Statement{
			kind: statementKindSudoPut,
			args: []string{`a`, `bc`},
			raw:  []byte(` a	bc`),
		},
	}, {
		raw: []byte(`#require:\ a\ `),
		exp: &Statement{
			kind: statementKindRequire,
			cmd:  ` a`,
			raw:  []byte(`\ a\`),
		},
	}, {
		raw: []byte(`#requ: a `),
		exp: &Statement{
			kind: statementKindComment,
			raw:  []byte(`#requ: a`),
		},
	}, {
		raw: []byte(`#local: echo "a"`),
		exp: &Statement{
			kind: statementKindLocal,
			cmd:  `echo`,
			args: []string{`a`},
			raw:  []byte(` echo "a"`),
		},
	}, {
		raw: []byte(`#put:user:group+0700$noparse src dst`),
		exp: &Statement{
			kind:       statementKindPut,
			owner:      `user:group`,
			mode:       0700,
			args:       []string{`src`, `dst`},
			raw:        []byte(`src dst`),
			optNoparse: true,
		},
	}, {
		raw: []byte(`#put:+0700$noparse src dst`),
		exp: &Statement{
			kind:       statementKindPut,
			mode:       0700,
			args:       []string{`src`, `dst`},
			raw:        []byte(`src dst`),
			optNoparse: true,
		},
	}, {
		raw: []byte(`#put:$noparse src dst`),
		exp: &Statement{
			kind:       statementKindPut,
			args:       []string{`src`, `dst`},
			raw:        []byte(`src dst`),
			optNoparse: true,
		},
	}, {
		raw: []byte(`#put:$unknown$noparse src dst`),
		exp: &Statement{
			kind:       statementKindPut,
			args:       []string{`src`, `dst`},
			raw:        []byte(`src dst`),
			optNoparse: true,
		},
	}}

	var (
		c   testCase
		got *Statement
		err error
	)

	for _, c = range cases {
		t.Logf(`ParseStatement: %s`, c.raw)

		got, err = ParseStatement(c.raw)
		if err != nil {
			test.Assert(t, `error`, c.expError, err.Error())
			continue
		}
		test.Assert(t, string(c.raw), c.exp, got)
	}
}
