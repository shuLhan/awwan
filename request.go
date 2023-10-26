// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"io"
	"os"

	"github.com/shuLhan/share/lib/mlog"
)

// Request for executing local or remote script.
// Each request define the Mode of execution, Script file to be executed,
// and the lineRange -- list of line numbers to be executed.
type Request struct {
	// Each request may set the Reader where the command read the input.
	// The stdin will default to os.DevNull (default of [exec/Cmd]) if
	// its nil.
	stdin io.Reader

	mlog *mlog.MultiLogger

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
		Mode:      mode,
		Script:    script,
		LineRange: lineRange,
	}

	req.lineRange = parseLineRange(lineRange)
	req.init()

	return req
}

// init initialize all fields in Request.
func (req *Request) init() {
	if req.mlog == nil {
		var (
			namedStdout = mlog.NewNamedWriter(`stdout`, os.Stdout)
			namedStderr = mlog.NewNamedWriter(`stderr`, os.Stderr)
		)
		req.mlog = mlog.NewMultiLogger(``, ``,
			[]mlog.NamedWriter{namedStdout},
			[]mlog.NamedWriter{namedStderr},
		)
	}
}

// registerLogWriter register a writer w to mlog output and error.
func (req *Request) registerLogWriter(name string, w io.Writer) {
	var namedw = mlog.NewNamedWriter(name, w)
	req.mlog.RegisterErrorWriter(namedw)
	req.mlog.RegisterOutputWriter(namedw)
}
