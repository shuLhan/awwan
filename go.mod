// SPDX-FileCopyrightText: 2019 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

module git.sr.ht/~shulhan/awwan

go 1.18

require (
	git.sr.ht/~shulhan/ciigo v0.9.3
	github.com/evanw/esbuild v0.17.10
	github.com/shuLhan/share v0.44.0
)

require (
	git.sr.ht/~shulhan/asciidoctor-go v0.4.1 // indirect
	golang.org/x/crypto v0.6.0 // indirect
	golang.org/x/net v0.7.0 // indirect
	golang.org/x/sys v0.5.0 // indirect
	golang.org/x/term v0.5.0 // indirect
)

//replace github.com/shuLhan/share => ../share

//replace git.sr.ht/~shulhan/ciigo => ../ciigo
