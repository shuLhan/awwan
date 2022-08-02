## SPDX-FileCopyrightText: 2019 M. Shulhan <ms@kilabit.info>
## SPDX-License-Identifier: GPL-3.0-or-later

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
	CGO_ENABLED=1 go test -race -coverprofile=cover.out ./...
	go tool cover -html=cover.out -o cover.html

lint:
	-golangci-lint run ./...

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
