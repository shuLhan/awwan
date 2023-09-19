// SPDX-FileCopyrightText: 2019 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

module git.sr.ht/~shulhan/awwan

go 1.20

require (
	git.sr.ht/~shulhan/ciigo v0.10.0
	github.com/evanw/esbuild v0.17.10
	github.com/shuLhan/share v0.49.2-0.20230919175205-3b7ac793264a
)

require (
	git.sr.ht/~shulhan/asciidoctor-go v0.4.1 // indirect
	github.com/yuin/goldmark v1.5.4 // indirect
	github.com/yuin/goldmark-meta v1.1.0 // indirect
	golang.org/x/crypto v0.13.0 // indirect
	golang.org/x/net v0.15.0 // indirect
	golang.org/x/sys v0.12.0 // indirect
	golang.org/x/term v0.12.0 // indirect
	gopkg.in/yaml.v2 v2.3.0 // indirect
)

//replace github.com/shuLhan/share => ../share

//replace git.sr.ht/~shulhan/ciigo => ../ciigo
