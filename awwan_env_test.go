// SPDX-FileCopyrightText: 2023 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/shuLhan/share/lib/test"
)

func TestAwwanEnvSet(t *testing.T) {
	var (
		baseDir = t.TempDir()

		tdata *test.Data
		err   error
	)

	testInitWorkspace(baseDir)

	tdata, err = test.LoadData(`testdata/env_set_test.data`)
	if err != nil {
		t.Fatal(err)
	}

	var aww *Awwan

	aww, err = New(baseDir)
	if err != nil {
		t.Fatal(err)
	}

	type testCase struct {
		desc string
		file string
		key  string
		val  string
		exp  string
	}

	var file = filepath.Join(baseDir, `awwan.env`)

	var cases = []testCase{{
		desc: `withEmptyFile`,
		exp:  string(tdata.Output[`withEmptyFile:error`]),
	}, {
		desc: `withEmptyKey`,
		file: file,
		exp:  string(tdata.Output[`withEmptyKey:error`]),
	}, {
		desc: `withEmptyValue`,
		file: file,
		key:  `host::name`,
		exp:  string(tdata.Output[`withEmptyValue:error`]),
	}, {
		desc: `withMissingSection`,
		file: file,
		key:  `::name`,
		exp:  string(tdata.Output[`withMissingSection:error`]),
		val:  `awwan`,
	}, {
		desc: `withMissingName`,
		file: file,
		key:  `host`,
		exp:  string(tdata.Output[`withMissingName:error`]),
		val:  `awwan`,
	}, {
		desc: `withFileNotExist`,
		file: file,
		key:  `host::name`,
		val:  `awwan`,
		exp:  string(tdata.Output[`withFileNotExist`]),
	}, {
		desc: `withOverwriteValue`,
		file: file,
		key:  `host::name`,
		val:  `overwrite`,
		exp:  string(tdata.Output[`withOverwriteValue`]),
	}}

	var (
		c          testCase
		gotContent []byte
	)

	for _, c = range cases {
		err = aww.EnvSet(c.file, c.key, c.val)
		if err != nil {
			test.Assert(t, c.desc, c.exp, err.Error())
			continue
		}

		gotContent, err = os.ReadFile(c.file)
		if err != nil {
			t.Fatal(err)
		}

		test.Assert(t, c.desc, c.exp, string(gotContent))
	}
}
