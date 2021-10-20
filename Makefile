## Copyright 2019, Shulhan <ms@kilabit.info>. All rights reserved.
## Use of this source code is governed by a BSD-style
## license that can be found in the LICENSE file.

RELEASE_BINARIES=\
	_bin/awwan-linux-amd64 \
	_bin/awwan-darwin-amd64

AWWAN_WORKSPACE ?= _example

.PHONY: build install embed test serve-doc dev release

build: test lint
	go run ./cmd/awwan build
	go build ./cmd/awwan

install: build
	go install ./cmd/awwan

test:
	go tool cover -html=cover.out -o cover.html
	go test -race -coverprofile=cover.out ./...

lint:
	golangci-lint run ./...

serve-doc:
	ciigo serve _www/

dev:
	AWWAN_DEVELOPMENT=1 go run ./cmd/awwan serve $(AWWAN_WORKSPACE)

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
