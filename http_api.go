// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package awwan

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"path/filepath"

	libbytes "github.com/shuLhan/share/lib/bytes"
	libhttp "github.com/shuLhan/share/lib/http"
)

const (
	httpApiFs      = "/awwan/api/fs"
	httpApiExecute = "/awwan/api/execute"

	paramNamePath = "path"
)

type fsRequest struct {
	Path    string `json:"path"`
	Content []byte `json:"content"`
	IsDir   bool   `json:"is_dir"`
}

func (aww *Awwan) registerHttpApis() (err error) {
	logp := "registerHttpApis"

	err = aww.httpd.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodGet,
		Path:         httpApiFs,
		RequestType:  libhttp.RequestTypeQuery,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         aww.httpApiFs,
	})
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	err = aww.httpd.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodPut,
		Path:         httpApiFs,
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         aww.httpApiFsPut,
	})
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	err = aww.httpd.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodPost,
		Path:         httpApiExecute,
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         aww.httpApiExecute,
	})
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	return nil
}

//
// httpApiFs get the list of files or specific file using query parameter
// "path".
//
func (aww *Awwan) httpApiFs(epr *libhttp.EndpointRequest) ([]byte, error) {
	res := &libhttp.EndpointResponse{}

	path := epr.HttpRequest.Form.Get(paramNamePath)
	if len(path) == 0 {
		res.Code = http.StatusOK
		res.Data = aww.memfsBase
		return json.Marshal(res)
	}

	node, err := aww.memfsBase.Get(path)
	if err != nil {
		return nil, err
	}

	res.Code = http.StatusOK
	res.Data = node
	return json.Marshal(res)
}

//
// httpApiFsPut save the content of file.
//
func (aww *Awwan) httpApiFsPut(epr *libhttp.EndpointRequest) (rawBody []byte, err error) {
	var (
		logp = "httpApiFsPut"
		res  = &libhttp.EndpointResponse{}
		req  = &fsRequest{}
	)

	res.Code = http.StatusInternalServerError

	err = json.Unmarshal(epr.RequestBody, req)
	if err != nil {
		res.Message = fmt.Sprintf("%s: %s", logp, err)
		return nil, res
	}

	node := aww.memfsBase.PathNodes.Get(req.Path)
	if node == nil {
		res.Code = http.StatusNotFound
		res.Message = fmt.Sprintf("%s: invalid or empty path %s", logp, req.Path)
		return nil, res
	}

	err = node.Save(req.Content)
	if err != nil {
		res.Message = fmt.Sprintf("%s: %s", logp, err)
		return nil, res
	}

	res.Code = http.StatusOK
	res.Data = node

	return json.Marshal(res)
}

func (aww *Awwan) httpApiExecute(epr *libhttp.EndpointRequest) ([]byte, error) {
	var (
		logp = "httpApiExecute"
		req  = NewRequest()
		res  = &libhttp.EndpointResponse{}
	)

	res.Code = http.StatusInternalServerError

	err := json.Unmarshal(epr.RequestBody, req)
	if err != nil {
		res.Message = fmt.Sprintf("%s: %s", logp, err)
		return nil, res
	}

	req.Script = filepath.Join(aww.memfsBase.Opts.Root, req.Script)
	if req.BeginAt == 0 && req.EndAt == 0 {
		req.BeginAt = 1
		req.EndAt = math.MaxInt
	}
	if req.EndAt < req.BeginAt {
		req.EndAt = req.BeginAt
	}

	aww.bufout.Reset()
	aww.buferr.Reset()

	req.stdout = &aww.bufout
	req.stderr = &aww.buferr

	if req.Mode == CommandModeLocal {
		err = aww.Local(req)
	} else {
		err = aww.Play(req)
	}
	if err != nil {
		res.Message = fmt.Sprintf("%s: %s", logp, err)
		return nil, res
	}

	data := &HttpResponse{
		Request: req,
		Stdout:  libbytes.Copy(aww.bufout.Bytes()),
		Stderr:  libbytes.Copy(aww.buferr.Bytes()),
	}

	res.Code = http.StatusOK
	res.Data = data

	return json.Marshal(res)
}
