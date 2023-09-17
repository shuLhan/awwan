# awwan

[GoDoc](https://pkg.go.dev/git.sr.ht/~shulhan/awwan)

##  NAME

awwan - Configuration management software, infrastructure as file and
directory layout.


##  SYNOPSIS

```
awwan <command> <arguments>

command = "help" / "local" / "play" / "serve" / "version"

	help
		Display the command usage and its description.

	local <script> <line-range>
		Execute the script in current system from line <start> until
		line <end>.

	play <script> <line-range>
		Execute the script in the remote server from line <start>
		until line <end>.

	serve <workspace>
		Run the web-user interface using <workspace> directory as base
		directory.

	version
		Print the application version to standard output.

arguments = <script> <line-range> / <workspace>

	script = STRING
		A path to script to be executed.

	workspace = STRING
		The root directory of awwan workspace, the one that contains
		the .ssh directory.

line-range = start [ "-" [end] ] *("," line-range)

	start = 1*DIGITS
		The starting line number in the script.

	end = 1*DIGITS
		The end of line number.
		Its value either empty, equal, or greater than start.
```


##  DESCRIPTION

`awwan` is command-line interface to execute multiple lines of command in
the local or remote server using shell or SSH.


##  BACKGROUND

Do you have a collection of shell scripts to manage one more similar server?
Do you ever want to execute only part of your script?
Are you get tired with learning others syntax and tools for provisioning
your own server, while you need is a handful of shell script?

If yes, awwan is the right tools for you.


##  THE COMMAND

The awwan tool have three commands: local, play, or serve.

The "local" command execute the script in local environment, your host
machine, using shell.
The "play" command execute the script in remote environment using SSH.
The "serve" command run the web-user interface using <workspace> directory as
base directory.

The "local" and "play" command has the same arguments,

```
<script> <start> ["-" <end>] *(start ["-" <end>])
```

The <script> argument is the path to the awwan script file.

The <start> argument is line start number.
Its define the line number in the script where awwan start execution.

The <end> argument define the line number in the script where awwan
stop executing the script, or "-" empty to set to the last line.
If not defined then its equal to the line start, which means awwan execute
only single line.

The "serve" command have only single argument,

```
<workspace>
```

The <workspace> argument is the awwan workspace directory that contains the
.ssh directory.


Here is some examples of how to execute script,

* Execute line 5, 7, and 10 until 15 of "script.aww" in local system,

```
$ awwan local myserver/script.aww 5,7,10-15
```

* Execute line 6 and line 12 until the end of line of "script.aww" in remote
  server known as "myserver",

```
$ awwan play myserver/script.aww 6,12-
```

* Run the web-user interface using the current directory as workspace,

```
$ awwan serve .
--- BaseDir: .
--- Starting HTTP server at 127.0.0.1:17600
```


##  THE SCRIPT

The awwan script is similar to shell script.
Each line started with '#' is a comment, except for special, magic words.
Each statement, either in local or remote, is executed using "sh -c".

There are five magic words in the script: `#require:`, `#get:`, `#get!`,
`#put:`, and `#put!`.

Magic word `#require:` ensure that the statement after it always executed even
if its skipped by line-start number argument.
For example, given following script with line number

```
1: #require: echo a
2: echo b
3: #require: echo c
4: echo d
```

Executing "awwan local script.aww 2", always execute "require:" at line number
1 `echo a`, so the output would be

```
a
b
```

Executing "awwan local script.aww 4", always execute "require:" line number 1
and 3, so the output would be

```
a
c
d
```

Magic word `#get:` copy file from remote server to your local file system.
For example,

```
#get: /etc/os-release os-release
```

Magic word `#get!` copy file from remote server, that can be accessed only by
using sudo, to your local file.
For example,

```
#get! /etc/nginx/ssl/my.crt server.crt
```

Magic word `#put:` copy file from your local to remote server.
For example,

```
#put: /etc/locale.conf /tmp/locale.conf
```

Magic word `#put!` copy file from your local system to remote server using
sudo.
For example,

```
#put! /etc/locale.conf /etc/locale.conf
```

Here is an example of script that install Nginx on remote Arch Linux server
using configuration from your local computer,

```
sudo pacman -Sy --noconfirm nginx
sudo systemctl enable nginx

#put! {{.ScriptDir}}/etc/nginx/nginx.conf /etc/nginx/

sudo systemctl restart nginx
sudo systemctl status nginx
```

##  ENVIRONMENT FILE

The environment file is a file named `awwan.env` that contains variables using
the form "key=value" that can be used for templating.

When executing the script, `awwan` read environment files in the current
directory, and in each sub-directory, until the script directory.

The environment file use the ini file format,

```
[section "subsection"]
key = value
```

We will explain how to use and get the environment variables below.


##  TEMPLATING

Template file is any text or script files that dynamically generated using
values from variables defined in environment files.

There are six global variables that shared to all template or script files,

* `.BaseDir` contains the absolute path of current directory
* `.ScriptDir` contains the relative path to script directory
* `.SSHKey` contains the value of "IdentityFile" in SSH configuration
* `.SSHUser` contains the value of "User" in SSH configuration
* `.SSHHost` contains the value of "Host" in SSH configuration
* `.SSHPort` contains the value of "Port" in SSH configuration

To get the value wrap the variable using '{{}}' for example,

```
#put! {{.BaseDir}}/templates/etc/hosts /etc/
#put! {{.ScriptDir}}/etc/hosts /etc/

scp -i {{.SSHKey}} src {{.SSHUser}}@{{.SSHHost}}:{{.SSHPort}}/dst
```

To get the value of variable in environment file you put the string ".Val"
followed by section, subsection and key names, each separated by colon ":".
If no subsection exist you can leave it empty.

You can put the variable inside the script or in the file that you want to
copy.

For example, given the following environment file,

```
[all]
user = arch

[whitelist "ip"]
alpha = 1.2.3.4/32
beta  = 2.3.4.5/32
```

* `{{.Val "all::user"}}` result to "arch" (without double quote), and
* `{{.Val "whitelist:ip:alpha"}}` result to "1.2.3.4/32"
  (without double quote)


##  THE SSH CONFIG

After we learn about the command, script, variables, and templating; we need
to explain some file and directory structure that required by `awwan` so it
can connect to the SSH server.

To be able to connect to the remote SSH server, `awwan` need to know the
remote host name, remote user, and location of private key file.
All of this are derived from ssh_config(5) file in the current directory and
in the user's home directory.

The remote host name is derived from directory name of the script file.
It is matched with `Host` or `Match` section in the ssh_config(5) file.

For example, given the following directory structure,

```
.
|
+-- .ssh/
|   |
|   --- config
+-- development
    |
    --- script.aww
```

If we execute the "development/script.aww", awwan search for the Host that
match with "development" in current ".ssh/config" or in "~/.ssh/config".


##  EXAMPLE

To give you the taste of the idea, we will show you an example using the
working directory $WORKDIR as our base directory.

Let say that we have the working remote server named "myserver" at IP address
"1.2.3.4" using username "arch" on port "2222".

In the $WORKDIR, create directory ".ssh" and "config" file,

```
$ mkdir -p .ssh
$ cat > .ssh/config <<EOF
Host myserver
	Hostname 1.2.3.4
	User arch
	Port 2222
	IdentityFile .ssh/myserver
EOF
```

Still in the $WORKDIR, create  the environment file "awwan.env"

```
$ cat > awwan.env <<EOF
[all]
user = arch
host = myserver

[whitelist "ip"]
alpha = 1.2.3.4/32
beta  = 2.3.4.5/32
EOF
```

Inside the $WORKDIR we create the directory that match with our server name
and a script file "test.aww",

```
$ mkdir -p myserver
$ cat > myserver/test.aww <<EOF
echo {{.Val "all::host"}}`
#put: {{.ScriptDir}}/test /tmp/
cat /tmp/test
EOF
```

and a template file "test",

```
$ cat > myserver/test <<EOF
Hi {{.Val "all::user"}}!
EOF
```

When executed from start to end like these,

```
$ awwan play myserver/test.aww 1-
```

it prints the following output to terminal,

```
>>> arch@1.2.3.4:2222: 1: echo myserver

myserver
test                                                  100%    9     0.4KB/s   00:00
>>> arch@1.2.3.4:2222: 3: cat /tmp/test

Hi arch!
```

That's it.


##  FAQ

###  Workspace structure

Beside ".ssh" directory and directory as host name, `awwan` did not require
any other special directory but we really recommend that you use sub directory
to group several nodes on several cloud services.
For example, if you use cloud services with several nodes inside it, we
recommend the following directory structures,

```
<cloud-service>/<project-name>/<service-name>/<node-name>
```

The `<cloud-service>` is the name of your remote server, it could be "AWS",
"GCP", "DO", and others.
The `<project-name>` is your account ID in your cloud service or your project
name.
The `<service-name>` is a group of several nodes, for example "development",
"staging", "production".
The `<node-name>` is name of your node, each node should have one single
directory.


Here is an example of directory structures,

```
.
├── commons
├── gcp
│   ├── development
│   │   └── vm
│   │       ├── www
│   │       │   └── etc
│   │       │       ├── my.cnf.d
│   │       │       ├── nginx
│   │       │       ├── php
│   │       │       │   └── php-fpm.d
│   │       │       └── systemd
│   │       │           └── system
│   │       │               └── mariadb.service.d
│   │       └── ci
│   └── production
│       └── vm
│           └── www
│               └── etc -> ../../../development/vm/www//etc
└── templates
    ├── etc
    │   ├── pacman.d
    │   └── ssh
    └── home
```

The `commons` directory contains common script that can be executed in any
server.

The `templates` directory contains common templates that can be used by any
scripts.

The `gcp` directory is cloud service with two accounts "development" and
"production", and the rest are node names and templates used in that node.


### What happened if two variables declared inside two environment files?

When executing the script `awwan` merge the variables from current directory
with variables from script directory.
Any keys that are duplicate will be merged and the last one overwrite the
previous one.


### Use case of magic command `#require:`

The magic command `#require:` is added to prevent running local command using
different project or configuration.

The use case was derived from experience with `gcloud` and `kubectl` commands.
When you have more than one projects in GCP, you need to make sure that the
command that you run is using correct configuration.

Here is the example of deploying Cloud Functions using local awwan script,

```
1: #require: gcloud config configurations activate {{.Val "gcloud::config"}}
3:
4: ## Create PubSub topic.
5:
6: gcloud pubsub topics create {{.Val "CloudFunctions:log2slack:pubsub_topic"}}
7:
8: ## Create Logger Sink to Route the log to PubSub topic.
9:
10: gcloud logging sinks create {{.Val "CloudFunctions:log2slack:pubsub_topic"}} \
11:	pubsub.googleapis.com/projects/{{.Val "gcloud::project"}}/topics/{{.Val "CloudFunctions:log2slack:pubsub_topic"}} \
12:	--log-filter=severity>=WARNING
13:
14: ## Create Cloud Functions to forward log to Slack.
15:
16: gcloud functions deploy Log2Slack \
17:	--source {{.ScriptDir}} \
18:	--entry-point Log2Slack \
19:	--runtime go113 \
20:	--trigger-topic {{.Val "CloudFunctions:log2slack:pubsub_topic"}} \
21:	--set-env-vars SLACK_WEBHOOK_URL={{.Val "slack::slack_webhook_url"}} \
22:	--ingress-settings internal-only \
23:	--max-instances=5
24:
25: ## Test the chains by publishing a message to Topic...
26:
27: gcloud pubsub topics \
28:	publish {{.Val "CloudFunctions:log2slack:pubsub_topic"}} \
29:	--message='Hello World!'
```

When executing statement at line number 6, 10, 16 or 27 we need to make sure
that it always using the correct environment "gcloud::config",


```
$ awwan local awwan/playground/CloudFunctions/log2slack/local.deploy.aww 27
2020/06/04 01:48:38 >>> loading "/xxx/awwan.env" ...
2020/06/04 01:48:38 >>> loading "/xxx/awwan/dev/awwan.env" ...
2020/06/04 01:48:38 --- require 2: gcloud config configurations activate dev

Activated [dev].
2020/06/04 01:48:38 >>> local 29: gcloud pubsub topics publish logs
--message='Hello World!'
```

##  BUGS

Known bugs,

* Executing script start with line number contains "#require:" is not
  executing the required statement.


##  LINKS

The source codes for this software project can be viewed at
https://sr.ht/~shulhan/awwan/ .

For request of features and/or bugs report please submitted through web at
https://todo.sr.ht/~shulhan/awwan .


##  DEVELOPMENT

This project require git, GNU make, Go compiler, and TypeScript compiler.

Steps to build from source,

    $ git clone --recurse-submodules https://git.sr.ht/~shulhan/awwan
    $ make

To run development server that watch changes on _www, run

    $ make serve-dev


##  LICENSE

Copyright (C) 2019-2023 M. Shulhan <ms@kilabit.info>

This program is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free
Software Foundation, either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with
this program.
If not, see <http://www.gnu.org/licenses/>.

<!--
SPDX-FileCopyrightText: 2019 M. Shulhan <ms@kilabit.info>
SPDX-License-Identifier: GPL-3.0-or-later
-->