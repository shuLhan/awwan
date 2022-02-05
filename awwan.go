// Copyright 2019, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package awwan

import (
	"bytes"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/shuLhan/share/lib/http"
	"github.com/shuLhan/share/lib/io"
	"github.com/shuLhan/share/lib/memfs"
	"github.com/shuLhan/share/lib/mlog"
	"github.com/shuLhan/share/lib/os/exec"
	"github.com/shuLhan/share/lib/ssh/config"
)

const (
	Version = "0.4.0"

	CommandModeBuild = "build"
	CommandModeLocal = "local"
	CommandModePlay  = "play"
	CommandModeServe = "serve"

	defCacheDir      = ".cache"
	defEnvFileName   = "awwan.env" // The default awwan environment file name.
	defListenAddress = "127.0.0.1:17600"
	defSshConfig     = "config" // The default SSH config file name.
	defSshDir        = ".ssh"   // The default SSH config directory name.
	defTmpDir        = "/tmp"

	cmdTsc         = "tsc -b _www"
	envDevelopment = "AWWAN_DEVELOPMENT"
)

var (
	cmdMagicGet     = []byte("#get:")
	cmdMagicPut     = []byte("#put:")
	cmdMagicSudoGet = []byte("#get!")
	cmdMagicSudoPut = []byte("#put!")
	cmdMagicRequire = []byte("#require:")
	newLine         = []byte("\n")

	// The embedded _www for web-user interface.
	// This variable will initialize by initMemfs.
	mfsWww           *memfs.MemFS
	embedPackageName = "awwan"
	embedVarName     = "mfsWww"
	embedFileName    = "memfs_www.go"
)

//
// Awwan is the service that run script in local or remote.
// Awwan contains cache of sessions and cache of environment files.
//
type Awwan struct {
	BaseDir string

	// All the Host values from SSH config files.
	sshConfig *config.Config

	httpd     *http.Server // The HTTP server.
	memfsBase *memfs.MemFS // The files caches.

	bufout bytes.Buffer
	buferr bytes.Buffer
}

//
// New create and initialize new Awwan service using baseDir as the root of
// Awwan workspace.
// If baseDir is empty, it will set to current working directory.
//
func New(baseDir string) (aww *Awwan, err error) {
	logp := "New"

	aww = &Awwan{}

	if len(baseDir) > 0 {
		baseDir, err = filepath.Abs(baseDir)
		if err != nil {
			return nil, fmt.Errorf("%s: %w", logp, err)
		}
	}

	aww.BaseDir, err = lookupBaseDir(baseDir)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	fmt.Printf("--- BaseDir: %s\n", aww.BaseDir)

	return aww, nil
}

// Build compile all TypeScript files inside _www into JavaScript and embed
// them into memfs_www.go.
func (aww *Awwan) Build() (err error) {
	logp := "Build"
	err = doRunTsc()
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	mfsWww, err = initMemfs()
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	err = doGoEmbed()
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}
	return nil
}

func (aww *Awwan) Local(req *Request) (err error) {
	logp := "Local"

	req.scriptPath = filepath.Clean(req.Script)
	req.scriptPath, err = filepath.Abs(req.scriptPath)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	sessionDir := filepath.Dir(req.scriptPath)

	ses, err := NewSession(aww.BaseDir, sessionDir)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	err = ses.loadEnvFromPaths()
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	if len(req.Content) == 0 {
		req.script, err = NewScriptForLocal(ses, req.scriptPath)
	} else {
		req.script, err = ParseScriptForLocal(ses, req.Content)
	}
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	maxLines := len(req.script.stmts)
	if req.BeginAt >= maxLines {
		return fmt.Errorf("%s: start index %d out of range %d", logp,
			req.BeginAt, maxLines)
	}
	if req.EndAt > maxLines {
		req.EndAt = maxLines - 1
	}

	// Create temporary directory.
	err = os.MkdirAll(ses.tmpDir, 0700)
	if err != nil {
		return fmt.Errorf("%s: %s: %w", logp, ses.tmpDir, err)
	}
	defer func() {
		err = os.RemoveAll(ses.tmpDir)
		if err != nil {
			log.Printf("%s: %s", logp, err)
		}
	}()

	err = ses.executeRequires(req)
	if err != nil {
		return fmt.Errorf("%s:%w", logp, err)
	}

	ses.executeScriptOnLocal(req)

	return nil
}

