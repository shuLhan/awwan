// SPDX-FileCopyrightText: 2019 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

module git.sr.ht/~shulhan/awwan

go 1.17

require (
	git.sr.ht/~shulhan/ciigo v0.8.3-0.20220801140631-83d3304dcd90
	github.com/evanw/esbuild v0.14.51
	github.com/shuLhan/share v0.39.1-0.20220727165125-3f026ebd9fa9
)

require (
	git.sr.ht/~shulhan/asciidoctor-go v0.3.0 // indirect
	golang.org/x/crypto v0.0.0-20220622213112-05595931fe9d // indirect
	golang.org/x/net v0.0.0-20220708220712-1185a9018129 // indirect
	golang.org/x/sys v0.0.0-20220715151400-c0bba94af5f8 // indirect
	golang.org/x/term v0.0.0-20220526004731-065cf7ba2467 // indirect
)

//replace github.com/shuLhan/share => ../share

//replace git.sr.ht/~shulhan/ciigo => ../ciigo
