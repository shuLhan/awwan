## Copyright 2019, Shulhan <ms@kilabit.info>. All rights reserved.
## Use of this source code is governed by a BSD-style
## license that can be found in the LICENSE file.

RELEASE_BINARIES=\
	_bin/awwan-linux-amd64 \
	_bin/awwan-darwin-amd64

.PHONY: all release

all: test serve-doc

test:
	go test ./...

serve-doc:
	ciigo -template _docs/html.tmpl serve .

##
## Build for release
##

_bin/awwan-linux-amd64:
	CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 \
		go build -o $@ ./cmd/awwan

_bin/awwan-darwin-amd64:
	CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 \
		go build -o $@ ./cmd/awwan

release: $(RELEASE_BINARIES)
