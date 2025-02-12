// SPDX-FileCopyrightText: 2023 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"bytes"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/big"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	libhttp "git.sr.ht/~shulhan/pakakeh.go/lib/http"
	"git.sr.ht/~shulhan/pakakeh.go/lib/http/sseclient"
	libnet "git.sr.ht/~shulhan/pakakeh.go/lib/net"
	"git.sr.ht/~shulhan/pakakeh.go/lib/test"
)

func TestHttpServer_Decrypt(t *testing.T) {
	type testCase struct {
		desc    string
		expResp string
		reqBody []byte
	}

	var (
		tdata *test.Data
		err   error
	)

	tdata, err = test.LoadData(`testdata/http_server/decrypt_test.data`)
	if err != nil {
		t.Fatal(err)
	}

	var aww *Awwan

	aww, err = New(`testdata/encrypt-with-passfile`)
	if err != nil {
		t.Fatal(err)
	}

	var httpd *httpServer

	httpd, err = newHTTPServer(aww, ``)
	if err != nil {
		t.Fatal(err)
	}

	var endpointDecrypt = &libhttp.Endpoint{
		Path: pathAwwanAPIDecrypt,
	}

	var cases = []testCase{{
		desc:    `With valid request`,
		reqBody: tdata.Input[`withValidRequest/body`],
		expResp: string(tdata.Output[`withValidRequest/Response/body`]),
	}, {
		desc:    `With empty value`,
		reqBody: tdata.Input[`withEmptyValue/body`],
		expResp: string(tdata.Output[`withEmptyValue/Response/body`]),
	}, {
		desc:    `With directory`,
		reqBody: tdata.Input[`withDirectory/body`],
		expResp: string(tdata.Output[`withDirectory/Response/body`]),
	}, {
		desc:    `With file not exist`,
		reqBody: tdata.Input[`withFileNotExist/body`],
		expResp: string(tdata.Output[`withFileNotExist/Response/body`]),
	}}

	var (
		httpReq *http.Request
		httpRes *http.Response
		c       testCase
		reqBody bytes.Buffer
		gotResp bytes.Buffer
		resp    []byte
	)

	for _, c = range cases {
		t.Log(c.desc)

		reqBody.Reset()
		reqBody.Write(c.reqBody)

		httpReq = httptest.NewRequest(http.MethodPost, endpointDecrypt.Path, &reqBody)

		var httpWriter = httptest.NewRecorder()

		httpd.ServeHTTP(httpWriter, httpReq)

		httpRes = httpWriter.Result()

		resp, _ = io.ReadAll(httpRes.Body)

		gotResp.Reset()
		_ = json.Indent(&gotResp, resp, ``, `  `)
		test.Assert(t, c.desc, c.expResp, gotResp.String())
	}
}

func TestHttpServer_Encrypt(t *testing.T) {
	type testCase struct {
		desc    string
		expResp string
		reqBody []byte
	}

	var (
		tdata *test.Data
		err   error
	)

	tdata, err = test.LoadData(`testdata/http_server/encrypt_test.data`)
	if err != nil {
		t.Fatal(err)
	}

	var aww *Awwan

	aww, err = New(`testdata/encrypt-with-passfile`)
	if err != nil {
		t.Fatal(err)
	}

	var httpd *httpServer

	httpd, err = newHTTPServer(aww, ``)
	if err != nil {
		t.Fatal(err)
	}

	var endpointEncrypt = &libhttp.Endpoint{
		Path: pathAwwanAPIEncrypt,
	}

	var cases = []testCase{{
		desc:    `With valid request`,
		reqBody: tdata.Input[`withValidRequest/body`],
		expResp: string(tdata.Output[`withValidRequest/Response/body`]),
	}, {
		desc:    `With empty value`,
		reqBody: tdata.Input[`withEmptyValue/body`],
		expResp: string(tdata.Output[`withEmptyValue/Response/body`]),
	}, {
		desc:    `With directory`,
		reqBody: tdata.Input[`withDirectory/body`],
		expResp: string(tdata.Output[`withDirectory/Response/body`]),
	}, {
		desc:    `With file not exist`,
		reqBody: tdata.Input[`withFileNotExist/body`],
		expResp: string(tdata.Output[`withFileNotExist/Response/body`]),
	}}

	var (
		httpReq *http.Request
		httpRes *http.Response
		c       testCase
		reqBody bytes.Buffer
		gotResp bytes.Buffer
		resp    []byte
	)

	for _, c = range cases {
		var httpWriter = httptest.NewRecorder()

		reqBody.Reset()
		reqBody.Write(c.reqBody)

		httpReq = httptest.NewRequest(http.MethodPost, endpointEncrypt.Path, &reqBody)

		httpReq.Header.Set(libhttp.HeaderContentType, libhttp.ContentTypeJSON)

		httpd.ServeHTTP(httpWriter, httpReq)

		httpRes = httpWriter.Result()

		resp, _ = io.ReadAll(httpRes.Body)

		gotResp.Reset()
		_ = json.Indent(&gotResp, resp, ``, `  `)
		test.Assert(t, c.desc, c.expResp, gotResp.String())
	}
}

