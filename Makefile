## SPDX-FileCopyrightText: 2019 M. Shulhan <ms@kilabit.info>
## SPDX-License-Identifier: GPL-3.0-or-later

LD_FLAGS=-s -w
VERSION=$(shell git describe --long | sed 's/\([^-]*-g\)/r\1/;s/-/./g')

.PHONY: all
all: test lint

.PHONY: test
test:
	go test -cover ./... -test.gocoverdir=_coverage
	go tool covdata textfmt -i=_coverage -o cover.txt
	go tool cover -html=cover.txt -o cover.html

.PHONY: lint
lint:
	-go vet ./...
	-fieldalignment ./...
	-shadow ./...
	-revive ./...

## embed convert the TypeScript files into JavaScript and embed all _wui
## assets into memfs for web-user interface.
.PHONY: embed
embed:
	go run ./internal/cmd/awwan-internal build

.PHONY: build
build: embed
	go build ./cmd/awwan

.PHONY: install
install: lint-www lint embed
	go install ./cmd/awwan

.PHONY: dev
dev:
	go run ./cmd/awwan -dev -address 127.0.0.1:17500 serve _example

#{{{ Task to lint the TypeScript files.

.PHONY: lint-www
lint-www:
	-cd _wui && eslint --fix .

#}}}
#{{{ Testing with container using mkosi.

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

.PHONY: test-all-mkosi
test-all-mkosi:
	rm -f _coverage/*
	go test -cover ./... -test.gocoverdir=_coverage
	machinectl shell awwan@awwan-test \
		/bin/sh -c "cd src; \
		go test -cover -tags=integration ./... -test.gocoverdir=_coverage"
	go tool covdata textfmt -i=_coverage -o cover.txt
	go tool cover -html=cover.txt -o cover.html
	go tool covdata percent -i=_coverage

## The following tasks must be executed inside the container.

.PHONY: test-integration
test-integration:
	go test -cover -tags=integration ./... -test.gocoverdir=_coverage
	go tool covdata textfmt -i=_coverage -o cover.txt
	go tool cover -html=cover.txt -o cover.html

.PHONY: test-all
test-all:
	rm -f _coverage/*
	go test -cover ./... -test.gocoverdir=_coverage
	go test -cover -tags=integration ./... -test.gocoverdir=_coverage
	go tool covdata textfmt -i=_coverage -o cover.txt
	go tool cover -html=cover.txt -o cover.html
	go tool covdata percent -i=_coverage

#}}}
#{{{ Tasks to test or deploy awwan.org website.

.PHONY: build-www
build-www: embed
	go build ./internal/cmd/www-awwan/

.PHONY: serve-www
serve-www:
	go run ./internal/cmd/www-awwan -dev

.PHONY: install-www
install-www: build-www
	mkdir -p /data/app/bin/
	rsync --progress ./www-awwan /data/app/bin/

.PHONY: deploy-www
deploy-www: GOOS=linux GOARCH=amd64 CGO_ENABLED=0
deploy-www: build-www
	rsync --progress ./www-awwan awwan.org:/data/app/bin/

#}}}
#{{{ Task to build and upload binaries.
## Currently, only support amd64 architecture on non-mobile OS.

.PHONY: build-all-amd64
build-all-amd64: GOARCH=amd64
build-all-amd64: LD_FLAGS+=-X 'git.sr.ht/~shulhan/awwan.Version=$(VERSION)'
build-all-amd64:
	for os in "darwin" "dragonfly" "freebsd" "linux" "netbsd" "openbsd" "plan9" "solaris" "windows"; do \
		echo ">>> Building for $$os/$(GOARCH)";\
		GOOS=$$os go build \
			-o _bin/dl/awwan-$$os-$(GOARCH) \
			-trimpath \
			-ldflags="$(LD_FLAGS)" \
			./cmd/awwan/;\
	done

.PHONY: build-all-arm64
build-all-arm64: GOARCH=arm64
build-all-arm64: LD_FLAGS+=-X 'git.sr.ht/~shulhan/awwan.Version=$(VERSION)'
build-all-arm64:
	for os in "darwin" "freebsd" "linux" "netbsd" "openbsd" "windows"; do \
		echo ">>> Building for $$os/$(GOARCH)";\
		GOOS=$$os go build \
			-o _bin/dl/awwan-$$os-$(GOARCH) \
			-trimpath \
			-ldflags="$(LD_FLAGS)" \
			./cmd/awwan/;\
	done

.PHONY: release-sync
release-sync:
	rsync -av --progress ./_bin/dl/ awwan.org:/srv/awwan/dl/

.PHONY: release-tip
release-tip: embed build-all-amd64 build-all-arm64 release-sync

#}}}
