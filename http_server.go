// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"

	libhttp "github.com/shuLhan/share/lib/http"
	"github.com/shuLhan/share/lib/memfs"

	"git.sr.ht/~shulhan/awwan/internal"
)

const (
	pathAwwanApiFs      = `/awwan/api/fs`
	pathAwwanApiExecute = `/awwan/api/execute`
)

const paramNamePath = `path`

const defListenAddress = `127.0.0.1:17600`

// httpServer awwan HTTP server for HTTP API and web user interface feature.
type httpServer struct {
	*libhttp.Server

	aww       *Awwan
	memfsBase *memfs.MemFS // The files caches.

	baseDir string
}

// newHttpServer create and initialize HTTP server to serve awwan HTTP API
// and web user interface.
func newHttpServer(aww *Awwan) (httpd *httpServer, err error) {
	var (
		logp = `newHttpServer`
	)

	httpd = &httpServer{
		aww:     aww,
		baseDir: aww.BaseDir,
	}

	var memfsBaseOpts = &memfs.Options{
		Root: aww.BaseDir,
		Excludes: []string{
			`.*/\.git`,
			`node_modules`,
			`vendor`,
			`.*\.(bz|bz2|gz|iso|jar|tar|xz|zip)`,
		},
		TryDirect: true, // Only store the file structures in the memory.
	}

	httpd.memfsBase, err = memfs.New(memfsBaseOpts)
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}

	var serverOpts = &libhttp.ServerOptions{
		Memfs:   internal.MemfsWui,
		Address: defListenAddress,
	}

	httpd.Server, err = libhttp.NewServer(serverOpts)
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}

	err = httpd.registerEndpoints()
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}

	return httpd, nil
}

// registerEndpoints register endpoint to be served by HTTP server.
func (httpd *httpServer) registerEndpoints() (err error) {
	var logp = `registerEndpoints`

	err = httpd.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodGet,
		Path:         pathAwwanApiFs,
		RequestType:  libhttp.RequestTypeQuery,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         httpd.awwanApiFsGet,
	})
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	err = httpd.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodDelete,
		Path:         pathAwwanApiFs,
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         httpd.awwanApiFsDelete,
	})
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	err = httpd.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodPost,
		Path:         pathAwwanApiFs,
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         httpd.awwanApiFsPost,
	})
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	err = httpd.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodPut,
		Path:         pathAwwanApiFs,
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         httpd.awwanApiFsPut,
	})
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	err = httpd.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodPost,
		Path:         pathAwwanApiExecute,
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         httpd.awwanApiExecute,
	})
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	return nil
}

// start the HTTP server.
func (httpd *httpServer) start() (err error) {
	fmt.Printf("--- Starting HTTP server at http://%s\n", httpd.Server.Options.Address)

	return httpd.Server.Start()
}

// awwanApiFsGet get the list of files or specific file using query
// parameter "path".
func (httpd *httpServer) awwanApiFsGet(epr *libhttp.EndpointRequest) (resb []byte, err error) {
	var (
		res = &libhttp.EndpointResponse{}

		node *memfs.Node
		path string
	)

	path = epr.HttpRequest.Form.Get(paramNamePath)
	if len(path) == 0 {
		res.Code = http.StatusOK
		res.Data = httpd.memfsBase
		return json.Marshal(res)
	}

	node, err = httpd.memfsBase.Get(path)
	if err != nil {
		return nil, err
	}

	res.Code = http.StatusOK
	res.Data = node
	return json.Marshal(res)
}

// awwanApiFsDelete an HTTP API to delete a file.
//
// Request format,
//
//	DELETE /awwan/api/fs
//	Content-Type: application/json
//
//	{
//		"path": <string>, the path to file or directory to be removed.
//		"is_dir": <boolean>, true if its directory.
//	}
//
// Response format,
//
//	Content-Type: application/json
//
//	{
//		"code": <number>
//		"message": <string>
//	}
//
// List of valid response code,
//   - 200: OK.
//   - 400: Bad request.
//   - 401: Unauthorized.
//   - 404: File not found.
func (httpd *httpServer) awwanApiFsDelete(epr *libhttp.EndpointRequest) (resb []byte, err error) {
	var (
		logp = `awwanApiFsDelete`
		res  = &libhttp.EndpointResponse{}
		req  = &fsRequest{}

		parentPath string
		sysPath    string
		nodeParent *memfs.Node
	)

	res.Code = http.StatusBadRequest

	err = json.Unmarshal(epr.RequestBody, req)
	if err != nil {
		res.Message = err.Error()
		return nil, res
	}

	parentPath = path.Dir(req.Path)
	nodeParent = httpd.memfsBase.PathNodes.Get(parentPath)
	if nodeParent == nil {
		res.Message = fmt.Sprintf("%s: invalid path %s", logp, req.Path)
		return nil, res
	}

	var (
		basePath = path.Base(req.Path)
		child    = nodeParent.Child(basePath)
	)

	if child == nil {
		res.Message = fmt.Sprintf(`%s: child not found %q`, logp, basePath)
		return nil, res
	}

	sysPath = filepath.Join(nodeParent.SysPath, path.Base(req.Path))
	sysPath, err = filepath.Abs(sysPath)
	if err != nil {
		res.Message = fmt.Sprintf("%s: %s", logp, err)
		return nil, res
	}
	if !strings.HasPrefix(sysPath, httpd.memfsBase.Opts.Root) {
		res.Message = fmt.Sprintf("%s: invalid path %q", logp, sysPath)
		return nil, res
	}

	err = os.Remove(sysPath)
	if err != nil {
		res.Code = http.StatusInternalServerError
		res.Message = fmt.Sprintf("%s: %s", logp, err)
		return nil, res
	}

	_ = httpd.memfsBase.RemoveChild(nodeParent, child)

	res.Code = http.StatusOK
	res.Message = fmt.Sprintf("%s: %q has been removed", logp, sysPath)

	return json.Marshal(res)
}

