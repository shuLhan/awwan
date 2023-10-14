// SPDX-FileCopyrightText: 2023 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

//go:build integration

package awwan

import (
	"bytes"
	"io"
)

// mockStdin mock OS stdin for reading sudo password.
type mockStdin struct {
	buf bytes.Buffer
}

func (in *mockStdin) Read(pass []byte) (n int, err error) {
	var b = make([]byte, 1)
	for n < len(pass) {
		_, err = in.buf.Read(b)
		if err != nil {
			return n, err
		}
		if b[0] == '\n' {
			err = io.EOF
			break
		}
		pass[n] = b[0]
		n++
	}
	return n, err
}
