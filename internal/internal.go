// SPDX-FileCopyrightText: 2023 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

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
	esapi "github.com/evanw/esbuild/pkg/api"
	"github.com/shuLhan/share/lib/memfs"
	"github.com/shuLhan/share/lib/mlog"
)

// MemfsWui contains the embedded files under _wui for web-user interface.
// This variable will initialize by initMemfsWui.
var MemfsWui *memfs.MemFS

// Build compile all TypeScript files inside _wui into JavaScript and embed
// them into memfs_wui.go.
func Build() (err error) {
	var (
		logp = `Build`

		esctx esapi.BuildContext
	)

	esctx, err = newEsbuild()
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}

	defer esctx.Dispose()

	err = buildTypeScript(esctx)
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}

	err = convertMarkup()
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}

	err = initMemfsWui()
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}

	err = goEmbed()
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}
	return nil
}

// Watch any update on the .js/.html/.ts files inside the _wui directory.
// If the .ts files changes it will execute TypeScript compiler, esbuild, to
// compile the .ts into .js.
// If the .js or .html files changes it will update the node content and
// re-generate the Go embed file memfs_wui.go.
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

	ciigoConv, err = ciigo.NewConverter(`_wui/doc/template.gohtml`)
	if err != nil {
		log.Fatalf(`%s: %s`, logp, err)
	}

	var esctx esapi.BuildContext

	esctx, err = newEsbuild()
	if err != nil {
		log.Fatalf(`%s: %s`, logp, err)
	}

	defer esctx.Dispose()

	if MemfsWui == nil {
		err = initMemfsWui()
		if err != nil {
			log.Fatalf(`%s: %s`, logp, err)
		}
	}

	var dw = &memfs.DirWatcher{
		Options: memfs.Options{
			Root: `_wui`,
			Includes: []string{
				`.*\.(adoc|html|js|json|md|ts)$`,
			},
		},
	}

	err = dw.Start()
	if err != nil {
		log.Fatalf(`%s: %s`, logp, err)
	}

	var (
		buildTicker = time.NewTicker(500 * time.Millisecond)

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
				tsCount++

			case strings.HasSuffix(ns.Node.SysPath, `.js`) || strings.HasSuffix(ns.Node.SysPath, `.html`):
				embedCount++
			}

		case <-buildTicker.C:
			if tsCount > 0 {
				err = buildTypeScript(esctx)
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

func buildTypeScript(esctx esapi.BuildContext) (err error) {
	var logp = `buildTypeScript`

	var buildResult = esctx.Rebuild()
	if len(buildResult.Errors) == 0 {
		return nil
	}

	var (
		msg esapi.Message
		x   int
	)
	for x, msg = range buildResult.Errors {
		mlog.Errf(`!!! %s: error #%d: %v`, logp, x, msg)
	}
	return fmt.Errorf(`%s: %v`, logp, buildResult.Errors[0])
}

// convertMarkup convert all markup files inside _wui/doc directory to HTML.
func convertMarkup() (err error) {
	var opts = &ciigo.ConvertOptions{
		Root:         `_wui/doc`,
		HtmlTemplate: `_wui/doc/template.gohtml`,
	}

	err = ciigo.Convert(opts)
	return err
}

func goEmbed() (err error) {
	err = MemfsWui.GoEmbed()
	if err != nil {
		return fmt.Errorf(`goEmbed: %w`, err)
	}
	return nil
}

func initMemfsWui() (err error) {
	var mfsOpts = &memfs.Options{
		Root: `_wui`,
		Includes: []string{
			`.*\.(css|js|html|jpg|png|ico)$`,
		},
		Excludes: []string{
			`.*\.adoc$`,
			`/\.eslintrc.yaml`,
			`/\.gitignore`,
			`/node_modules`,
			`/tsconfig.json$`,
			`/wui`,
		},
		Embed: memfs.EmbedOptions{
			CommentHeader: "// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>\n" +
				"// SPDX-License-Identifier: GPL-3.0-or-later\n",
			PackageName: `internal`,
			VarName:     `MemfsWui`,
			GoFileName:  `internal/memfs_wui.go`,
		},
	}

	MemfsWui, err = memfs.New(mfsOpts)
	if err != nil {
		return fmt.Errorf(`initMemfsWui: %w`, err)
	}
	return nil
}

// newEsbuild create new [esapi.BuildContext] for transpiling TypeScript with
// esbuild.
func newEsbuild() (esctx api.BuildContext, err error) {
	var (
		esBuildOptions = esapi.BuildOptions{
			EntryPoints: []string{`_wui/main.ts`},
			Platform:    esapi.PlatformBrowser,
			Outfile:     `_wui/main.js`,
			GlobalName:  `awwan`,
			Bundle:      true,
			Write:       true,
		}

		errctx *esapi.ContextError
	)

	esctx, errctx = esapi.Context(esBuildOptions)
	if errctx != nil {
		return nil, fmt.Errorf(`newEsbuild: %w`, errctx)
	}

	return esctx, nil
}
