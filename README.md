# awwan

##  NAME

awwan - Configuration management software, infrastructure as file and
directory layout.


##  SYNOPSIS

```
awwan <command> <script> <line-start> [line-end | "-"]
```

##  DESCRIPTION

`awwan` is command-line interface to execute multiple lines of command in
the local or remote server using SSH.


##  BACKGROUND

Do you have a collection of shell scripts to manage one more similar server?
Do you ever want to execute only part of your script?
Are you get tired with learning others syntax and tools for provisioning
your own server, while you need is a handful of shell script?

If yes, awwan is the right tools for you.


##  THE COMMAND

The awwan tool only need four arguments.

The first argument is mode: "local" or "play".
The "local" mode execute the script in local environment, your own machine,
without using SSH.
The "play" mode execute the script in remote environment, your SSH server.

The second argument is the path to the awwan script file.

The third argument is line start number.
Its define the line number in the script where awwan will start
execution.

The fourth argument define the line number in the script where awwan will stop
executing the script, or "-" to set to the last line.
If not defined then it will be equal to the line start, which means awwan will
execute only single line.
Another value for this argument is "-", its means execute the script from
line-start until the last line.

Here is some examples of how to execute script,

* Execute only line 5 of "script.aww" on local system,

```
$ awwan local myserver/script.aww 5
```

* Execute line 5 until line 10 of "script.aww" on remote server known as
  "myserver",

```
$ awwan play myserver/script.aww 5 10
```

* Execute line 5 until last line of "script.aww" on remote server known as
  "myserver",

```
$ awwan play cloud/myserver/script.aww 5 -
```


##  THE SCRIPT

The awwan script is similar to shell script.
Each line started with '#' is a comment, except for special, magic words.

There are five magic words in the script: `#require:`, `#get:`, `#get!`,
`#put:`, and `#put!`.

Magic word `#require:` will ensure that the next statement will always
executed when its skipped with start number.
For example, given following script with line number

```
1: #require:
2: echo a
3: echo b
4: #require:
5: echo c
```

executing `awwan local script.aww 3`, will always execute line number 2 `echo
a`, but not line number 5 (because its before line start 3).

Magic word `#get:` will copy file from remote server to your local file
system.
Example,

```
#get: /etc/os-release os-release
```

Magic word `#get!` will copy file from remote server, that can be accessed
only by using sudo, to your local file.
Example,

```
#get! /etc/nginx/ssl/my.crt server.crt
```

Magic word `#put:` will copy file from your local to remote server.
Example,

```
#put: /etc/locale.conf /tmp/locale.conf
```

Magic word `#put!` will copy file from your local system to remote server
using sudo.
Example,

```
#put! /etc/locale.conf /etc/locale.conf
```

One thing that script can't do is piping, for example "echo a > b" does not
work, yet.

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

When executing the script, `awwan` will read environment files in the current
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

There are two global variables that shared to all template or script files,

* `.BaseDir` contains the absolute path of current directory, and
* `.ScriptDir` contains the relative path to script directory.

To get the value wrap the variable using '{{}}' for example,

```
#put! {{.BaseDir}}/templates/etc/hosts /etc/
#put! {{.ScriptDir}}/etc/hosts /etc/
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

* `{{.Val "all::user"}}` will result to "arch" (without double quote), and
* `{{.Val "whitelist:ip:alpha"}}` will result to "1.2.3.4/32"
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
It will be matched with `Host` or `Match` section in the ssh_config(5) file.

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

If we execute the "development/script.aww", awwan will search for the Host
that match with "development" in current ".ssh/config" or in "~/.ssh/config".


##  EXAMPLE

To give you the taste of the idea, I will show you an example using the
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
$ awwan play myserver/test.aww 1 -
```

it will print the following output to terminal,

```
>>> arch@1.2.3.4:2222: 1: echo myserver

myserver
test                                                  100%    9     0.4KB/s   00:00
>>> arch@1.2.3.4:2222: 3: cat /tmp/test

Hi arch!
```

That's it.


##  FAQ

Since this software is working in progress, there are many things that we have
in mind, but can't put it to code, yet.

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


###  What happened if two variables declared inside two environment files?

When executing the script `awwan` will merge the variables from current
directory with variable from script directory.
Any keys that are duplicate will be merged and the last one will overwrite the
previous one.


### Use case of magic command `#require:`

The magic command `#require:` is added to prevent running local command using
different project or configuration.

The use case was derived from experience with `gcloud` and `kubectl` commands.
When you have more than one projects in GCP, you need to make sure that the
command that you run is using correct configuration.

Here is the example of deploying Cloud Functions using local awwan script,

```
1: #require:
2: gcloud config configurations activate {{.Val "gcloud::config"}}
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
2020/06/04 01:48:38 >>> loading "/xxx//awwan.env" ...
2020/06/04 01:48:38 >>> loading "/xxx/awwan/dev/awwan.env" ...
2020/06/04 01:48:38 --- require 2: gcloud config configurations activate dev

Activated [dev].
2020/06/04 01:48:38 >>> local 29: gcloud pubsub topics publish logs
--message='Hello World!'
```



##  BUGS

Shell pipe "|", "<", or ">"  does not work in the script, yet.


##  LINKS

The source codes for this software project can be viewed at
https://sr.ht/~shulhan/awwan/ .

For request of features and/or bugs report please submitted through web at
https://todo.sr.ht/~shulhan/awwan .


##  LICENSE

```
Copyright (c) 2020 M. Shulhan (m.shulhan@gmail.com). All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

   * Redistributions of source code must retain the above copyright
notice, this list of conditions and the following disclaimer.
   * Redistributions in binary form must reproduce the above
copyright notice, this list of conditions and the following disclaimer
in the documentation and/or other materials provided with the
distribution.
   * Neither the name of M. Shulhan, nor the names of its
contributors may be used to endorse or promote products derived from
this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```
