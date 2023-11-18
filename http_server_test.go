// SPDX-FileCopyrightText: 2023 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	libhttp "github.com/shuLhan/share/lib/http"
	"github.com/shuLhan/share/lib/test"
)

func TestHttpServer_Decrypt(t *testing.T) {
	type testCase struct {
		desc    string
		expResp string
		expErr  string
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

	httpd, err = newHttpServer(aww, ``)
	if err != nil {
		t.Fatal(err)
	}

	var endpointDecrypt = &libhttp.Endpoint{
		Method:       libhttp.RequestMethodPost,
		Path:         pathAwwanApiDecrypt,
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
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
		json.Indent(&gotResp, resp, ``, `  `)
		test.Assert(t, c.desc, c.expResp, gotResp.String())
	}
}

func TestHttpServer_Encrypt(t *testing.T) {
	type testCase struct {
		desc    string
		expResp string
		expErr  string
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

	httpd, err = newHttpServer(aww, ``)
	if err != nil {
		t.Fatal(err)
	}

	var endpointEncrypt = &libhttp.Endpoint{
		Method:       libhttp.RequestMethodPost,
		Path:         pathAwwanApiEncrypt,
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
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
		json.Indent(&gotResp, resp, ``, `  `)
		test.Assert(t, c.desc, c.expResp, gotResp.String())
	}
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

	httpd, err = newHttpServer(aww, ``)
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

		httpReq = httptest.NewRequest(http.MethodGet, pathAwwanApiFs+`?path=`+c.path, nil)

		httpWriter = httptest.NewRecorder()

		httpd.ServeHTTP(httpWriter, httpReq)

		httpRes = httpWriter.Result()

		body, _ = io.ReadAll(httpRes.Body)

		jsonBody.Reset()
		json.Indent(&jsonBody, body, ``, `  `)
		test.Assert(t, c.desc, c.exp, jsonBody.String())
	}
}
