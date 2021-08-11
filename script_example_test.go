// Copyright 2019, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package awwan

import (
	"fmt"
	"log"
)

func ExampleParseScriptForLocal() {
	envContent := `
[section]
key=value
`

	scriptContent := `
multiline\
command {{.Val "section::key"}};\
end;
`
	ses := &Session{}
	err := ses.loadEnvFromBytes([]byte(envContent))
	if err != nil {
		log.Fatal(err)
	}

	s, err := ParseScriptForLocal(ses, []byte(scriptContent))
	if err != nil {
		log.Fatal(err)
	}

	for _, stmt := range s.rawLines {
		fmt.Printf("%s\n", stmt)
	}
	// Output:
	//
	// multiline command value; end;
	//
	//
}
