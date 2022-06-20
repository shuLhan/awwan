// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

// HttpResponse contains the output of command execution.
type HttpResponse struct {
	*Request
	Stdout []byte `json:"stdout"`
	Stderr []byte `json:"stderr"`
}