func (aww *Awwan) Play(req *Request) (err error) {
	logp := "Play"

	req.scriptPath = filepath.Clean(req.Script)
	req.scriptPath, err = filepath.Abs(req.scriptPath)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	sessionDir := filepath.Dir(req.scriptPath)

	ses, err := NewSession(aww.BaseDir, sessionDir)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	err = ses.loadEnvFromPaths()
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	if aww.sshConfig == nil {
		err = aww.loadSshConfig()
		if err != nil {
			return fmt.Errorf("%s: %w", logp, err)
		}
	}

	sshSection := aww.sshConfig.Get(ses.hostname)
	if sshSection == nil {
		return fmt.Errorf("%s: can not find Host %q in SSH config", logp, ses.hostname)
	}

	err = ses.initSSHClient(req, sshSection)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	if len(req.Content) == 0 {
		req.script, err = NewScriptForRemote(ses, req.scriptPath)
	} else {
		req.script, err = ParseScriptForRemote(ses, req.Content)
	}
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	maxLines := len(req.script.stmts)
	if req.BeginAt >= maxLines {
		return fmt.Errorf("%s: start index %d out of range %d", logp, req.BeginAt, maxLines)
	}
	if req.EndAt > maxLines {
		req.EndAt = maxLines - 1
	}

	// Create temporary directory ...
	mkdirStmt := fmt.Sprintf("mkdir %s", ses.tmpDir)

	err = ses.sshClient.Execute(mkdirStmt)
	if err != nil {
		return fmt.Errorf("%s: %s: %w", logp, mkdirStmt, err)
	}
	defer func() {
		rmdirStmt := fmt.Sprintf("rm -rf %s", ses.tmpDir)
		err := ses.sshClient.Execute(rmdirStmt)
		if err != nil {
			log.Printf("%s: %s", logp, err)
		}
	}()

	err = ses.executeRequires(req)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	ses.executeScriptOnRemote(req)

	return nil
}

//
// Serve start the web-user interface that serve awwan actions through HTTP.
//
func (aww *Awwan) Serve() (err error) {
	logp := "Serve"

	envDev := os.Getenv(envDevelopment)

	memfsBaseOpts := &memfs.Options{
		Root: aww.BaseDir,
		Excludes: []string{
			`.*/\.git`,
			"node_modules",
			"vendor",
			`.*\.(bz|bz2|gz|iso|jar|tar|xz|zip)`,
		},
		Development: true, // Only store the file structures in the memory.
	}
	aww.memfsBase, err = memfs.New(memfsBaseOpts)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	if len(envDev) > 0 {
		mfsWww, err = initMemfs()
		if err != nil {
			return fmt.Errorf("%s: %w", logp, err)
		}
		go aww.workerBuild()
	}

	serverOpts := &http.ServerOptions{
		Memfs:   mfsWww,
		Address: defListenAddress,
	}
	aww.httpd, err = http.NewServer(serverOpts)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	err = aww.registerHttpApis()
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	fmt.Printf("--- Starting HTTP server at http://%s\n", serverOpts.Address)

	return aww.httpd.Start()
}

//
// loadSshConfig load all SSH config from user's home and the awwan base
// directoy.
//
func (aww *Awwan) loadSshConfig() (err error) {
	logp := "loadSshConfig"

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	configFile := filepath.Join(homeDir, defSshDir, defSshConfig)
	aww.sshConfig, err = config.Load(configFile)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	configFile = filepath.Join(aww.BaseDir, defSshDir, defSshConfig)
	baseDirConfig, err := config.Load(configFile)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}
	if baseDirConfig == nil {
		return nil
	}
	aww.sshConfig.Prepend(baseDirConfig)

	return nil
}

