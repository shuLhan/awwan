// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package awwan

import (
	"fmt"
	"os"
	"path/filepath"
	"testing"

	"github.com/shuLhan/share/lib/test"
)

func TestSession_generatePaths(t *testing.T) {
	var err error

	ses := &Session{}
	ses.BaseDir, err = os.Getwd()
	if err != nil {
		t.Fatal(err)
	}

	cases := []struct {
		scriptPath string
		exp        []string
		expError   string
	}{{
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

	for _, c := range cases {
		t.Logf(c.scriptPath)

		scriptPath := filepath.Clean(c.scriptPath)
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
