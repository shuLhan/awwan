// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strconv"
	"strings"

	libhttp "github.com/shuLhan/share/lib/http"
	"github.com/shuLhan/share/lib/http/sseclient"
	"github.com/shuLhan/share/lib/memfs"

	"git.sr.ht/~shulhan/awwan/internal"
)

// List of available HTTP API.
const (
	pathAwwanApiDecrypt     = `/awwan/api/decrypt`
	pathAwwanApiEncrypt     = `/awwan/api/encrypt`
	pathAwwanApiExecute     = `/awwan/api/execute`
	pathAwwanApiExecuteTail = `/awwan/api/execute/tail`
	pathAwwanApiFs          = `/awwan/api/fs`
)

// List of known parameter in request.
const (
	paramNamePath = `path`
	paramNameID   = `id`
)

// DefListenAddress default HTTP server address to serve WUI.
const DefListenAddress = `127.0.0.1:17600`

// httpServer awwan HTTP server for HTTP API and web user interface feature.
type httpServer struct {
	*libhttp.Server

	// idExecRes contains the execution ID and its response.
	idExecRes map[string]*ExecResponse

	aww       *Awwan
	memfsBase *memfs.MemFS // The files caches.

	baseDir string
}

// newHttpServer create and initialize HTTP server to serve awwan HTTP API
// and web user interface.
func newHttpServer(aww *Awwan, address string) (httpd *httpServer, err error) {
	var (
		logp = `newHttpServer`
	)

	httpd = &httpServer{
		idExecRes: make(map[string]*ExecResponse),

		aww:     aww,
		baseDir: aww.BaseDir,
	}

	var memfsBaseOpts = &memfs.Options{
		Root: aww.BaseDir,
		Excludes: []string{
			`.*/\.git$`,
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
		Address: address,
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
		Call:         httpd.FSGet,
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

	var epDecrypt = libhttp.Endpoint{
		Method:       libhttp.RequestMethodPost,
		Path:         pathAwwanApiDecrypt,
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         httpd.Decrypt,
	}
	err = httpd.RegisterEndpoint(&epDecrypt)
	if err != nil {
		return fmt.Errorf(`%s %q: %w`, logp, epDecrypt.Path, err)
	}

	var epEncrypt = libhttp.Endpoint{
		Method:       libhttp.RequestMethodPost,
		Path:         pathAwwanApiEncrypt,
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         httpd.Encrypt,
	}
	err = httpd.RegisterEndpoint(&epEncrypt)
	if err != nil {
		return fmt.Errorf(`%s %q: %w`, logp, epEncrypt.Path, err)
	}

	err = httpd.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodPost,
		Path:         pathAwwanApiExecute,
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         httpd.Execute,
	})
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	// Register Server-sent events to tail the execution state and
	// output.

	var epExecuteTail = &libhttp.SSEEndpoint{
		Path: pathAwwanApiExecuteTail,
		Call: httpd.ExecuteTail,
	}
	err = httpd.RegisterSSE(epExecuteTail)
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}

	return nil
}

// start the HTTP server.
func (httpd *httpServer) start() (err error) {
	log.Printf(`--- Starting HTTP server at http://%s`, httpd.Server.Options.Address)

	return httpd.Server.Start()
}

