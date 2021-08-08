// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

/*
Package awwan provide the library for loading environment files, creating SSH
client, and executing the script.

This documentation describe the design of awwan library.
For documentation about awwan as CLI see the README.adoc on the root of
repository.


Terminology

This section describe some terminologies that we use along when developing
awwan.

	Workspace::
		The directory than contains ".ssh" directory with its "config"
		file.

	Environment file::
		The name of environment file is static, set to "awwan.env".
		Its contains dynamic values to be applied to the script before
		executing them.

		The environment file is formatted using the git ini [1][2].

	Script file::
		The file with .aww extension, its contains the statement to be
		executed.


Specifications

Awwan workspace is indicated by ".ssh" directory.
User can pass the workspace directory when creating Awwan service or
automatically lookup them from current working directory until "/".
For example, if the current directory is "/home/ms/a/b/c/d", and ".ssh"
directory exist on "b", then the Awwan workspace will be set to
"/home/ms/a/b".

Once the .ssh directory found, user can execute the script in local or remote.

The Session type contains cache of the parsed Awwan environment files and SSH
connections per host, to minimize re-reading "awwan.env" and re-creating new
connection when executing different script on the same host.

The Script type contains list of statements to be executed later, either in
local or remote.


References

[1] https://pkg.go.dev/github.com/shuLhan/share/lib/ini

[2] https://git-scm.com/docs/git-config#_configuration_file
*/
package awwan
