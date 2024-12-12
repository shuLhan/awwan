// SPDX-FileCopyrightText: 2019 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

module git.sr.ht/~shulhan/awwan

go 1.22.0

require (
	git.sr.ht/~shulhan/ciigo v0.14.0
	git.sr.ht/~shulhan/pakakeh.go v0.58.2-0.20241212161141-3361472cc3d4
	github.com/evanw/esbuild v0.24.0
)

require (
	git.sr.ht/~shulhan/asciidoctor-go v0.6.1 // indirect
	github.com/yuin/goldmark v1.7.8 // indirect
	github.com/yuin/goldmark-meta v1.1.0 // indirect
	golang.org/x/crypto v0.31.0 // indirect
	golang.org/x/net v0.32.0 // indirect
	golang.org/x/sys v0.28.0 // indirect
	golang.org/x/term v0.27.0 // indirect
	gopkg.in/yaml.v2 v2.4.0 // indirect
)

//replace github.com/evanw/esbuild => github.com/shuLhan/esbuild v0.19.9-0.20231209212032-2dc984ffc5f1

//replace golang.org/x/crypto => git.sr.ht/~shulhan/go-x-crypto v0.31.1-0.20241211185416-2a1055da2107

//replace git.sr.ht/~shulhan/pakakeh.go => ../pakakeh.go

//replace git.sr.ht/~shulhan/ciigo => ../ciigo
