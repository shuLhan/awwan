// Copyright 2019, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package awwan

import (
	"fmt"
)

func Examplescript_join() {
	envContent := `
[section]
key=value
`

	scriptContent := `
multiline\
command {{.Val "section::key"}};\
end;
`
	env := &Environment{}
	env.parseEnvironment([]byte(envContent))

	s := parseScript(env, []byte(scriptContent))

	for _, stmt := range s.Statements {
		fmt.Printf("%s\n", stmt)
	}
	// Output:
	//
	// multiline command value; end;
	//
	//
}
