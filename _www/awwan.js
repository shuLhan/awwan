// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later
import { WuiEditor } from "./wui/editor/editor.js";
import { WuiNotif } from "./wui/notif/notif.js";
import { WuiVfs } from "./wui/vfs/vfs.js";
const CLASS_EDITOR_ACTION = "editor_action";
const ID_BTN_CLEAR_SELECTION = "com_btn_clear_selection";
const ID_BTN_EXEC_LOCAL = "com_btn_local";
const ID_BTN_EXEC_REMOTE = "com_btn_remote";
const ID_BTN_NEW_DIR = "com_btn_new_dir";
const ID_BTN_NEW_FILE = "com_btn_new_file";
const ID_BTN_REMOVE = "com_btn_remove";
const ID_BTN_SAVE = "com_btn_save";
const ID_EDITOR = "com_editor";
const ID_INP_VFS_NEW = "com_inp_vfs_new";
const ID_VFS = "com_vfs";
const ID_VFS_PATH = "vfs_path";
const ID_STDOUT = "stdout";
const ID_STDERR = "stderr";
const MAX_FILE_SIZE = 3000000;
export function renderHtml() {
    let el = document.createElement("div");
    el.classList.add("awwan");
    el.innerHTML = `
			<div class="awwan_nav_left">
				<div id="${ID_VFS}"></div>

				<br/>
				<div class="${ID_INP_VFS_NEW}">
					<input id="${ID_INP_VFS_NEW}" />
				</div>
				<button id="${ID_BTN_NEW_DIR}">New directory</button>
				<button id="${ID_BTN_NEW_FILE}">New file</button>
				<button id="${ID_BTN_REMOVE}">Remove</button>
			</div>
			<div class="awwan_content">
				<div class="editor_file">
					File: <span id="${ID_VFS_PATH}">-</span>
					<button id="${ID_BTN_SAVE}" disabled="true">Save</button>
				</div>
				<div id="${ID_EDITOR}"></div>
				<div>
					<div class="${CLASS_EDITOR_ACTION}">
						<button id="${ID_BTN_CLEAR_SELECTION}">Clear selection</button>
					</div>
					<div class="${CLASS_EDITOR_ACTION}">
						Execute script on
						<button id="${ID_BTN_EXEC_LOCAL}" disabled="true">Local</button>
						or
						<button id="${ID_BTN_EXEC_REMOTE}" disabled="true">Remote</button>
					</div>
				</div>
				<p>Hints:</p>
				<ul>
					<li>
						Click and drag on the line numbers to select the specific line to be
						executed.
					</li>
					<li>Press ESC to clear selection.</li>
				</ul>
				<div class="boxheader">Standard output:</div>
				<div id="${ID_STDOUT}"></div>
				<div class="boxheader">Standard error:</div>
				<div id="${ID_STDERR}"></div>
			</div>
		`;
    document.body.appendChild(el);
}
export class Awwan {
    constructor() {
        this.current_node = null;
        this.request = {
            mode: "local",
            script: "",
            content: "",
            line_range: "",
        };
        let el = document.getElementById(ID_BTN_CLEAR_SELECTION);
        if (el) {
            this.com_btn_clear = el;
            this.com_btn_clear.onclick = () => {
                this.wui_editor.clearSelection();
            };
        }
        el = document.getElementById(ID_BTN_EXEC_LOCAL);
        if (el) {
            this.com_btn_local = el;
            this.com_btn_local.onclick = () => {
                this.execLocal();
            };
        }
        el = document.getElementById(ID_BTN_EXEC_REMOTE);
        if (el) {
            this.com_btn_remote = el;
            this.com_btn_remote.onclick = () => {
                this.execRemote();
            };
        }
        el = document.getElementById(ID_BTN_NEW_DIR);
        if (el) {
            this.com_btn_new_dir = el;
            this.com_btn_new_dir.onclick = () => {
                this.newNode(true);
            };
        }
        el = document.getElementById(ID_BTN_NEW_FILE);
        if (el) {
            this.com_btn_new_file = el;
            this.com_btn_new_file.onclick = () => {
                this.newNode(false);
            };
        }
        el = document.getElementById(ID_BTN_REMOVE);
        if (el) {
            this.com_btn_remove = el;
            this.com_btn_remove.onclick = () => {
                this.onClickRemove();
            };
        }
        el = document.getElementById(ID_BTN_SAVE);
        if (el) {
            this.com_btn_save = el;
            this.com_btn_save.onclick = () => {
                this.onClickSave();
            };
        }
        el = document.getElementById(ID_INP_VFS_NEW);
        if (el) {
            this.com_inp_vfs_new = el;
        }
        el = document.getElementById(ID_VFS_PATH);
        if (el) {
            this.com_file_path = el;
        }
        el = document.getElementById(ID_STDOUT);
        if (el) {
            this.com_stdout = el;
        }
        el = document.getElementById(ID_STDERR);
        if (el) {
            this.com_stderr = el;
        }
        let editor_opts = {
            id: ID_EDITOR,
            is_editable: true,
            onSelection: (begin_at, end_at) => {
                this.editorOnSelection(begin_at, end_at);
            },
            onSave: this.editorOnSave,
        };
        this.wui_editor = new WuiEditor(editor_opts);
        this.wui_notif = new WuiNotif();
        let wui_vfs_opts = {
            id: ID_VFS,
            open: (path, is_dir) => {
                return this.open(path, is_dir);
            },
            openNode: (node) => {
                return this.openNode(node);
            },
        };
        this.wui_vfs = new WuiVfs(wui_vfs_opts);
        window.onhashchange = (ev) => {
            ev.preventDefault();
            let hashchange = ev;
            let url = new URL(hashchange.newURL);
            this.onHashChange(url.hash);
        };
        // Open path based on hash.
        this.onHashChange(window.location.hash);
    }
    onHashChange(hash) {
        if (hash === "") {
            hash = "#/";
        }
        hash = hash.substring(1);
        this.wui_vfs.openDir(hash);
    }
    // open fetch the node content from remote server.
    async open(path, is_dir) {
        let http_res = await fetch("/awwan/api/fs?path=" + path);
        let res = await http_res.json();
        if (res.code != 200) {
            this.wui_notif.error(`Failed to open ${path}: ${res.message}`);
            return res;
        }
        let node = res.data;
        this.com_inp_vfs_new.value = node.name;
        if (is_dir) {
            this.current_node = node;
            window.location.hash = "#" + path;
            return res;
        }
        let resAllow = this.isEditAllowed(node);
        if (resAllow.code != 200) {
            this.wui_notif.error(resAllow.message);
            return resAllow;
        }
        this.com_file_path.innerText = path;
        this.request.script = path;
        this.wui_editor.open(node);
        this.com_btn_local.disabled = false;
        this.com_btn_remote.disabled = false;
        this.com_btn_save.disabled = false;
        return res;
    }
    // openNode is an handler that will called when user click on of the
    // item in the list.
    async openNode(node) {
        let resAllow = this.isEditAllowed(node);
        if (resAllow.code != 200) {
            this.wui_notif.error(resAllow.message);
            return resAllow;
        }
        let res = await this.open(node.path, node.is_dir);
        return res;
    }
    isEditAllowed(node) {
        let res = {
            code: 412,
            message: "",
        };
        let is_type_allowed = false;
        if (node.content_type &&
            (node.content_type.indexOf("json") >= 0 ||
                node.content_type.indexOf("message") >= 0 ||
                node.content_type.indexOf("script") >= 0 ||
                node.content_type.indexOf("text") >= 0 ||
                node.content_type.indexOf("xml") >= 0)) {
            is_type_allowed = true;
        }
        if (!is_type_allowed) {
            res.message = `The file "${node.name}" with content type "${node.content_type}" is not allowed to be opened`;
            return res;
        }
        if (node.size && node.size > MAX_FILE_SIZE) {
            res.message = `The file "${node.name}" with size ${node.size / 1000000}MB is greater than maximum ${MAX_FILE_SIZE / 1000000}MB.`;
            return res;
        }
        res.code = 200;
        return res;
    }
    onClickSave() {
        if (this.request.script == "") {
            return;
        }
        let content = this.wui_editor.getContent();
        let l = content.length;
        if (l > 0 && content[l - 1] != "\n") {
            content += "\n";
        }
        this.request.content = content;
        this.doSaveFile(this.request.script, this.request.content);
    }
    editorOnSave(content) {
        this.doSaveFile(this.request.script, content);
    }
    async doSaveFile(path, content) {
        let req = {
            path: path,
            content: btoa(content),
        };
        let http_res = await fetch("/awwan/api/fs", {
            method: "PUT",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(req),
        });
        let res = await http_res.json();
        if (res.code != 200) {
            this.wui_notif.error(`Failed to save file ${path}: ${res.message}`);
            return null;
        }
        this.wui_notif.info(`File ${path} has been saved.`);
        return res;
    }
    editorOnSelection(begin, end) {
        let stmts = this.wui_editor.lines.slice(begin, end + 1);
        for (const stmt of stmts) {
            console.log("stmt:", stmt.x, stmt.text);
        }
    }
    // execLocal request to execute the selected script on local system.
    execLocal() {
        if (this.request.script == "") {
            this.wui_notif.error(`Execute on local: no file selected`);
            return;
        }
        this.httpApiExecute("local");
    }
    // execRemote request to execute the selected script on remote system.
    execRemote() {
        if (this.request.script == "") {
            this.wui_notif.error(`Execute on remote: no file selected`);
            return;
        }
        this.httpApiExecute("remote");
    }
    async httpApiExecute(mode) {
        let beginAt = 0;
        let endAt = 0;
        let selection_range = this.wui_editor.getSelectionRange();
        if (selection_range.begin_at > 0) {
            beginAt = selection_range.begin_at + 1;
        }
        if (selection_range.end_at > 0) {
            endAt = selection_range.end_at + 1;
        }
        this.com_stdout.innerText = "";
        this.com_stderr.innerText = "";
        this.request.mode = mode;
        this.request.content = btoa(this.wui_editor.getContent());
        if (beginAt === endAt) {
            this.request.line_range = `${beginAt}`;
        }
        else {
            this.request.line_range = `${beginAt}-${endAt}`;
        }
        let http_res = await fetch("/awwan/api/execute", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(this.request),
        });
        let res = await http_res.json();
        if (res.code != 200) {
            this.wui_notif.error(`Execute failed: ${res.message}`);
            return;
        }
        if (res.data.stdout) {
            this.com_stdout.innerText = atob(res.data.stdout);
        }
        if (res.data.stderr) {
            this.com_stderr.innerText = atob(res.data.stderr);
        }
        this.wui_notif.info(`Successfully execute ${this.request.script} on ${mode}.`);
    }
    async newNode(is_dir) {
        if (!this.current_node) {
            this.wui_notif.error("No active directory loaded or selected.");
            return;
        }
        let name = this.com_inp_vfs_new.value;
        if (name === "") {
            this.wui_notif.error("Empty file name");
            return;
        }
        let req = {
            path: this.current_node.path + "/" + name,
            name: name,
            is_dir: is_dir,
            content_type: "",
            mod_time: 0,
            size: 0,
            mode: "",
            childs: [],
            content: "",
        };
        let http_res = await fetch("/awwan/api/fs", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(req),
        });
        let res = await http_res.json();
        if (res.code != 200) {
            this.wui_notif.error(`newNode: ${res.message}`);
            return;
        }
        let node = res.data;
        if (!this.current_node.childs) {
            this.current_node.childs = [];
        }
        this.current_node.childs.push(node);
        this.wui_vfs.set(this.current_node);
    }
    async onClickRemove() {
        console.log("onClickRemove: ", this.current_node);
        if (!this.current_node) {
            this.wui_notif.error("No file selected.");
            return;
        }
        let name = this.com_inp_vfs_new.value;
        if (name === "") {
            this.wui_notif.error("Empty file name");
            return;
        }
        let req = {
            path: this.current_node.path + "/" + name,
            is_dir: false,
            content: "",
        };
        let http_res = await fetch("/awwan/api/fs", {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(req),
        });
        let res = await http_res.json();
        if (res.code != 200) {
            this.wui_notif.error(`remove: ${res.message}`);
            return;
        }
    }
}