//
// workerBuild watch any update on the .js/.html/.ts files inside the _www
// directory.
// If the .ts files changes it will execute TypeScript compiler, tsc, to
// compile the .ts into .js.
// If the .js or .html files changes it will update the node content and
// re-generate the Go embed file memfs_www.go.
//
func (aww *Awwan) workerBuild() {
	var (
		logp       = "workerBuild"
		changesq   = make(chan *io.NodeState, 64)
		tsCount    int
		embedCount int
	)

	dw := io.DirWatcher{
		Options: memfs.Options{
			Root: "_www",
			Includes: []string{
				`.*\.(js|html|ts)$`,
				`/tsconfig.json$`,
			},
			Excludes: []string{
				`/wui.bak`,
				`/wui.local`,
			},
		},
		Callback: func(ns *io.NodeState) {
			changesq <- ns
		},
	}

	err := dw.Start()
	if err != nil {
		log.Fatalf("%s: %s", logp, err)
	}

	buildTicker := time.NewTicker(3 * time.Second)
	for {
		select {
		case ns := <-changesq:
			if strings.HasSuffix(ns.Node.SysPath, ".ts") ||
				strings.HasSuffix(ns.Node.SysPath, "tsconfig.json") {
				mlog.Outf("%s: update %s\n", logp, ns.Node.SysPath)
				tsCount++
			} else if strings.HasSuffix(ns.Node.SysPath, ".js") ||
				strings.HasSuffix(ns.Node.SysPath, ".html") {
				embedCount++
				mlog.Outf("%s: update %s\n", logp, ns.Node.Path)
				node, err := mfsWww.Get(ns.Node.Path)
				if err != nil {
					mlog.Errf("%s: %q: %s", logp, ns.Node.Path, err)
					continue
				}
				if node != nil {
					err = node.Update(nil, 0)
					if err != nil {
						mlog.Errf("%s: %q: %s", logp, node.Path, err)
					}
				}
			}

		case <-buildTicker.C:
			if tsCount > 0 {
				tsCount = 0
				err = doRunTsc()
				if err != nil {
					mlog.Errf("%s", err)
				}
			}
			if embedCount > 0 {
				embedCount = 0
				err = doGoEmbed()
				if err != nil {
					mlog.Errf("%s", err)
				}
			}
		}
	}
}

func doGoEmbed() (err error) {
	err = mfsWww.GoEmbed()
	if err != nil {
		mlog.Errf("doGoEmbed: %s", err)
		return err
	}
	mlog.Outf("doGoEmbed: %s\n", embedFileName)
	return nil
}

func doRunTsc() (err error) {
	mlog.Outf("doRunTsc: execute %s\n", cmdTsc)
	err = exec.Run(cmdTsc, nil, nil)
	if err != nil {
		return fmt.Errorf("doRunTsc: %w", err)
	}
	return nil
}

func initMemfs() (mfs *memfs.MemFS, err error) {
	mfsOpts := &memfs.Options{
		Root: "_www",
		Includes: []string{
			`.*\.(js|html|png|ico)$`,
		},
		Excludes: []string{
			`/wui.bak`,
			`/wui.local`,
		},
		Embed: memfs.EmbedOptions{
			PackageName: embedPackageName,
			VarName:     embedVarName,
			GoFileName:  embedFileName,
		},
	}
	mfs, err = memfs.New(mfsOpts)
	if err != nil {
		return nil, fmt.Errorf("initMemfs: %w", err)
	}
	return mfs, nil
}

//
// lookupBaseDir find the directory that contains ".ssh" directory from
// current working directory until "/", as the base working directory of
// awwan.
//
func lookupBaseDir(baseDir string) (dir string, err error) {
	var (
		logp  = "lookupBaseDir"
		found bool
	)

	if len(baseDir) > 0 {
		_, err = os.Stat(filepath.Join(baseDir, defSshDir))
		if err != nil {
			return "", fmt.Errorf("%s: cannot find .ssh directory on %s", logp, baseDir)
		}
		return baseDir, nil
	}

	dir, err = os.Getwd()
	if err != nil {
		return "", fmt.Errorf("%s: %w", logp, err)
	}

	for dir != "/" {
		_, err = os.Stat(filepath.Join(dir, defSshDir))
		if err == nil {
			found = true
			break
		}
		if os.IsNotExist(err) {
			dir = filepath.Dir(dir)
			continue
		}
		return "", fmt.Errorf("%s: %w", logp, err)
	}
	if !found {
		return "", fmt.Errorf("%s: cannot find .ssh directory", logp)
	}
	return dir, nil
}
