// Copyright 2019, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

// awwan is command line interface to configure and manage remote system
// through SSH connection.
//
// awwan use a strict file and directory structure.
// Each file or directory have their own meanings.
//
// CLI
//
// The CLI have the following syntax,
//
//	awwan <commands> <options>
//
//	commands  = "bootstrap" / "local" / "play"
//
//	options   = provider "/"
//                  (service-aws/service-gcp/service-virtualbox) "/"
//                  element
//
//	provider  = "aws" / "gcp" / "virtualbox"
//
//	service-aws        = "ec2"
//
//	service-gcp        = "gce"
//
//	service-virtualbox = "vm"
//
//	element   = 1*ALPHANUM ( "." / "-" / ALPHANUM )
//
// Directory Structure
//
// aws
//
// This directory (must be in lowercase, aws) contains to configurations,
// services, and node in Amazon Web Services (aws).
//
package main