// awwanApiFsPost create new directory or file.
//
// # Request
//
// Format,
//
//	POST /awwan/api/fs
//	Content-Type: application/json
//
//	{
//		"path": <string>, the path to new directory or file.
//		"is_dir": <boolean>, true if its directory.
//	}
func (httpd *httpServer) awwanApiFsPost(epr *libhttp.EndpointRequest) (rawBody []byte, err error) {
	var (
		logp = `awwanApiFsPost`
		res  = &libhttp.EndpointResponse{}
		req  = &fsRequest{}

		nodeParent *memfs.Node
		node       *memfs.Node
		fi         os.FileInfo
		parentPath string
		sysPath    string
	)

	res.Code = http.StatusBadRequest

	err = json.Unmarshal(epr.RequestBody, req)
	if err != nil {
		res.Message = fmt.Sprintf("%s: %s", logp, err)
		return nil, res
	}

	parentPath = path.Dir(req.Path)
	nodeParent = httpd.memfsBase.PathNodes.Get(parentPath)
	if nodeParent == nil {
		res.Message = fmt.Sprintf("%s: invalid path %s", logp, req.Path)
		return nil, res
	}
	node = httpd.memfsBase.PathNodes.Get(req.Path)
	if node != nil {
		res.Message = fmt.Sprintf("%s: file exist", logp)
		return nil, res
	}

	res.Code = http.StatusInternalServerError

	sysPath = filepath.Join(nodeParent.SysPath, path.Base(req.Path))
	sysPath, err = filepath.Abs(sysPath)
	if err != nil {
		res.Message = fmt.Sprintf("%s: %s", logp, err)
		return nil, res
	}
	if !strings.HasPrefix(sysPath, httpd.memfsBase.Opts.Root) {
		res.Message = fmt.Sprintf("%s: invalid path %q", logp, sysPath)
		return nil, res
	}
	if req.IsDir {
		err = os.Mkdir(sysPath, 0700)
	} else {
		err = os.WriteFile(sysPath, nil, 0600)
	}
	if err != nil {
		res.Message = fmt.Sprintf("%s: %s", logp, err)
		return nil, res
	}

	fi, err = os.Stat(sysPath)
	if err != nil {
		res.Message = fmt.Sprintf("%s: %s", logp, err)
		return nil, res
	}

	node, err = httpd.memfsBase.AddChild(nodeParent, fi)
	if err != nil {
		res.Message = fmt.Sprintf("%s: %s", logp, err)
		return nil, res
	}

	res.Code = http.StatusOK
	res.Data = node

	return json.Marshal(res)
}

// awwanApiFsPut save the content of file.
func (httpd *httpServer) awwanApiFsPut(epr *libhttp.EndpointRequest) (rawBody []byte, err error) {
	var (
		logp = "awwanApiFsPut"
		res  = &libhttp.EndpointResponse{}
		req  = &fsRequest{}

		node *memfs.Node
	)

	res.Code = http.StatusInternalServerError

	err = json.Unmarshal(epr.RequestBody, req)
	if err != nil {
		res.Message = fmt.Sprintf("%s: %s", logp, err)
		return nil, res
	}

	node = httpd.memfsBase.PathNodes.Get(req.Path)
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

func (httpd *httpServer) awwanApiExecute(epr *libhttp.EndpointRequest) (resb []byte, err error) {
	var (
		logp = "awwanApiExecute"
		req  = &Request{}
		res  = &libhttp.EndpointResponse{}
	)

	res.Code = http.StatusInternalServerError

	err = json.Unmarshal(epr.RequestBody, req)
	if err != nil {
		res.Message = fmt.Sprintf("%s: %s", logp, err)
		return nil, res
	}

	req.Script = filepath.Join(httpd.memfsBase.Opts.Root, req.Script)
	req.lineRange = parseLineRange(req.LineRange)
	req.init()

	var (
		data = &HttpResponse{
			Request: req,
		}

		logw bytes.Buffer
	)

	req.registerLogWriter(`output`, &logw)

	if req.Mode == CommandModeLocal {
		err = httpd.aww.Local(req)
	} else {
		err = httpd.aww.Play(req)
	}
	if err != nil {
		data.Error = err.Error()
	}

	data.Output = logw.Bytes()

	res.Code = http.StatusOK
	res.Data = data

	return json.Marshal(res)
}
