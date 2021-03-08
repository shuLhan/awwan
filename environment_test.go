// Copyright 2020, Shulhan <ms@kilabit.info>. All rights reserved.
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

func TestEnvironment_generatePaths(t *testing.T) {
	var err error

	env := &environment{}
	env.BaseDir, err = os.Getwd()
	if err != nil {
		t.Fatal(err)
	}

	cases := []struct {
		scriptDir string
		exp       []string
		expError  string
	}{{
		scriptDir: "/tmp/test.aww",
		expError:  fmt.Sprintf(`%q must be under %q`, "/tmp", env.BaseDir),
	}, {
		scriptDir: "../test.aww",
		expError:  fmt.Sprintf(`%q must be under %q`, "..", env.BaseDir),
	}, {
		scriptDir: "test.aww",
		exp: []string{
			env.BaseDir,
		},
	}, {
		scriptDir: "testdata/test.aww",
		exp: []string{
			filepath.Join(env.BaseDir),
			filepath.Join(env.BaseDir, "testdata"),
		},
	}, {
		scriptDir: "./testdata/a/test.aww",
		exp: []string{
			filepath.Join(env.BaseDir),
			filepath.Join(env.BaseDir, "testdata"),
			filepath.Join(env.BaseDir, "testdata", "a"),
		},
	}, {
		scriptDir: "testdata/../testdata/a/test.aww",
		exp: []string{
			filepath.Join(env.BaseDir),
			filepath.Join(env.BaseDir, "testdata"),
			filepath.Join(env.BaseDir, "testdata", "a"),
		},
	}}

	for _, c := range cases {
		t.Logf(c.scriptDir)

		env.parseArgScript(c.scriptDir)
		got, err := env.generatePaths()
		if err != nil {
			test.Assert(t, "error", c.expError, err.Error(), true)
			continue
		}
		test.Assert(t, "generatePaths:", c.exp, got, true)
	}
}
