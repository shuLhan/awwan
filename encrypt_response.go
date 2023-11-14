// SPDX-FileCopyrightText: 2023 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

// encryptResponse define the response for HTTP Encrypt request.
type encryptResponse struct {
	Path      string `json:"path"`
	PathVault string `json:"path_vault"`
}
