// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/shuLhan/share/lib/mlog"
)

// defLogTimeFormat define the default log time format.
// This is set as variable to make it easy overwriting it in testing.
var defLogTimeFormat = time.RFC3339

// ExecRequest request for executing local or remote script.
// Each request define the Mode of execution, Script file to be executed,
// and the lineRange -- list of line numbers to be executed.
type ExecRequest struct {
	// Each request may set the Reader where the command read the input.
	// The stdin will default to os.DevNull (default of [exec/Cmd]) if
	// its nil.
	stdin io.Reader

	mlog *mlog.MultiLogger

	// flog the log file where all input and output will be
	// recorded.
	flog *os.File

	scriptPath string // The actual or cleaned up path of the Script.
	script     *Script

	Mode      string `json:"mode"`
	Script    string `json:"script"`
	LineRange string `json:"line_range"`
	Content   []byte `json:"content"`

	lineRange lineRange
}

// NewExecRequest create and initialize stdout and stderr to os.Stdout and
// os.Stderr.
func NewExecRequest(mode, script, lineRange string) (req *ExecRequest, err error) {
	req = &ExecRequest{
		Mode:      mode,
		Script:    script,
		LineRange: lineRange,
	}

	req.lineRange = parseLineRange(lineRange)

	err = req.init(`.`)
	if err != nil {
		return nil, fmt.Errorf(`NewRequest: %w`, err)
	}

	return req, nil
}

// close flush and release all resources.
func (req *ExecRequest) close() {
	req.mlog.Flush()

	var err = req.flog.Sync()
	if err != nil {
		mlog.Errf(`%s`, err)
	}

	err = req.flog.Close()
	if err != nil {
		mlog.Errf(`%s`, err)
	}
}

// init initialize multi loggers to write all output.
func (req *ExecRequest) init(workDir string) (err error) {
	if req.mlog == nil {
		var (
			namedStdout = mlog.NewNamedWriter(`stdout`, os.Stdout)
			namedStderr = mlog.NewNamedWriter(`stderr`, os.Stderr)
		)

		req.mlog = mlog.NewMultiLogger(defLogTimeFormat, filepath.Base(req.Script),
			[]mlog.NamedWriter{namedStdout},
			[]mlog.NamedWriter{namedStderr},
		)
	}

	req.scriptPath = filepath.Join(workDir, req.Script)
	req.scriptPath = filepath.Clean(req.scriptPath)
	req.scriptPath, err = filepath.Abs(req.scriptPath)
	if err != nil {
		return err
	}

	req.lineRange = parseLineRange(req.LineRange)

	// Create log file to record all input and output for audit in the
	// future.
	var fileLog = req.scriptPath + `.log`

	req.flog, err = os.OpenFile(fileLog, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0600)
	if err != nil {
		return err
	}

	req.registerLogWriter(`file`, req.flog)

	return nil
}

// registerLogWriter register a writer w to mlog output and error.
func (req *ExecRequest) registerLogWriter(name string, w io.Writer) {
	var namedw = mlog.NewNamedWriter(name, w)
	req.mlog.RegisterErrorWriter(namedw)
	req.mlog.RegisterOutputWriter(namedw)
}
