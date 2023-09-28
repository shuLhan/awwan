// SPDX-FileCopyrightText: 2023 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

type fsRequest struct {
	Path    string `json:"path"`
	Content []byte `json:"content"`
	IsDir   bool   `json:"is_dir"`
}