func TestHttpServer_Execute(t *testing.T) {
	var (
		baseDir = `testdata/http_server/execute`

		tdata *test.Data
		err   error
	)

	tdata, err = test.LoadData(baseDir + `/local_test.data`)
	if err != nil {
		t.Fatal(err)
	}

	var aww *Awwan

	aww, err = New(baseDir)
	if err != nil {
		t.Fatal(err)
	}

	var (
		address = testGenerateServerAddress()
		isDev   = false
	)

	go func() {
		err = aww.Serve(address, isDev)
		if err != nil {
			log.Fatal(err)
		}
	}()

	err = libnet.WaitAlive(`tcp`, address, 10*time.Second)
	if err != nil {
		t.Fatal(err)
	}

	var (
		clientOpts = libhttp.ClientOptions{
			ServerURL: `http://` + address,
		}
		reqJSON = tdata.Input[`local:/local.aww:1-`]

		execRequest ExecRequest
		cl          *libhttp.Client
	)

	cl = libhttp.NewClient(clientOpts)

	err = json.Unmarshal(reqJSON, &execRequest)
	if err != nil {
		t.Fatal(err)
	}

	var (
		clientReq = libhttp.ClientRequest{
			Path:   pathAwwanAPIExecute,
			Params: &execRequest,
		}
		clientResp *libhttp.ClientResponse
	)

	clientResp, err = cl.PostJSON(clientReq)
	if err != nil {
		t.Fatal(err)
	}

	var buf bytes.Buffer

	_ = json.Indent(&buf, clientResp.Body, ``, `  `)

	var expResp = string(tdata.Output[`local:/local.aww:1-`])

	test.Assert(t, `First response`, expResp, buf.String())

	var (
		res      libhttp.EndpointResponse
		execResp ExecResponse
	)

	res.Data = &execResp

	err = json.Unmarshal(clientResp.Body, &res)
	if err != nil {
		t.Fatal(err)
	}

	// Tail the execution output.

	var ssec = sseclient.Client{
		Endpoint: fmt.Sprintf(`http://%s%s?id=%s`, address, pathAwwanAPIExecuteTail, execResp.ID),
	}

	err = ssec.Connect(nil)
	if err != nil {
		t.Fatal(err)
	}

	var (
		timeWait = time.NewTimer(1 * time.Second)
		ever     = true

		ev sseclient.Event
	)
	buf.Reset()
	for ever {
		select {
		case ev = <-ssec.C:
			if len(ev.Type) != 0 {
				fmt.Fprintf(&buf, "event: %s\n", ev.Type)
			}
			if len(ev.Data) != 0 {
				fmt.Fprintf(&buf, "data: %q\n", ev.Data)
			}
			if len(ev.ID) != 0 {
				fmt.Fprintf(&buf, "id: %s\n", ev.ID)
			}
			buf.WriteByte('\n')

			if ev.Type == "end" {
				ever = false
				break
			}
		case <-timeWait.C:
			break
		}
	}

	test.Assert(t, `Execute tail`, string(tdata.Output[`local:/local.aww:1-:tail`]), buf.String())
}