// Decrypt the file by path.
//
// Request format,
//
//	POST /awwan/api/decrypt
//	Content-Type: application/json
//
//	{"path_vault":<string>}
//
// On success it will return the path to decrypted file.
//
//	Content-Type: application/json
//
//	{
//		"code": 200,
//		"data": {
//			"path": <string>,
//			"path_vault": <string>,
//		}
//	}
func (httpd *httpServer) Decrypt(epr *libhttp.EndpointRequest) (resb []byte, err error) {
	var (
		logp    = `Decrypt`
		httpRes = &libhttp.EndpointResponse{}

		decRes encryptResponse
	)

	err = json.Unmarshal(epr.RequestBody, &decRes)
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}

	httpRes.Code = http.StatusBadRequest

	decRes.PathVault = strings.TrimSpace(decRes.PathVault)
	if len(decRes.PathVault) == 0 {
		httpRes.Message = fmt.Sprintf(`%s: empty path_vault`, logp)
		return nil, httpRes
	}

	var nodeVault *memfs.Node

	nodeVault, err = httpd.memfsBase.Get(decRes.PathVault)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			httpRes.Message = fmt.Sprintf(`%s %q: %s`, logp, decRes.PathVault, fs.ErrNotExist)
		} else {
			httpRes.Message = fmt.Sprintf(`%s: %s`, logp, err)
		}
		return nil, httpRes
	}
	if nodeVault.IsDir() {
		httpRes.Message = fmt.Sprintf(`%s: %q is a directory`, logp, decRes.PathVault)
		return nil, httpRes
	}

	httpRes.Code = http.StatusInternalServerError

	decRes.Path, err = httpd.aww.Decrypt(nodeVault.SysPath)
	if err != nil {
		httpRes.Message = fmt.Sprintf(`%s: %s`, logp, err)
		return nil, httpRes
	}

	nodeVault.Parent.Update(nil, 0)

	decRes.Path, _ = strings.CutPrefix(decRes.Path, httpd.aww.BaseDir)

	httpRes.Code = http.StatusOK
	httpRes.Data = decRes

	resb, err = json.Marshal(&httpRes)
	if err != nil {
		return nil, err
	}

	return resb, nil
}

// Encrypt the file by path.
//
// Request format,
//
//	POST /awwan/api/encrypt
//	Content-Type: application/json
//
//	{"path":<string>}
//
// On success it will return the path to encrypted file in "path_vault",
//
//	Content-Type: application/json
//
//	{
//		"code": 200,
//		"data": {
//			"path": <string>,
//			"path_vault": <string>
//		}
//	}
func (httpd *httpServer) Encrypt(epr *libhttp.EndpointRequest) (resb []byte, err error) {
	var (
		logp    = `Encrypt`
		httpRes = &libhttp.EndpointResponse{}

		encRes encryptResponse
	)

	err = json.Unmarshal(epr.RequestBody, &encRes)
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}

	httpRes.Code = http.StatusBadRequest

	encRes.Path = strings.TrimSpace(encRes.Path)
	if len(encRes.Path) == 0 {
		httpRes.Message = fmt.Sprintf(`%s: empty path`, logp)
		return nil, httpRes
	}

	var node *memfs.Node

	node, err = httpd.memfsBase.Get(encRes.Path)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			httpRes.Message = fmt.Sprintf(`%s %q: %s`, logp, encRes.Path, fs.ErrNotExist)
		} else {
			httpRes.Message = fmt.Sprintf(`%s: %s`, logp, err)
		}
		return nil, httpRes
	}
	if node.IsDir() {
		httpRes.Message = fmt.Sprintf(`%s: %q is a directory`, logp, encRes.Path)
		return nil, httpRes
	}

	httpRes.Code = http.StatusInternalServerError

	encRes.PathVault, err = httpd.aww.Encrypt(node.SysPath)
	if err != nil {
		httpRes.Message = fmt.Sprintf(`%s: %s`, logp, err)
		return nil, httpRes
	}

	node.Parent.Update(nil, 0)

	encRes.PathVault, _ = strings.CutPrefix(encRes.PathVault, httpd.aww.BaseDir)

	httpRes.Code = http.StatusOK
	httpRes.Data = encRes

	resb, err = json.Marshal(&httpRes)
	if err != nil {
		return nil, err
	}

	return resb, nil
}

