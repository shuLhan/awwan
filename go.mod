// SPDX-FileCopyrightText: 2019 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

module git.sr.ht/~shulhan/awwan

go 1.20

require (
	git.sr.ht/~shulhan/ciigo v0.11.0
	github.com/evanw/esbuild v0.19.8
	github.com/shuLhan/share v0.51.1-0.20231218171101-a0c7d844b773
)

require (
	git.sr.ht/~shulhan/asciidoctor-go v0.5.1 // indirect
	github.com/yuin/goldmark v1.6.0 // indirect
	github.com/yuin/goldmark-meta v1.1.0 // indirect
	golang.org/x/crypto v0.16.0 // indirect
	golang.org/x/net v0.19.0 // indirect
	golang.org/x/sys v0.15.0 // indirect
	golang.org/x/term v0.15.0 // indirect
	gopkg.in/yaml.v2 v2.4.0 // indirect
)

replace github.com/evanw/esbuild => github.com/shuLhan/esbuild v0.19.9-0.20231209212032-2dc984ffc5f1

//replace github.com/shuLhan/share => ../share

//replace git.sr.ht/~shulhan/ciigo => ../ciigo
