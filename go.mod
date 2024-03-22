// SPDX-FileCopyrightText: 2019 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

module git.sr.ht/~shulhan/awwan

go 1.21

require (
	git.sr.ht/~shulhan/ciigo v0.11.1-0.20240321082653-aed750e52cec
	git.sr.ht/~shulhan/pakakeh.go v0.53.2-0.20240321104707-cee16b8ead85
	github.com/evanw/esbuild v0.19.8
)

require (
	git.sr.ht/~shulhan/asciidoctor-go v0.5.2-0.20240305110034-dc67158aeeb6 // indirect
	github.com/yuin/goldmark v1.7.0 // indirect
	github.com/yuin/goldmark-meta v1.1.0 // indirect
	golang.org/x/crypto v0.21.0 // indirect
	golang.org/x/net v0.22.0 // indirect
	golang.org/x/sys v0.18.0 // indirect
	golang.org/x/term v0.18.0 // indirect
	gopkg.in/yaml.v2 v2.4.0 // indirect
)

replace github.com/evanw/esbuild => github.com/shuLhan/esbuild v0.19.9-0.20231209212032-2dc984ffc5f1

replace golang.org/x/crypto => git.sr.ht/~shulhan/go-x-crypto v0.21.1-0.20240316083930-db093b454c7e

//replace github.com/shuLhan/share => ../share

//replace git.sr.ht/~shulhan/ciigo => ../ciigo
