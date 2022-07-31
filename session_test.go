// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"fmt"
	"os"
	"path/filepath"
	"testing"

	"github.com/shuLhan/share/lib/test"
)

func TestSession_generatePaths(t *testing.T) {
	type testCase struct {
		scriptPath string
		expError   string
		exp        []string
	}

	var (
		ses = &Session{}

		err error
	)

	ses.BaseDir, err = os.Getwd()
	if err != nil {
		t.Fatal(err)
	}

	var cases = []testCase{{
		scriptPath: "/tmp/test.aww",
		expError:   fmt.Sprintf(`generatePaths: %q must be under %q`, "/tmp", ses.BaseDir),
	}, {
		scriptPath: "../test.aww",
		expError:   fmt.Sprintf(`generatePaths: %q must be under %q`, "..", ses.BaseDir),
	}, {
		scriptPath: "test.aww",
		exp: []string{
			ses.BaseDir,
		},
	}, {
		scriptPath: "testdata/test.aww",
		exp: []string{
			filepath.Join(ses.BaseDir),
			filepath.Join(ses.BaseDir, "testdata"),
		},
	}, {
		scriptPath: "./testdata/a/test.aww",
		exp: []string{
			filepath.Join(ses.BaseDir),
			filepath.Join(ses.BaseDir, "testdata"),
			filepath.Join(ses.BaseDir, "testdata", "a"),
		},
	}, {
		scriptPath: "testdata/../testdata/a/test.aww",
		exp: []string{
			filepath.Join(ses.BaseDir),
			filepath.Join(ses.BaseDir, "testdata"),
			filepath.Join(ses.BaseDir, "testdata", "a"),
		},
	}}

	var (
		c          testCase
		scriptPath string
	)

	for _, c = range cases {
		t.Logf(c.scriptPath)

		scriptPath = filepath.Clean(c.scriptPath)
		ses.ScriptDir = filepath.Dir(scriptPath)
		ses.hostname = filepath.Base(ses.ScriptDir)

		err = ses.generatePaths()
		if err != nil {
			test.Assert(t, "error", c.expError, err.Error())
			continue
		}
		test.Assert(t, "generatePaths:", c.exp, ses.paths)
	}
}
