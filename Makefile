## Copyright 2019, Shulhan <ms@kilabit.info>. All rights reserved.
## Use of this source code is governed by a BSD-style
## license that can be found in the LICENSE file.

RELEASE_BINARIES=\
	_bin/awwan-linux-amd64 \
	_bin/awwan-darwin-amd64

.PHONY: all install embed test serve-doc dev-serve release

all: embed test lint
	go build ./cmd/awwan

install: embed
	go install ./cmd/awwan

embed:
	go run ./internal/cmd/memfs_www

test:
	go tool cover -html=cover.out -o cover.html
	go test -race -coverprofile=cover.out ./...

lint:
	golangci-lint run ./...

serve-doc:
	ciigo serve .

dev-serve:
	AWWAN_DEVELOPMENT=1 go run ./cmd/awwan serve _example

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
