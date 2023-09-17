## SPDX-FileCopyrightText: 2019 M. Shulhan <ms@kilabit.info>
## SPDX-License-Identifier: GPL-3.0-or-later

AWWAN_WORKSPACE:=_example

.PHONY: all
all: test lint build

.PHONY: test
test:
	CGO_ENABLED=1 go test -race -coverprofile=cover.out ./...
	go tool cover -html=cover.out -o cover.html

.PHONY: lint
lint:
	-go vet ./...
	-fieldalignment ./...
	-shadow ./...
	-revive ./...

.PHONY: build
build:
	mkdir -p _bin
	go run ./internal/cmd/awwan-internal build
	go build -o _bin/ ./cmd/awwan

.PHONY: install
install: build
	go install ./cmd/awwan

.PHONY: dev
dev:
	AWWAN_DEVELOPMENT=1 go run ./cmd/awwan serve $(AWWAN_WORKSPACE)
