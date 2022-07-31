// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"testing"

	"github.com/shuLhan/share/lib/test"
)

func TestParseStatement(t *testing.T) {
	type testCase struct {
		exp *Statement
		raw []byte
	}

	var cases = []testCase{{
		raw: []byte(`#get: a\ b c`),
		exp: &Statement{
			kind: statementKindGet,
			cmd:  `a b`,
			args: []string{"c"},
			raw:  []byte(` a\ b c`),
		},
	}, {
		raw: []byte(`#put: a b c\ `),
		exp: &Statement{
			kind: statementKindPut,
			cmd:  "a",
			args: []string{"b", `c`},
			raw:  []byte(` a b c\`),
		},
	}, {
		raw: []byte(`#get! a\	b	c`),
		exp: &Statement{
			kind: statementKindSudoGet,
			cmd:  `a	b`,
			args: []string{
				"c",
			},
			raw: []byte(` a\	b	c`),
		},
	}, {
		raw: []byte(`#put! a	bc `),
		exp: &Statement{
			kind: statementKindSudoPut,
			cmd:  `a`,
			args: []string{"bc"},
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
	}}

	var (
		c   testCase
		got *Statement
		err error
	)

	for _, c = range cases {
		got, err = ParseStatement(c.raw)
		if err != nil {
			t.Fatal(err)
		}
		test.Assert(t, string(c.raw), c.exp, got)
	}
}
