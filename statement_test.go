// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package awwan

import (
	"testing"

	"github.com/shuLhan/share/lib/test"
)

func TestParseStatement(t *testing.T) {
	cases := []struct {
		raw []byte
		exp *Statement
	}{{
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
			cmd: `a	b`,
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
			raw: []byte(` a	bc`),
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

	for _, c := range cases {
		got, err := ParseStatement(c.raw)
		if err != nil {
			t.Fatal(err)
		}
		test.Assert(t, string(c.raw), c.exp, got)
	}
}
