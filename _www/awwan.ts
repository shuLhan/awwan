// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

import { WuiEditor, WuiEditorOptions } from "./wui/editor/editor.js";
import { WuiNotif } from "./wui/notif/notif.js";
import { WuiResponseInterface } from "./wui/response.js";
import { WuiVfs, WuiVfsOptions, WuiVfsNodeInterface } from "./wui/vfs/vfs.js";

const CLASS_EDITOR_ACTION = "editor_action";
const ID_BTN_EXEC_LOCAL = "com_btn_local";
const ID_BTN_EXEC_REMOTE = "com_btn_remote";
const ID_BTN_NEW_DIR = "com_btn_new_dir";
const ID_BTN_NEW_FILE = "com_btn_new_file";
const ID_BTN_REMOVE = "com_btn_remove";
const ID_BTN_SAVE = "com_btn_save";
const ID_COM_RESIZE = "com_resize";
const ID_EDITOR = "com_editor";
const ID_INP_LINE_RANGE = "com_inp_line_range";
const ID_INP_VFS_NEW = "com_inp_vfs_new";
const ID_VFS = "com_vfs";
const ID_VFS_PATH = "vfs_path";
const ID_OUTPUT = "output";
const ID_OUTPUT_WRAPPER = "output_wrapper";
const MAX_FILE_SIZE = 3000000;

interface RequestInterface {
  mode: string;
  script: string;
  content: string;
  line_range: string;
}

interface fsRequest {
  path: string;
  content: string;
  is_dir: boolean;
}

