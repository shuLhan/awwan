// SPDX-FileCopyrightText: 2019 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

//go:build integration

package awwan

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	libhttp "github.com/shuLhan/share/lib/http"
	"github.com/shuLhan/share/lib/test"
)

// Here is what happened,
// 1) Run "awwan serve"
// 2) Update ".ssh/config" with new host
// 3) Create and run script with new host.
//
// This will cause the awwan play failed with empty SSH host,
//
//	--- SSH connection: @:22
//
// or an error,
//
//	!!! initSSHClient: NewClientInteractive: dialWithSigners: ssh:
//	  handshake failed: knownhosts: key is unknown from known_hosts
//	  files
func TestHttpServerPlaySshConfigChanges(t *testing.T) {
	var (
		baseDir   = `testdata/http_server/play_ssh_config_changes`
		sshConfig = filepath.Join(baseDir, `.ssh`, `config`)

		aww *Awwan
		err error
	)

	var tdata *test.Data

	tdata, err = test.LoadData(filepath.Join(baseDir, `test.data`))
	if err != nil {
		t.Fatal(err)
	}

	// Write the oldhost in .ssh/config.

	err = os.WriteFile(sshConfig, tdata.Input[`.ssh/config`], 0600)
	if err != nil {
		t.Fatal(err)
	}

	// Start the "awwan serve".

	aww, err = New(baseDir)
	if err != nil {
		t.Fatal(err)
	}

	var httpd *httpServer

	httpd, err = newHttpServer(aww, ``)
	if err != nil {
		t.Fatal(err)
	}

	// Test execute play on oldhost first.

	testHttpExecute(t, httpd, tdata, `play_on_oldhost`)

	// Update .ssh/config with new host.

	err = os.WriteFile(sshConfig, tdata.Input[`.ssh/config:newhost`], 0600)
	if err != nil {
		t.Fatal(err)
	}

	// Test execute play on newhost.

	testHttpExecute(t, httpd, tdata, `play_on_newhost`)
}

func testHttpExecute(t *testing.T, httpd *httpServer, tdata *test.Data, tag string) {
	var reqBody bytes.Buffer

	reqBody.Write(tdata.Input[tag])

	var httpReq = httptest.NewRequest(http.MethodPost, pathAwwanApiExecute, &reqBody)
	var httpWriter = httptest.NewRecorder()

	httpd.ServeHTTP(httpWriter, httpReq)

	var (
		httpRes *http.Response
		bbuf    bytes.Buffer
		rawb    []byte
		expResp []byte
	)

	httpRes = httpWriter.Result()
	rawb, _ = io.ReadAll(httpRes.Body)

	json.Indent(&bbuf, rawb, ``, `  `)

	expResp = tdata.Output[tag+`:output:json`]

	test.Assert(t, tag, string(expResp), bbuf.String())

	var (
		execRes ExecResponse
		epRes   libhttp.EndpointResponse
		err     error
	)

	epRes.Data = &execRes

	err = json.Unmarshal(rawb, &epRes)
	if err != nil {
		t.Fatal(err)
	}

	expResp = tdata.Output[tag+`:output`]
	test.Assert(t, tag+`:output`, string(expResp), strings.Join(execRes.Output, "\n"))
}
