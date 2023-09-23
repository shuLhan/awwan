// SPDX-FileCopyrightText: 2019 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"fmt"
	"log"
)

func ExampleParseScript() {
	var (
		envContent = `
[section]
key=value
`

		scriptContent = `
multiline\
command {{.Val "section::key"}};\
end;
`

		ses = &Session{}

		s    *Script
		err  error
		stmt []byte
	)

	err = ses.loadRawEnv([]byte(envContent))
	if err != nil {
		log.Fatal(err)
	}

	s, err = ParseScript(ses, []byte(scriptContent))
	if err != nil {
		log.Fatal(err)
	}

	for _, stmt = range s.rawLines {
		fmt.Printf("%s\n", stmt)
	}
	// Output:
	//
	// multiline command value; end;
	//
	//
}
