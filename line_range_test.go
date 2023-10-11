// SPDX-FileCopyrightText: 2023 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

//go:build !integration

package awwan

import (
	"testing"

	"github.com/shuLhan/share/lib/test"
)

func TestParseLineRange(t *testing.T) {
	type testCase struct {
		raw string
		exp lineRange
	}

	var cases = []testCase{{
		raw: ``,
	}, {
		raw: ` 1`,
		exp: lineRange{
			list: []linePosition{
				{start: 1, end: 1},
			},
		},
	}, {
		raw: ` ,1,`,
		exp: lineRange{
			list: []linePosition{
				{start: 1, end: 1},
			},
		},
	}, {
		raw: ` ,1,2-1,,-4,-4-6,4-6-,8-10,8-12,10-12,10-,16-,18-20`,
		exp: lineRange{
			list: []linePosition{
				{start: 1, end: 1},
				{start: 8, end: 10},
				{start: 16, end: 0},
			},
		},
	}}

	var (
		c   testCase
		got lineRange
	)
	for _, c = range cases {
		got = parseLineRange(c.raw)
		t.Logf("got.list: %+v", got.list)
		test.Assert(t, c.raw, c.exp, got)
	}
}
