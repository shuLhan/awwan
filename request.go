// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package awwan

import (
	"io"
	"os"
)

//
// Request for executing local or remote script.
// Each request define the script file to be executed and the line number
// range in form of BeginAt and EndAt.
//
// Each request may set the Writer where the command output and error will be
// written.  If its nil, it will default to os.Stdout and os.Stderr.
//
type Request struct {
	Script  string `json:"script"`
	BeginAt int    `json:"begin_at"`
	EndAt   int    `json:"end_at"`

	stdout     io.Writer `json:"-"`
	stderr     io.Writer `json:"-"`
	scriptPath string    // The actual or cleaned up path of the Script.
	script     *Script
}

//
// NewRequest create new Request and initialize stdout and stderr to os.Stdout
// and os.Stderr.
//
func NewRequest() *Request {
	return &Request{
		stdout: os.Stdout,
		stderr: os.Stderr,
	}
}
