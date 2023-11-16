// SPDX-FileCopyrightText: 2023 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/shuLhan/share/lib/test"
)

func TestAwwanEnvGet(t *testing.T) {
	var (
		baseDir = `testdata/env-get`

		aww *Awwan
		err error
	)

	aww, err = New(baseDir)
	if err != nil {
		t.Fatal(err)
	}

	type testCase struct {
		desc string
		dir  string
		key  string
		exp  string
	}
	var cases = []testCase{{
		desc: `withEmptyKey`,
		dir:  baseDir,
		exp:  `EnvGet: empty key`,
	}, {
		desc: `withMissingSection`,
		dir:  baseDir,
		key:  `::name`,
	}, {
		desc: `withMissingName`,
		dir:  baseDir,
		key:  `host`,
	}, {
		desc: `withValidName`,
		dir:  baseDir,
		key:  `host::name`,
		exp:  `localhost`,
	}, {
		desc: `fromVault`,
		dir:  baseDir,
		key:  `user:database:pass`,
		exp:  `s3cret`,
	}, {
		desc: `fromSubdirMyhost`,
		dir:  filepath.Join(baseDir, `myhost`),
		key:  `host::name`,
		exp:  `myhost`,
	}}

	var (
		c   testCase
		got string
	)
	for _, c = range cases {
		got, err = aww.EnvGet(c.dir, c.key)
		if err != nil {
			test.Assert(t, c.desc+` error`, c.exp, err.Error())
			continue
		}

		test.Assert(t, c.desc, c.exp, got)
	}
}

func TestAwwanEnvSet(t *testing.T) {
	var (
		baseDir = t.TempDir()

		tdata *test.Data
		err   error
	)

	testInitWorkspace(baseDir, nil, nil)

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
		gotValue   string
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

		gotValue, err = aww.EnvGet(baseDir, c.key)
		if err != nil {
			t.Fatal(err)
		}

		test.Assert(t, c.desc+` EnvGet`, c.val, gotValue)
	}
}