func TestHttpServer_ExecuteCancel(t *testing.T) {
	var (
		baseDir = `testdata/http_server/execute`

		tdata *test.Data
		err   error
	)

	tdata, err = test.LoadData(baseDir + `/cancel_test.data`)
	if err != nil {
		t.Fatal(err)
	}

	var aww *Awwan

	aww, err = New(baseDir)
	if err != nil {
		t.Fatal(err)
	}

	var (
		address = testGenerateServerAddress()
		isDev   = false
	)

	go func() {
		err = aww.Serve(address, isDev)
		if err != nil {
			log.Fatal(err)
		}
	}()

	err = libnet.WaitAlive(`tcp`, address, 10*time.Second)
	if err != nil {
		t.Fatal(err)
	}

	var (
		clientOpts = libhttp.ClientOptions{
			ServerURL: `http://` + address,
		}
		reqJSON = tdata.Input[`local:/cancel.aww:1-`]

		execRequest ExecRequest
		cl          *libhttp.Client
	)

	cl = libhttp.NewClient(clientOpts)

	err = json.Unmarshal(reqJSON, &execRequest)
	if err != nil {
		t.Fatal(err)
	}

	var (
		clientReq = libhttp.ClientRequest{
			Path:   pathAwwanAPIExecute,
			Params: &execRequest,
		}
		clientResp *libhttp.ClientResponse
	)

	clientResp, err = cl.PostJSON(clientReq)
	if err != nil {
		t.Fatal(err)
	}

	var buf bytes.Buffer

	_ = json.Indent(&buf, clientResp.Body, ``, `  `)

	var expResp = string(tdata.Output[`local:/cancel.aww:1-`])

	test.Assert(t, `First response`, expResp, buf.String())

	var (
		res      libhttp.EndpointResponse
		execResp ExecResponse
	)

	res.Data = &execResp

	err = json.Unmarshal(clientResp.Body, &res)
	if err != nil {
		t.Fatal(err)
	}

	// Tail the execution output.

	var ssec = sseclient.Client{
		Endpoint: fmt.Sprintf(`http://%s%s?id=%s`, address, pathAwwanAPIExecuteTail, execResp.ID),
	}

	err = ssec.Connect(nil)
	if err != nil {
		t.Fatal(err)
	}

	var (
		timeWait = time.NewTimer(1 * time.Second)
		ever     = true

		ev sseclient.Event
	)
	buf.Reset()
	for ever {
		select {
		case ev = <-ssec.C:
			if len(ev.Type) != 0 {
				fmt.Fprintf(&buf, "event: %s\n", ev.Type)
			}
			if len(ev.Data) != 0 {
				fmt.Fprintf(&buf, "data: %q\n", ev.Data)
			}
			if len(ev.ID) != 0 {
				fmt.Fprintf(&buf, "id: %s\n", ev.ID)
			}
			buf.WriteByte('\n')

			if ev.ID == `1` {
				testDoExecuteCancel(t, tdata, cl, execResp.ID)
			}

			if ev.Type == "end" {
				ever = false
				break
			}
		case <-timeWait.C:
			break
		}
	}

	test.Assert(t, `Execute cancel`, string(tdata.Output[`local:/cancel.aww:1-:tail`]), buf.String())
}

func testDoExecuteCancel(t *testing.T, tdata *test.Data, cl *libhttp.Client, execID string) {
	var (
		clientReq = libhttp.ClientRequest{
			Path: pathAwwanAPIExecute,
			Params: url.Values{
				paramNameID: []string{execID},
			},
		}
		clientResp *libhttp.ClientResponse
		err        error
	)

	clientResp, err = cl.Delete(clientReq)
	if err != nil {
		t.Fatal(err)
	}

	test.Assert(t, `Cancel response`, string(tdata.Output[`local:/cancel.aww:1-:response`]), string(clientResp.Body))
}

func TestHttpServer_FSGet(t *testing.T) {
	var (
		tdata *test.Data
		err   error
	)

	tdata, err = test.LoadData(`testdata/http_server/fsget_test.data`)
	if err != nil {
		t.Fatal(err)
	}

	var aww *Awwan

	aww, err = New(`testdata/http_server/fsget`)
	if err != nil {
		t.Fatal(err)
	}

	var httpd *httpServer

	httpd, err = newHTTPServer(aww, ``)
	if err != nil {
		t.Fatal(err)
	}

	type testCase struct {
		desc string
		path string
		exp  string
	}
	var cases = []testCase{{
		desc: `getSshAwwanKey`,
		path: `/.ssh/awwan.key`,
		exp:  string(tdata.Output[`getSshAwwanKey`]),
	}, {
		desc: `getSshAwwanPass`,
		path: `/.ssh/awwan.pass`,
		exp:  string(tdata.Output[`getSshAwwanPass`]),
	}, {
		desc: `getSshAwwanKeyIndirectly`,
		path: `/myhost/../.ssh/awwan.key`,
		exp:  string(tdata.Output[`getSshAwwanKeyIndirectly`]),
	}}

	var (
		c          testCase
		httpReq    *http.Request
		httpRes    *http.Response
		httpWriter *httptest.ResponseRecorder
		body       []byte
		jsonBody   bytes.Buffer
	)

	for _, c = range cases {
		t.Log(c.desc)

		httpReq = httptest.NewRequest(http.MethodGet, pathAwwanAPIFs+`?path=`+c.path, nil)

		httpWriter = httptest.NewRecorder()

		httpd.ServeHTTP(httpWriter, httpReq)

		httpRes = httpWriter.Result()

		body, _ = io.ReadAll(httpRes.Body)

		jsonBody.Reset()
		_ = json.Indent(&jsonBody, body, ``, `  `)
		test.Assert(t, c.desc, c.exp, jsonBody.String())
	}
}

func testGenerateServerAddress() (address string) {
	var (
		max  = big.NewInt(60000)
		port = 1025

		bigport *big.Int
		err     error
	)

	bigport, err = rand.Int(rand.Reader, max)
	if err == nil {
		port = int(bigport.Int64() % 60000)
	}
	if port <= 1024 {
		port += 1024
	}
	return fmt.Sprintf(`127.0.0.1:%d`, port)
}
