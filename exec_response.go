// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"bytes"
	"fmt"
	"time"
)

// ExecResponse contains the request and output of command execution, from
// ExecRequest.
type ExecResponse struct {
	// Copy of request.

	Mode      string `json:"mode"`
	Script    string `json:"script"`
	LineRange string `json:"line_range"`

	// ID of execution request that can be used to stream output or
	// got get full status.
	ID string `json:"id"`

	// BeginAt contains when the execution begin.
	BeginAt string `json:"begin_at"`

	// EndAt contains when the execution finished.
	EndAt string `json:"end_at"`

	Error string `json:"error"`

	Output []string `json:"output"`
}

func newExecResponse(req *ExecRequest) (execRes *ExecResponse) {
	var now = timeNow().UTC()

	execRes = &ExecResponse{
		Mode:      req.Mode,
		Script:    req.Script,
		LineRange: req.LineRange,

		ID:      fmt.Sprintf(`%s:%s:%s:%d`, req.Mode, req.Script, req.LineRange, now.Unix()),
		BeginAt: now.Format(time.RFC3339),

		Output: make([]string, 0, 8),
	}

	// Use the ExecResponse itself as handler for output.
	req.registerLogWriter(`response`, execRes)

	return execRes
}

// Write convert the raw output from execution into multiline string, and
// push it to field Output.
func (execres *ExecResponse) Write(out []byte) (n int, err error) {
	if len(out) == 0 {
		return 0, nil
	}

	var outlen = len(out)
	if out[outlen-1] == '\n' {
		out = out[:outlen-1]
		outlen--
	}

	var (
		lines = bytes.Split(out, []byte{'\n'})
		line  []byte
	)
	for _, line = range lines {
		execres.Output = append(execres.Output, string(line))
	}

	return outlen, nil
}

func (execres *ExecResponse) end(execErr error) {
	if execErr != nil {
		execres.Error = execErr.Error()
	}
	execres.EndAt = timeNow().UTC().Format(time.RFC3339)
}