// FSGet get the list of files in directory or content of file by
// its path.
//
// Request format,
//
//	GET /awwan/api/fs?path=<string>
//
// Response format,
//
//	Content-Type: application/json
//
//	{"code":200,"data":<memfs.Node>}
func (httpd *httpServer) FSGet(epr *libhttp.EndpointRequest) (resb []byte, err error) {
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
	if path == `/.ssh/awwan.key` || path == `/.ssh/awwan.pass` {
		res.Code = http.StatusForbidden
		res.Message = `Forbidden`
		return nil, res
	}

	node, err = httpd.memfsBase.Get(path)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			res.Code = http.StatusNotFound
			res.Message = fmt.Sprintf(`%q not found`, path)
			return nil, res
		}
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

	// Make sure that the file end with LF.
	var lenContent = len(req.Content)
	if lenContent != 0 && req.Content[lenContent-1] != '\n' {
		req.Content = append(req.Content, '\n')
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

// Execute request to execute the script.
//
// Request format,
//
//	POST /awwan/api/execute
//	Content-Type: application/json
//
//	{
//		"mode": <string>,
//		"script": <string>,
//		"line_range": <string
//	}
//
// On success it will return the state of execution,
//
//	Content-Type: application/json
//
//	{
//		"code": 200,
//		"data": <ExecResponse>
//	}
//
// The ExecResponse contains ID that can be used to fetch the latest state
// of execution or to stream output.
func (httpd *httpServer) Execute(epr *libhttp.EndpointRequest) (resb []byte, err error) {
	var (
		logp = `Execute`
		req  = &ExecRequest{}
		res  = &libhttp.EndpointResponse{}
	)

	res.Code = http.StatusInternalServerError

	err = json.Unmarshal(epr.RequestBody, req)
	if err != nil {
		res.Message = fmt.Sprintf("%s: %s", logp, err)
		return nil, res
	}

	err = req.init(httpd.memfsBase.Opts.Root)
	if err != nil {
		res.Message = fmt.Sprintf(`%s: %s`, logp, err)
		return nil, res
	}

	var execRes = newExecResponse(req)

	// Encode to JSON first to minimize data race.

	res.Code = http.StatusOK
	res.Data = execRes

	resb, err = json.Marshal(res)
	if err != nil {
		res.Message = fmt.Sprintf(`%s: %s`, logp, err)
		return nil, res
	}

	httpd.idExecRes[execRes.ID] = execRes

	go func() {
		if req.Mode == CommandModeLocal {
			err = httpd.aww.Local(req)
		} else {
			err = httpd.aww.Play(req)
		}
		execRes.end(err)
	}()

	return resb, nil
}

// ExecuteTail fetch the latest output of execution using Server-sent
// events.
//
// Request format,
//
//	GET /awwan/api/execute/tail?id=string
//	Accept: text/event-stream
//
// The "id" query string define the execution ID.
//
// Response format,
//
//	200 OK HTTP/1.1
//	Content-Type: text/event-stream
//
//	event: begin
//	data: <time.RFC3339>
//
//	data: ...
//
//	event: end
//	data: <time.RFC3339>
//
// In case the ID is not found, the first event is "error" with the error
// message in data field.
//
//	event: error
//	data: invalid or empty ID ${id}
func (httpd *httpServer) ExecuteTail(sseconn *libhttp.SSEConn) {
	var (
		execID  = sseconn.HttpRequest.Form.Get(paramNameID)
		execRes = httpd.idExecRes[execID]
	)
	if execRes == nil {
		sseconn.WriteEvent(``, `ERROR: invalid or empty ID `+execID, nil)
		return
	}

	var (
		lastEventIDStr = sseconn.HttpRequest.Header.Get(libhttp.HeaderLastEventID)
		lastEventID    int64
	)

	if len(lastEventIDStr) != 0 {
		lastEventID, _ = strconv.ParseInt(lastEventIDStr, 10, 64)
	}
	if lastEventID == 0 {
		sseconn.WriteEvent(`begin`, execRes.BeginAt, nil)
	}

	execRes.mtxOutput.Lock()
	if lastEventID < int64(len(execRes.Output)) {
		// Send out the existing output based on request
		// Last-Event-ID ...
		var (
			idx   int
			out   string
			idstr string
		)
		for idx, out = range execRes.Output[int(lastEventID):] {
			idstr = strconv.FormatInt(int64(idx), 10)
			sseconn.WriteEvent(``, out, &idstr)
		}
		lastEventID = int64(idx)
	}
	execRes.mtxOutput.Unlock()

	if len(execRes.EndAt) != 0 {
		// The execution has been completed.
		sseconn.WriteEvent(`end`, execRes.EndAt, nil)
		return
	}

	// And wait for the rest...

	var (
		ok = true

		ev   sseclient.Event
		evid int64
	)
	for {
		ev, ok = <-execRes.eventq
		if !ok {
			// Channel has been closed.
			break
		}
		if len(ev.ID) == 0 {
			sseconn.WriteEvent(ev.Type, ev.Data, nil)
			continue
		}

		// Skip event where ID is less than last ID from output.
		evid = ev.IDInt()
		if evid <= lastEventID {
			continue
		}
		sseconn.WriteEvent(ev.Type, ev.Data, &ev.ID)
	}
}