export function renderHtml() {
  const el = document.createElement("div");
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
        <div class="boxheader">
          File: <span id="${ID_VFS_PATH}">-</span>
          <button id="${ID_BTN_SAVE}" disabled="true">Save</button>
        </div>
        <div id="${ID_EDITOR}"></div>
        <div>
          <div class="${CLASS_EDITOR_ACTION}">
            Execute
            <input id="${ID_INP_LINE_RANGE}" />
            on
            <button id="${ID_BTN_EXEC_LOCAL}" disabled="true">Local</button>
            or
            <button id="${ID_BTN_EXEC_REMOTE}" disabled="true">Remote</button>

          </div>
        </div>
        <button id="${ID_COM_RESIZE}">&#9868;</button>
        <div id="${ID_OUTPUT_WRAPPER}" class="output">
          <div class="boxheader">Output:</div>
          <div id="${ID_OUTPUT}"></div>
        </div>
      </div>
    `;
  document.body.appendChild(el);
}

export class Awwan {
  private comBtnLocal!: HTMLButtonElement;
  private comBtnNewDir!: HTMLButtonElement;
  private comBtnNewFile!: HTMLButtonElement;
  private comBtnRemote!: HTMLButtonElement;
  private comBtnRemove!: HTMLButtonElement;
  private comBtnSave!: HTMLButtonElement;
  private comEditor!: HTMLElement;
  private comFilePath!: HTMLElement;
  private comInputLineRange!: HTMLInputElement;
  private comInputVfsNew!: HTMLInputElement;
  private comOutput!: HTMLElement;
  private comOutputWrapper!: HTMLElement;
  private currentNode: WuiVfsNodeInterface | null = null;
  private request: RequestInterface = {
    mode: "local",
    script: "",
    content: "",
    line_range: "",
  };
  private editor: WuiEditor;
  private notif: WuiNotif;
  private vfs: WuiVfs;

  constructor() {
    let el = document.getElementById(ID_BTN_EXEC_LOCAL);
    if (el) {
      this.comBtnLocal = el as HTMLButtonElement;
      this.comBtnLocal.onclick = () => {
        this.execLocal();
      };
    }
    el = document.getElementById(ID_BTN_EXEC_REMOTE);
    if (el) {
      this.comBtnRemote = el as HTMLButtonElement;
      this.comBtnRemote.onclick = () => {
        this.execRemote();
      };
    }

    el = document.getElementById(ID_BTN_NEW_DIR);
    if (el) {
      this.comBtnNewDir = el as HTMLButtonElement;
      this.comBtnNewDir.onclick = () => {
        this.newNode(true);
      };
    }
    el = document.getElementById(ID_BTN_NEW_FILE);
    if (el) {
      this.comBtnNewFile = el as HTMLButtonElement;
      this.comBtnNewFile.onclick = () => {
        this.newNode(false);
      };
    }
    el = document.getElementById(ID_BTN_REMOVE);
    if (el) {
      this.comBtnRemove = el as HTMLButtonElement;
      this.comBtnRemove.onclick = () => {
        this.onClickRemove();
      };
    }

    el = document.getElementById(ID_BTN_SAVE);
    if (el) {
      this.comBtnSave = el as HTMLButtonElement;
      this.comBtnSave.onclick = () => {
        this.onClickSave();
      };
    }

    el = document.getElementById(ID_INP_LINE_RANGE);
    if (!el) {
      console.error(`failed to get element by ID #${ID_INP_LINE_RANGE}`);
      return;
    }

    this.comInputLineRange = el as HTMLInputElement;

    el = document.getElementById(ID_INP_VFS_NEW);
    if (el) {
      this.comInputVfsNew = el as HTMLInputElement;
    }

    el = document.getElementById(ID_VFS_PATH);
    if (el) {
      this.comFilePath = el;
    }
    el = document.getElementById(ID_OUTPUT);
    if (el) {
      this.comOutput = el;
    }
    el = document.getElementById(ID_OUTPUT_WRAPPER);
    if (el) {
      this.comOutputWrapper = el;
    }

    const editorOpts: WuiEditorOptions = {
      id: ID_EDITOR,
      is_editable: true,
      onSave: (content) => {
        this.editorOnSave(content);
      },
    };
    this.editor = new WuiEditor(editorOpts);
    this.comEditor = document.getElementById(ID_EDITOR);

    this.notif = new WuiNotif();

    const vfsOpts: WuiVfsOptions = {
      id: ID_VFS,
      open: (path: string, isDir: boolean): Promise<WuiResponseInterface> => {
        return this.open(path, isDir);
      },
      openNode: (node: WuiVfsNodeInterface): Promise<WuiResponseInterface> => {
        return this.openNode(node);
      },
    };
    this.vfs = new WuiVfs(vfsOpts);

    window.onhashchange = (ev: Event) => {
      ev.preventDefault();
      const hashchange = ev as HashChangeEvent;
      const url = new URL(hashchange.newURL);
      this.onHashChange(url.hash);
    };

    const elResize = document.getElementById(ID_COM_RESIZE);

    elResize.addEventListener("mousedown", () => {
      document._posy = 0;
      document.addEventListener("mousemove", this.doResize, false);
    });

    document.addEventListener("mouseup", () => {
      document.removeEventListener("mousemove", this.doResize, false);
      document._posy = 0;
    });
  }

  onHashChange(hash: string) {
    if (hash === "") {
      hash = "#/";
    }

    hash = hash.substring(1);
    this.vfs.openDir(hash);
  }

  // open fetch the node content from remote server.
  async open(path: string, isDir: boolean): Promise<WuiResponseInterface> {
    const httpRes = await fetch("/awwan/api/fs?path=" + path);
    const res = await httpRes.json();
    if (res.code != 200) {
      this.notif.error(`Failed to open ${path}: ${res.message}`);
      return res;
    }

    const node = res.data as WuiVfsNodeInterface;
    this.comInputVfsNew.value = node.name;

    if (isDir) {
      this.currentNode = node;
      window.location.hash = "#" + path;
      return res;
    }

    const resAllow = this.isEditAllowed(node);
    if (resAllow.code != 200) {
      this.notif.error(resAllow.message);
      return resAllow;
    }

    this.comFilePath.innerText = path;
    this.request.script = path;

    this.editor.open(node);
    this.comBtnLocal.disabled = false;
    this.comBtnRemote.disabled = false;
    this.comBtnSave.disabled = false;

    return res;
  }

  // openNode is an handler that will called when user click on of the
  // item in the list.
  async openNode(node: WuiVfsNodeInterface): Promise<WuiResponseInterface> {
    const resAllow = this.isEditAllowed(node);
    if (resAllow.code != 200) {
      this.notif.error(resAllow.message);
      return resAllow;
    }

    const res = await this.open(node.path, node.is_dir);
    return res;
  }

  isEditAllowed(node: WuiVfsNodeInterface): WuiResponseInterface {
    const res: WuiResponseInterface = {
      code: 412,
      message: "",
    };

    let isTypeAllowed = false;
    if (
      node.content_type &&
      (node.content_type.indexOf("json") >= 0 ||
        node.content_type.indexOf("message") >= 0 ||
        node.content_type.indexOf("script") >= 0 ||
        node.content_type.indexOf("text") >= 0 ||
        node.content_type.indexOf("xml") >= 0)
    ) {
      isTypeAllowed = true;
    }
    if (!isTypeAllowed) {
      res.message = `The file "${node.name}" with content type "${node.content_type}" is not allowed to be opened`;
      return res;
    }
    if (node.size && node.size > MAX_FILE_SIZE) {
      res.message = `The file "${node.name}" with size ${
        node.size / 1000000
      }MB is greater than maximum ${MAX_FILE_SIZE / 1000000}MB.`;
      return res;
    }
    res.code = 200;
    return res;
  }

  onClickSave() {
    if (this.request.script == "") {
      return;
    }
    let content = this.editor.getContent();
    const l = content.length;
    if (l > 0 && content[l - 1] != "\n") {
      content += "\n";
    }
    this.request.content = content;
    this.doSaveFile(this.request.script, this.request.content);
  }

  editorOnSave(content: string) {
    this.doSaveFile(this.request.script, content);
  }

  async doSaveFile(path: string, content: string) {
    const req = {
      path: path,
      content: btoa(content),
    };
    const httpRes = await fetch("/awwan/api/fs", {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req),
    });
    const res = await httpRes.json();
    if (res.code != 200) {
      this.notif.error(`Failed to save file ${path}: ${res.message}`);
      return null;
    }

    this.notif.info(`File ${path} has been saved.`);
    return res;
  }

  // execLocal request to execute the selected script on local system.
  execLocal() {
    if (this.request.script == "") {
      this.notif.error(`Execute on local: no file selected`);
      return;
    }
    const lineRange = this.comInputLineRange.value.trim();
    if (lineRange === "") {
      this.notif.error(`Empty line range`);
      return;
    }
    this.httpApiExecute("local", lineRange);
  }

  // execRemote request to execute the selected script on remote system.
  execRemote() {
    if (this.request.script == "") {
      this.notif.error(`Execute on remote: no file selected`);
      return;
    }
    const lineRange = this.comInputLineRange.value.trim();
    if (lineRange === "") {
      this.notif.error(`Empty line range`);
      return;
    }
    this.httpApiExecute("remote", lineRange);
  }

  async httpApiExecute(mode: string, lineRange: string) {
    this.comOutput.innerText = "";

    this.request.mode = mode;
    this.request.content = btoa(this.editor.getContent());
    this.request.line_range = lineRange;

    const httpRes = await fetch("/awwan/api/execute", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(this.request),
    });

    const res = await httpRes.json();
    if (res.code != 200) {
      this.notif.error(`Execute failed: ${res.message}`);
      return;
    }

    if (res.data.output) {
      this.comOutput.innerText = atob(res.data.output);
    }

    this.notif.info(`Successfully execute ${this.request.script} on ${mode}.`);
  }

  private async newNode(isDir: boolean) {
    if (!this.currentNode) {
      this.notif.error("No active directory loaded or selected.");
      return;
    }

    const name = this.comInputVfsNew.value;
    if (name === "") {
      this.notif.error("Empty file name");
      return;
    }
    const req: WuiVfsNodeInterface = {
      path: this.currentNode.path + "/" + name,
      name: name,
      is_dir: isDir,
      content_type: "",
      mod_time: 0,
      size: 0,
      mode: "",
      childs: [],
      content: "",
    };

    const httpRes = await fetch("/awwan/api/fs", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req),
    });

    const res = await httpRes.json();
    if (res.code != 200) {
      this.notif.error(`newNode: ${res.message}`);
      return;
    }

    const node = res.data as WuiVfsNodeInterface;
    if (!this.currentNode.childs) {
      this.currentNode.childs = [];
    }
    this.currentNode.childs.push(node);
    this.vfs.set(this.currentNode);
  }

  private async onClickRemove() {
    console.log("onClickRemove: ", this.currentNode);
    if (!this.currentNode) {
      this.notif.error("No file selected.");
      return;
    }

    const name = this.comInputVfsNew.value;
    if (name === "") {
      this.notif.error("Empty file name");
      return;
    }
    const req: fsRequest = {
      path: this.currentNode.path + "/" + name,
      is_dir: false,
      content: "",
    };

    const httpRes = await fetch("/awwan/api/fs", {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req),
    });

    const res = await httpRes.json();
    if (res.code != 200) {
      this.notif.error(`remove: ${res.message}`);
      return;
    }
  }

  doResize(ev: MouseEvent) {
    if (this._posy == 0) {
      this._posy = ev.screenY;
      return true;
    }
    const diff = this._posy - ev.screenY;
    if (diff > 0) {
      this._awwan.resizeUp(diff);
    } else if (diff < 0) {
      this._awwan.resizeDown(diff * -1);
    }
    this._posy = ev.screenY;
  }

  resizeUp(diff: number) {
    if (this.comEditor.clientHeight <= 126) {
      return;
    }
    this.comEditor.style.height = `${this.comEditor.clientHeight - diff}px`;
    this.comOutputWrapper.style.height = `${
      this.comOutputWrapper.clientHeight + diff
    }px`;
  }

  resizeDown(diff: number) {
    if (this.comOutputWrapper.clientHeight <= 126) {
      return;
    }
    this.comEditor.style.height = `${this.comEditor.clientHeight + diff}px`;
    this.comOutputWrapper.style.height = `${
      this.comOutputWrapper.clientHeight - diff
    }px`;
  }
}
