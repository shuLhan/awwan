= Welcome to awwan

This is an example of awwan workspace.

The awwan workspace is indicated by ".ssh" directory, as you can see in the
list of file in the left.

In awwan, every file is a script, including this file.
As long as the line is a valid shell command, awwan can execute it.

Lets try.

echo "Hello world" > {{.ScriptDir}}/output

In the input "Execute line" below, set its value to "13" and click on the
"Local" button.
You should see output like these,

  2023/11/29 15:45:08 -->  13: echo "Hello world" > /home/awwan/tour/output

The same line can be executed in terminal using awwan CLI with following
command,

awwan local {{.ScriptDir}}/00_README.txt 13

Click on the directory path "/" on the left top (above ".ssh"), to refresh
the content of directory.
You should see a new file "output" and "00_README.txt.log" in the list after
executing above line.
Click on the file "output" to see its content or execute the line below

cat {{.ScriptDir}}/output


We provides an example files to follow along, that explain each command and
feature in the awwan.

01_local.aww - Tutorial on "local" command, to execute command in local
machine using shell.

02_script_variables.aww - Quick tutorial on global variables that can be
used in script.

03_env.aww - Tutorial on how to write and use environment file.

04_env-set.aww - Tutorial on "env-set" command, or how to set value into
environment file.

05_env-get.aww - Tutorial on "env-get" command, or how to get value from
environment file.

06_magic_put.aww - Tutorial on magic line "#put".

07_magic_get.aww - Tutorial on magic line "#get".

08_encrypt.aww - Tutorial on how to encrypt file and use it to copy file.

09_decrypt.aww - Tutorial on how to decrypt file.

10_encrypted_env.aww - Tutorial on how to use encrypted environment.

11_encrypted_put.aww - Tutorial on how to use magic line "#put" with encrypted
environment or encrypted file.

12_magic_require.aww - Tutorial on how to use magic line "#require".

remotehost/01_play.aww - Tutorial on how to use "play" command using SSH in
the server named "remotehost".

remotehost/02_magic_local.aww - Tutorial on magic line "#local".
