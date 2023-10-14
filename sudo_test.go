// SPDX-FileCopyrightText: 2023 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

//go:build integration

package awwan

import (
	"bytes"
	"testing"

	"github.com/shuLhan/share/lib/test"
)

func TestExecLocal_sudo(t *testing.T) {
	type testCase struct {
		desc      string
		sudoPass  string
		expOutput string
		expError  []string
		listStmt  []Statement
	}

	var (
		mockin  = &mockStdin{}
		mockout = &bytes.Buffer{}
		req     = &Request{
			stdin:  mockin,
			stdout: mockout,
			stderr: mockout,
		}
		err error
	)

	var cases = []testCase{{
		desc: `SingleSudo`,
		listStmt: []Statement{{
			cmd:  `sudo`,
			args: []string{`echo "hello sudo"`},
		}},
		sudoPass:  "awwan\n",
		expOutput: "[sudo] password for awwan: hello sudo\n",
	}, {
		desc: `MultipleSudo`,
		listStmt: []Statement{{
			cmd:  `sudo`,
			args: []string{`echo "hello sudo #1"`},
		}, {
			cmd:  `sudo`,
			args: []string{`echo "hello sudo #2"`},
		}},
		sudoPass:  "awwan\nawwan\n",
		expOutput: "[sudo] password for awwan: hello sudo #1\n[sudo] password for awwan: hello sudo #2",
	}, {
		desc: `WithInvalidPassword`,
		listStmt: []Statement{{
			cmd:  `sudo`,
			args: []string{`echo "hello sudo"`},
		}},
		sudoPass:  "invalid\n",
		expError:  []string{`ExecLocal: exit status 1`},
		expOutput: "[sudo] password for awwan: sudo: 1 incorrect password attempt\n",
	}, {
		desc: `MultipleSudoOneInvalid`,
		listStmt: []Statement{{
			cmd:  `sudo`,
			args: []string{`echo "hello sudo #1"`},
		}, {
			cmd:  `sudo`,
			args: []string{`echo "hello sudo #2"`},
		}},
		sudoPass: "awwan\ninvalid\n",
		expError: []string{
			``,
			`ExecLocal: exit status 1`,
		},
		expOutput: "[sudo] password for awwan: hello sudo #1\n[sudo] password for awwan: sudo: 1 incorrect password attempt\n",
	}}

	var (
		c    testCase
		stmt Statement
		x    int
	)

	for _, c = range cases {
		t.Log(c.desc)

		mockout.Reset()
		mockin.buf.Reset()
		mockin.buf.WriteString(c.sudoPass)

		for x, stmt = range c.listStmt {
			err = ExecLocal(req, &stmt)
			if err != nil {
				t.Log(mockout.String())
				var expError = c.expError[x]
				test.Assert(t, `error`, expError, err.Error())
			}
		}

		test.Assert(t, c.desc+` output`, c.expOutput, mockout.String())
	}
}
