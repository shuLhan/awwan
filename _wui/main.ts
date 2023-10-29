// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

import { renderHtml, Awwan } from "./awwan";

renderHtml();

document._awwan = new Awwan();

// Open path based on hash.
document._awwan.onHashChange(window.location.hash);
