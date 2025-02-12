// SPDX-FileCopyrightText: 2023 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

// Package internal provide internal types and functions for building and
// developing awwan, not consumed by user nor the main program.
package internal

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"git.sr.ht/~shulhan/ciigo"
	"git.sr.ht/~shulhan/pakakeh.go/lib/memfs"
	"git.sr.ht/~shulhan/pakakeh.go/lib/mlog"
	"git.sr.ht/~shulhan/pakakeh.go/lib/watchfs/v2"
	"github.com/evanw/esbuild/pkg/api"
	esapi "github.com/evanw/esbuild/pkg/api"
)

// MemfsWui contains the embedded files under _wui for web-user interface.
// This variable will initialize by initMemfsWui.
var MemfsWui *memfs.MemFS

// DocConvertOpts ciigo options for converting markup files.
var DocConvertOpts = ciigo.ConvertOptions{
	Root:         `_wui/doc`,
	HTMLTemplate: `_wui/doc/template.gohtml`,
}

// docEmbedOpts options for embedding files in "_www/doc" into Go code.
var docEmbedOpts = ciigo.EmbedOptions{
	ConvertOptions: DocConvertOpts,
	EmbedOptions: memfs.EmbedOptions{
		PackageName: `main`,
		VarName:     `MemfsWww`,
		GoFileName:  `internal/cmd/www-awwan/memfs.go`,
	},
}

// Build compile all TypeScript files inside _wui into JavaScript, and all
// markup files into HTML, and then embed them into "memfs_wui.go" and
// "memfs_www.go".
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

	err = ciigo.Convert(DocConvertOpts)
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}

	err = initMemfsWui()
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}

	err = MemfsWui.Remount()
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

	err = ciigo.Convert(DocConvertOpts)
	if err != nil {
		mlog.Fatalf(`%s: %s`, logp, err)
	}

	ciigoConv, err = ciigo.NewConverter(DocConvertOpts.HTMLTemplate)
	if err != nil {
		mlog.Fatalf(`%s: %s`, logp, err)
	}

	var esctx esapi.BuildContext

	esctx, err = newEsbuild()
	if err != nil {
		mlog.Fatalf(`%s: %s`, logp, err)
	}

	defer esctx.Dispose()

	if MemfsWui == nil {
		err = initMemfsWui()
		if err != nil {
			mlog.Fatalf(`%s: %s`, logp, err)
		}
	}

	var dwOpts = watchfs.DirWatcherOptions{
		Root: MemfsWui.Opts.Root,
		Includes: []string{
			`.*\.(adoc|html|js|md|ts)$`,
		},
		Excludes: []string{
			`node_modules`,
		},
		FileWatcherOptions: watchfs.FileWatcherOptions{
			File:     filepath.Join(MemfsWui.Opts.Root, `.rescan`),
			Interval: 200 * time.Millisecond,
		},
	}
	var dw *watchfs.DirWatcher

	dw, err = watchfs.WatchDir(dwOpts)
	if err != nil {
		mlog.Fatalf(`%s: %w`, logp, err)
	}

	defer dw.Stop()

	var (
		buildTicker = time.NewTicker(200 * time.Millisecond)

		node       *memfs.Node
		fmarkup    *ciigo.FileMarkup
		listfi     []os.FileInfo
		tsCount    int
		embedCount int
	)

	for {
		select {
		case listfi = <-dw.C:
			for _, fi := range listfi {
				var name = fi.Name()
				mlog.Outf(`%s: update on %q`, logp, name)

				switch {
				case strings.HasSuffix(name, `.adoc`),
					strings.HasSuffix(name, `.md`):

					var pathMarkup = filepath.Join(MemfsWui.Opts.Root, name)
					fmarkup, err = ciigo.NewFileMarkup(pathMarkup, nil)
					if err != nil {
						mlog.Errf(`%s %q: %s`, logp, name, err)
						continue
					}

					err = ciigoConv.ToHTMLFile(fmarkup)
					if err != nil {
						mlog.Errf(`%s %q: %s`, logp, name, err)
						continue
					}

					embedCount++

				case strings.HasSuffix(name, `.ts`),
					strings.HasSuffix(name, `tsconfig.json`):

					tsCount++

				case strings.HasSuffix(name, `.css`),
					strings.HasSuffix(name, `.js`),
					strings.HasSuffix(name, `.html`):

					node, err = MemfsWui.Get(name)
					if err != nil {
						mlog.Errf(`%s %q: %s`, logp, name, err)
						continue
					}
					err = node.Update(node, 0)
					if err != nil {
						mlog.Errf(`%s %q: %s`, logp, name, err)
						continue
					}
					embedCount++

				case strings.HasSuffix(name, DocConvertOpts.HTMLTemplate):
					err = ciigo.Convert(DocConvertOpts)
					if err != nil {
						mlog.Errf(`%s: %s`, logp, err)
					}
					embedCount++
				}
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

func goEmbed() (err error) {
	var logp = `goEmbed`

	err = MemfsWui.GoEmbed()
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}

	err = ciigo.GoEmbed(docEmbedOpts)
	if err != nil {
		mlog.Fatalf(`%s: %s`, logp, err)
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
			`.*\.(adoc|json|yaml)$`,
			`.gitignore`,
			`_wui/node_modules`,
			`_wui/wui`,
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
