// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"io"
	"os"
)

// Request for executing local or remote script.
// Each request define the Mode of execution, Script file to be executed,
// and the lineRange -- list of line numbers to be executed.
type Request struct {
	// Each request may set the Writer where the command read input from
	// or output and error will be written.
	// If its nil, it will default to os.DevNull (default os
	// [exec/Cmd]), os.Stdout, and os.Stderr, respectively.
	stdin  io.Reader
	stdout io.Writer
	stderr io.Writer

	scriptPath string // The actual or cleaned up path of the Script.
	script     *Script

	Mode      string `json:"mode"`
	Script    string `json:"script"`
	LineRange string `json:"line_range"`
	Content   []byte `json:"content"`

	lineRange lineRange
}

// NewRequest create new Request and initialize stdout and stderr to os.Stdout
// and os.Stderr.
func NewRequest(mode, script, lineRange string) (req *Request) {
	req = &Request{
		stdout: os.Stdout,
		stderr: os.Stderr,

		Mode:      mode,
		Script:    script,
		LineRange: lineRange,
	}

	req.lineRange = parseLineRange(lineRange)

	return req
}
