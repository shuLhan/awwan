// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package awwan

//
// HttpResponse contains the output of command execution.
//
type HttpResponse struct {
	*Request
	Stdout []byte `json:"stdout"`
	Stderr []byte `json:"stderr"`
}
