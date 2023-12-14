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
	go build -o _bin/awwan ./cmd/awwan

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
#{{{ Unit and integration tests using container. Linux only.

.PHONY: build-awwan-test
build-awwan-test:
	@echo ">>> Stopping container ..."
	-sudo machinectl stop awwan-test

	@echo ">>> Creating binding ..."
	mkdir -p /data/awwan/
	ln -sTf $$(pwd) /data/awwan/src
	ln -sTf $(shell go env GOCACHE) /data/awwan/gocache
	ln -sTf $(shell go env GOMODCACHE) /data/awwan/gomodcache

	@echo ">>> Building container awwan-test ..."
	sudo mkosi --directory=_ops/awwan-test/ --force build

	sudo machinectl --force import-tar /data/awwan/awwan-test.tar
	sudo machinectl start awwan-test

	## Once the container is imported, we can enable and run them any
	## time without rebuilding again.

.PHONY: test-integration
test-integration:
	go test -tags=integration -c .
	machinectl shell awwan@awwan-test \
		/bin/sh -c "cd src; ./awwan.test -test.v"

.PHONY: test-all
test-all:
	rm -f _coverage/*
	go test -cover ./... -test.gocoverdir=_coverage
	machinectl shell awwan@awwan-test \
		/bin/sh -c "cd src; \
		go test -cover -tags=integration ./... -test.gocoverdir=_coverage"
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
install-www: embed
	go install ./internal/cmd/www-awwan

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


## Task to release binaries automatically using karajo at
## build.kilabit.info.

.PHONY: release-sync
release-sync:
	sudo chown -R ms:karajo /srv/awwan/
	sudo chmod -R g+w /srv/awwan/
	rsync -rtvO --progress ./_bin/dl/ /srv/awwan/dl/

.PHONY: release-tip
release-tip: embed build-all-amd64 build-all-arm64 release-sync


## Task to release binaries manually from local.

.PHONY: release-sync-local
release-sync-local:
	rsync -av --progress ./_bin/dl/ awwan.org:/srv/awwan/dl/

.PHONY: release-tip-local
release-tip-local: embed build-all-amd64 build-all-arm64 release-sync-local

#}}}
#{{{ Tasks for play.awwan.org.

## Build the play.awwan.org container in local.

.PHONY: build-awwan-play
build-awwan-play:
	@echo ">>> Stopping container ..."
	-sudo machinectl stop awwan-play

	@echo ">>> Creating binding ..."
	## We need to bind src/_bin and src/_play into container.
	mkdir -p /data/awwan/
	ln -sTf $$(pwd) /data/awwan/src

	@echo ">>> Building container ..."
	sudo mkosi --directory=_ops/awwan-play --force build

	sudo machinectl --force import-tar /data/awwan/awwan-play.tar
	sudo machinectl start awwan-play

#}}}
