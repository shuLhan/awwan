## SPDX-FileCopyrightText: 2019 M. Shulhan <ms@kilabit.info>
## SPDX-License-Identifier: GPL-3.0-or-later

AWWAN_WORKSPACE:=_example
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

## embed convert the TypeScript files into JavaScript and embed all _www
## assets into memfs for web-user interface.
.PHONY: embed
embed:
	go run ./internal/cmd/awwan-internal build

.PHONY: build
build: embed
	go build ./cmd/awwan

.PHONY: install
install: lint-www embed
	go install ./cmd/awwan

.PHONY: dev
dev:
	go run ./cmd/awwan -dev serve $(AWWAN_WORKSPACE)

#{{{ Task to lint the TypeScript files.

.PHONY: lint-www
lint-www:
	cd _www && eslint --fix .

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

.PHONY: embed-www
embed-www:
	go run ./internal/cmd/www-awwan/ embed

.PHONY: build-www
build-www: embed-www
	go build ./internal/cmd/www-awwan/

serve-www:
	go run ./internal/cmd/www-awwan -dev

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
			-o _bin/awwan-$$os-$(GOARCH) \
			-trimpath \
			-ldflags="$(LD_FLAGS)" \
			./cmd/awwan/;\
	done

.PHONY: release-sync
release-sync:
	rclone sync --progress ./_bin info-kilabit:/pub/awwan

.PHONY: release-tip
release-tip: embed build-all-amd64 release-sync

#}}}
