// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

// ExecResponse contains the request and output of command execution, from
// ExecRequest.
type ExecResponse struct {
	*ExecRequest
	Error  string `json:"error"`
	Output []byte `json:"output"`
}
