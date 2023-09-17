// Package internal provide internal types and functions for building and
// developing awwan, not consumed by user nor the main program.
package internal

import (
	"fmt"
	"log"
	"strings"
	"time"

	"git.sr.ht/~shulhan/ciigo"
	"github.com/evanw/esbuild/pkg/api"
	"github.com/shuLhan/share/lib/memfs"
	"github.com/shuLhan/share/lib/mlog"
)

// EnvDevelopment if its set, the "serve" command will run in development
// mode, watching any files changes under _www.
const EnvDevelopment = `AWWAN_DEVELOPMENT`

// MemfsWww The embedded _www for web-user interface.
// This variable will initialize by initMemfsWww.
var MemfsWww *memfs.MemFS

// Build compile all TypeScript files inside _www into JavaScript and embed
// them into memfs_www.go.
func Build() (err error) {
	var logp = `Build`

	err = buildTypeScript(nil)
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}

	err = convertMarkup()
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}

	err = initMemfsWww()
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}

	err = goEmbed()
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}
	return nil
}

// Watch any update on the .js/.html/.ts files inside the _www directory.
// If the .ts files changes it will execute TypeScript compiler, esbuild, to
// compile the .ts into .js.
// If the .js or .html files changes it will update the node content and
// re-generate the Go embed file memfs_www.go.
func Watch() {
	var (
		logp = `Watch`

		ciigoConv *ciigo.Converter
		err       error
	)

	err = convertMarkup()
	if err != nil {
		log.Fatalf(`%s: %s`, logp, err)
	}

	ciigoConv, err = ciigo.NewConverter(``)
	if err != nil {
		log.Fatalf(`%s: %s`, logp, err)
	}

	if MemfsWww == nil {
		err = initMemfsWww()
		if err != nil {
			log.Fatalf(`%s: %s`, logp, err)
		}
	}

	var watchOpts = memfs.WatchOptions{
		Watches: []string{
			`.*\.(adoc|md|ts)$`,
		},
	}

	var dw *memfs.DirWatcher

	dw, err = MemfsWww.Watch(watchOpts)
	if err != nil {
		log.Fatalf(`%s: %s`, logp, err)
	}

	var (
		buildTicker    = time.NewTicker(3 * time.Second)
		esBuildOptions = api.BuildOptions{
			EntryPoints: []string{`_www/main.ts`},
			Platform:    api.PlatformBrowser,
			Outfile:     `_www/main.js`,
			GlobalName:  `awwan`,
			Bundle:      true,
			Write:       true,
		}

		ns         memfs.NodeState
		tsCount    int
		embedCount int
	)
	for {
		select {
		case ns = <-dw.C:
			fmt.Printf("%s: update on %s\n", logp, ns.Node.SysPath)

			switch {
			case strings.HasSuffix(ns.Node.SysPath, `.adoc`),
				strings.HasSuffix(ns.Node.SysPath, `.md`):
				var fmarkup *ciigo.FileMarkup

				fmarkup, err = ciigo.NewFileMarkup(ns.Node.SysPath, nil)
				if err != nil {
					mlog.Errf(`%s: %s: %s`, logp, ns.Node.SysPath, err)
					continue
				}

				err = ciigoConv.ToHtmlFile(fmarkup)
				if err != nil {
					mlog.Errf(`%s: %s: %s`, logp, ns.Node.SysPath, err)
					continue
				}

				embedCount++

			case strings.HasSuffix(ns.Node.SysPath, `.ts`) || strings.HasSuffix(ns.Node.SysPath, `tsconfig.json`):
				mlog.Outf(`%s: update %s`, logp, ns.Node.SysPath)
				tsCount++

			case strings.HasSuffix(ns.Node.SysPath, `.js`) || strings.HasSuffix(ns.Node.SysPath, `.html`):
				embedCount++
			}

		case <-buildTicker.C:
			if tsCount > 0 {
				err = buildTypeScript(&esBuildOptions)
				if err != nil {
					mlog.Errf(`%s`, err)
				} else {
					tsCount = 0
					embedCount++
				}
			}
			if embedCount > 0 {
				err = goEmbed()
				if err != nil {
					mlog.Errf(`%s`, err)
				} else {
					embedCount = 0
				}
			}
		}
	}
}

func buildTypeScript(esBuildOptions *api.BuildOptions) (err error) {
	var logp = `buildTypeScript`

	if esBuildOptions == nil {
		esBuildOptions = &api.BuildOptions{
			EntryPoints: []string{`_www/main.ts`},
			Platform:    api.PlatformBrowser,
			Outfile:     `_www/main.js`,
			GlobalName:  `app`,
			Bundle:      true,
			Write:       true,
		}
	}

	var buildResult = api.Build(*esBuildOptions)
	if len(buildResult.Errors) == 0 {
		return nil
	}

	var (
		msg api.Message
		x   int
	)
	for x, msg = range buildResult.Errors {
		mlog.Errf(`!!! %s: error #%d: %v`, logp, x, msg)
	}
	return fmt.Errorf(`%s: %v`, logp, buildResult.Errors[0])
}

// convertMarkup convert all markup files inside _www/doc directory to HTML.
func convertMarkup() (err error) {
	var opts = &ciigo.ConvertOptions{
		Root: `_www/doc`,
	}

	err = ciigo.Convert(opts)
	return err
}

func goEmbed() (err error) {
	err = MemfsWww.GoEmbed()
	if err != nil {
		return fmt.Errorf(`goEmbed: %w`, err)
	}
	return nil
}

func initMemfsWww() (err error) {
	var mfsOpts = &memfs.Options{
		Root: `_www`,
		Includes: []string{
			`.*\.(js|html|png|ico)$`,
		},
		Excludes: []string{
			`/wui`,
			`/wui.bak`,
			`/wui.local`,
		},
		Embed: memfs.EmbedOptions{
			CommentHeader: "// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>\n" +
				"// SPDX-License-Identifier: GPL-3.0-or-later\n",
			PackageName: `internal`,
			VarName:     `MemfsWww`,
			GoFileName:  `internal/memfs_www.go`,
		},
	}

	MemfsWww, err = memfs.New(mfsOpts)
	if err != nil {
		return fmt.Errorf(`initMemfsWww: %w`, err)
	}
	return nil
}