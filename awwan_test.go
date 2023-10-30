// SPDX-FileCopyrightText: 2023 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"os"
	"testing"
)

func TestMain(m *testing.M) {
	defLogTimeFormat = `-`

	os.Exit(m.Run())
}
