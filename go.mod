// SPDX-FileCopyrightText: 2019 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

module git.sr.ht/~shulhan/awwan

go 1.21

require (
	git.sr.ht/~shulhan/ciigo v0.13.2
	git.sr.ht/~shulhan/pakakeh.go v0.57.0
	github.com/evanw/esbuild v0.19.8
)

require (
	git.sr.ht/~shulhan/asciidoctor-go v0.6.0 // indirect
	github.com/yuin/goldmark v1.7.4 // indirect
	github.com/yuin/goldmark-meta v1.1.0 // indirect
	golang.org/x/crypto v0.27.0 // indirect
	golang.org/x/net v0.29.0 // indirect
	golang.org/x/sys v0.25.0 // indirect
	golang.org/x/term v0.24.0 // indirect
	gopkg.in/yaml.v2 v2.4.0 // indirect
)

replace github.com/evanw/esbuild => github.com/shuLhan/esbuild v0.19.9-0.20231209212032-2dc984ffc5f1

replace golang.org/x/crypto => git.sr.ht/~shulhan/go-x-crypto v0.21.1-0.20240316083930-db093b454c7e

//replace git.sr.ht/~shulhan/pakakeh.go => ../pakakeh.go

//replace git.sr.ht/~shulhan/ciigo => ../ciigo
