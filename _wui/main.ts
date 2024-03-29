// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

import { Awwan } from "./awwan";

const awwan = new Awwan();

// Open path based on hash.
awwan.onHashChange(window.location.hash);
