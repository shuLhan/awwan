## SPDX-FileCopyrightText: 2019 M. Shulhan <ms@kilabit.info>
## SPDX-License-Identifier: GPL-3.0-or-later

AWWAN_WORKSPACE:=_example

.PHONY: all
all: test lint build

.PHONY: test
test:
	go test -coverprofile=cover.out ./...
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

.PHONY: setup-mkosi
setup-mkosi:
	@echo ">>> Creating symlinks to simplify binding ..."
	ln -sf $(shell go env GOCACHE) _mkosi/mkosi.cache/gocache
	ln -sf $(shell go env GOMODCACHE) _mkosi/mkosi.cache/gomodcache
	@echo ">>> Booting awwan-test container ..."
	sudo mkosi --directory=_mkosi/ boot

.PHONY: test-with-mkosi
test-with-mkosi:
	go test -tags=integration -c .
	machinectl shell awwan@awwan-test \
		/bin/sh -c "cd src; ./awwan.test -test.v"
