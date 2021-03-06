## Copyright 2019, Shulhan <ms@kilabit.info>. All rights reserved.
## Use of this source code is governed by a BSD-style
## license that can be found in the LICENSE file.

RELEASE_BINARIES=\
	_bin/awwan-linux-amd64 \
	_bin/awwan-darwin-amd64

.PHONY: all test serve-doc release

all: test lint
	go build ./cmd/awwan

test:
	go test -race ./...

lint:
	golangci-lint run ./...

serve-doc:
	ciigo serve .

##
## Build for releases
##

_bin/awwan-linux-amd64:
	CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 \
		go build -o $@ ./cmd/awwan

_bin/awwan-darwin-amd64:
	CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 \
		go build -o $@ ./cmd/awwan

release: $(RELEASE_BINARIES)
