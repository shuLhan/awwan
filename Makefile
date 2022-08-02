## SPDX-FileCopyrightText: 2019 M. Shulhan <ms@kilabit.info>
## SPDX-License-Identifier: GPL-3.0-or-later

AWWAN_WORKSPACE:=_example

.PHONY: all build install test dev

all: test lint build

test:
	CGO_ENABLED=1 go test -race -coverprofile=cover.out ./...
	go tool cover -html=cover.out -o cover.html

lint:
	-golangci-lint run ./...

build:
	mkdir -p _bin
	go run ./cmd/awwan build
	go build -o _bin/ ./cmd/awwan

install: build
	go install ./cmd/awwan

dev:
	AWWAN_DEVELOPMENT=1 go run ./cmd/awwan serve $(AWWAN_WORKSPACE)
