"use strict";
var awwan = (() => {
  // _wui/wui/editor/editor.js
  var WUI_EDITOR_CLASS = "wui_editor";
  var WUI_EDITOR_CLASS_LINE_NUMBER = "wui_editor_line_number";
  var WUI_EDITOR_CLASS_CONTENT = "wui_editor_content";
  var WuiEditor = class {
    constructor(opts) {
      this.opts = opts;
      this.content = "";
      this.totalLine = 0;
      this.elLineNumber = document.createElement("div");
      this.elContent = document.createElement("div");
      this.isKeyControl = false;
      this.id = opts.id;
      this.isEditable = opts.isEditable;
      const el = document.getElementById(opts.id);
      if (!el) {
        console.error("WuiEditor: element ID not found:", opts.id);
        return;
      }
      this.el = el;
      this.initStyle();
      this.initLineNumber();
      this.initContent();
      this.el.classList.add(WUI_EDITOR_CLASS);
    }
    // getContent return content of file.
    getContent() {
      let content = "";
      let el;
      let line;
      this.elContent.childNodes.forEach((node) => {
        switch (node.nodeType) {
          case Node.ELEMENT_NODE:
            el = node;
            line = el.innerText;
            break;
          case Node.TEXT_NODE:
            line = node.nodeValue || "";
            break;
        }
        line = line.trimEnd();
        content += line + "\n";
      });
      content = content.trim();
      return content;
    }
    // open the node for editing.
    // The content MUST be encoded in base64.
    open(node) {
      this.content = atob(node.content);
      this.content = this.content.replace("\r\n", "\n");
      this.render(this.content);
    }
    setEditable(yes) {
      this.isEditable = yes;
      if (yes) {
        this.elContent.setAttribute("contenteditable", "true");
      } else {
        this.elContent.setAttribute("contenteditable", "false");
      }
    }
    addNewLine() {
      this.totalLine++;
      const elLine = document.createElement("div");
      elLine.innerText = `${this.totalLine}`;
      this.elLineNumber.appendChild(elLine);
    }
    initLineNumber() {
      this.elLineNumber.classList.add(WUI_EDITOR_CLASS_LINE_NUMBER);
      this.el.appendChild(this.elLineNumber);
    }
    initContent() {
      if (this.opts.isEditable) {
        this.elContent.setAttribute("contenteditable", "true");
        this.elContent.setAttribute("spellcheck", "false");
        this.elContent.addEventListener("paste", (ev) => {
          var _a;
          ev.preventDefault();
          let text = ((_a = ev.clipboardData) === null || _a === void 0 ? void 0 : _a.getData("text/plain")) || "";
          if (!text) {
            console.error(`on paste: text is ${text}`);
            return;
          }
          const selection = window.getSelection();
          if (!selection || !selection.rangeCount) {
            console.error(`on paste: failed to get selection`);
            return;
          }
          text = text.trimEnd();
          selection.deleteFromDocument();
          selection.getRangeAt(0).insertNode(document.createTextNode(text));
          selection.collapseToEnd();
          this.renderLineNumber(this.getContent());
        });
        this.elContent.onkeydown = (ev) => {
          this.onKeydownDocument(this, ev);
        };
        this.elContent.onkeyup = (ev) => {
          this.onKeyupDocument(this, ev);
        };
      }
      this.elContent.classList.add(WUI_EDITOR_CLASS_CONTENT);
      this.el.appendChild(this.elContent);
    }
    initStyle() {
      const style = document.createElement("style");
      style.type = "text/css";
      style.innerText = `
      [contenteditable] {
        outline: 0px solid transparent;
      }
      .${WUI_EDITOR_CLASS} {
        background-color: cornsilk;
        border: 1px solid brown;
        font-family: monospace;
        line-height: 1.6em;
        overflow-y: scroll;
        width: 100%;
      }
      .${WUI_EDITOR_CLASS_LINE_NUMBER} {
        background-color: bisque;
        border-right: 1px dashed brown;
        color: dimgrey;
        display: inline-block;
        font-family: monospace;
        margin-right: 8px;
        padding: 0px 8px;
        position: sticky;
        text-align: right;
        width: 3em;
      }
      .${WUI_EDITOR_CLASS_CONTENT} {
        display: inline-block;
        padding: 0px 8px;
        vertical-align: top;
        white-space: pre;
        width: calc(100% - 10em);
        word-wrap: normal;
      }
    `;
      document.head.appendChild(style);
    }
    onKeydownDocument(ed, ev) {
      switch (ev.key) {
        case "Control":
          ed.isKeyControl = true;
          break;
        case "Enter":
          if (ed.isKeyControl) {
            ev.preventDefault();
            ev.stopPropagation();
            if (ed.opts.onSave) {
              const content = ed.getContent();
              ed.opts.onSave(content);
              ed.render(content);
            }
            return false;
          }
          this.addNewLine();
          return false;
      }
      return true;
    }
    onKeyupDocument(ed, ev) {
      switch (ev.key) {
        case "Control":
          ed.isKeyControl = false;
          return true;
      }
      return true;
    }
    render(content) {
      const lines = content.split("\n");
      this.elContent.innerText = "";
      this.elLineNumber.innerText = "";
      lines.forEach((line, x) => {
        const el = document.createElement("div");
        el.innerText = `${x + 1}`;
        this.elLineNumber.appendChild(el);
        const div = document.createElement("div");
        div.innerText = line;
        if (line == "") {
          div.appendChild(document.createElement("br"));
        }
        this.elContent.appendChild(div);
      });
      this.totalLine = lines.length;
    }
    renderLineNumber(content) {
      const lines = content.split("\n");
      this.elLineNumber.innerText = "";
      lines.forEach((_, x) => {
        const el = document.createElement("div");
        el.innerText = `${x + 1}`;
        this.elLineNumber.appendChild(el);
      });
      this.totalLine = lines.length;
    }
  };

  // _wui/wui/notif/notif.js
  var WUI_NOTIF_ID = "wui_notif";
  var WUI_NOTIF_CLASS_INFO = "wui_notif_info";
  var WUI_NOTIF_CLASS_ERROR = "wui_notif_error";
  var WuiNotif = class {
    constructor() {
      this.timeout = 5e3;
      this.el = document.createElement("div");
      this.el.id = WUI_NOTIF_ID;
      document.body.appendChild(this.el);
      this.initStyle();
    }
    // info show the msg as information.
    info(msg) {
      const item = document.createElement("div");
      item.innerHTML = msg;
      item.classList.add(WUI_NOTIF_CLASS_INFO);
      this.el.appendChild(item);
      setTimeout(() => {
        this.el.removeChild(item);
      }, this.timeout);
    }
    // error show the msg as an error.
    error(msg) {
      const item = document.createElement("div");
      item.innerHTML = msg;
      item.classList.add(WUI_NOTIF_CLASS_ERROR);
      this.el.appendChild(item);
      setTimeout(() => {
        this.el.removeChild(item);
      }, this.timeout);
    }
    initStyle() {
      const style = document.createElement("style");
      style.type = "text/css";
      style.innerText = `
			#${WUI_NOTIF_ID} {
				left: 10%;
				position: fixed;
				top: 1em;
				width: 80%;
				z-index: 10000;
			}
			.${WUI_NOTIF_CLASS_INFO} {
				border: 1px solid silver;
				background-color: honeydew;
				margin-bottom: 1em;
				padding: 1em;
			}
			.${WUI_NOTIF_CLASS_ERROR} {
				border: 1px solid salmon;
				background-color: lightsalmon;
				margin-bottom: 1em;
				padding: 1em;
			}
		`;
      document.head.appendChild(style);
    }
  };

  // _wui/wui/vfs/vfs.js
  var CLASS_VFS_PATH = "wui_vfs_path";
  var CLASS_VFS_LIST = "wui_vfs_list";
  var WuiVfs = class {
    constructor(opts) {
      this.opts = opts;
      const el = document.getElementById(opts.id);
      if (!el) {
        console.error("WuiVfs: element id", opts.id, "not found");
        return;
      }
      this.el = el;
      this.com_path = new WuiVfsPath((path) => {
        this.openDir(path);
      });
      this.el.appendChild(this.com_path.el);
      this.com_list = new WuiVfsList((node) => {
        this.openNode(node);
      });
      this.el.appendChild(this.com_list.el);
    }
    // filter the VFS list based on text value.
    filter(text) {
      this.com_list.filter(text);
    }
    // openNode is a handler that will be called when a node is clicked
    // inside the WuiVfsList.
    openNode(node) {
      if (node.is_dir) {
        this.openDir(node.path);
      } else {
        this.opts.openNode(node);
      }
    }
    // openDir is a handler that will be called when a path is clicked
    // inside the WuiVfsPath.
    async openDir(path) {
      const res = await this.opts.open(path, true);
      if (res.code != 200) {
        return;
      }
      this.set(res.data);
    }
    set(node) {
      if (node.is_dir) {
        this.com_path.open(node);
        this.com_list.open(node);
      }
    }
  };
  var WuiVfsList = class {
    constructor(onClick) {
      this.onClick = onClick;
      this.node = null;
      this.el = document.createElement("div");
      this.el.classList.add(CLASS_VFS_LIST);
      this.el.style.borderWidth = "1px";
      this.el.style.borderStyle = "solid";
      this.el.style.borderColor = "silver";
    }
    // filter re-render the list by including only the node that have name
    // match with "text".
    filter(text) {
      const regexp = new RegExp(text, "i");
      for (const elChild of this.el.children) {
        if (regexp.test(elChild.innerHTML)) {
          elChild.removeAttribute("hidden");
        } else {
          elChild.setAttribute("hidden", "true");
        }
      }
    }
    open(node) {
      this.node = node;
      this.el.innerHTML = "";
      if (!this.node) {
        return;
      }
      if (!this.node.childs) {
        return;
      }
      for (const c of this.node.childs) {
        const el = document.createElement("div");
        el.style.padding = "1em";
        el.style.cursor = "pointer";
        el.setAttribute("tabindex", "0");
        el.innerText = c.name;
        if (c.is_dir) {
          el.innerText += "/";
          el.style.backgroundColor = "cornsilk";
        }
        el.onclick = () => {
          this.onClick(c);
        };
        el.onkeydown = (ev) => {
          if (ev.key !== "Enter") {
            return true;
          }
          this.onClick(c);
          this.el.focus();
          return false;
        };
        el.onblur = () => {
          this.onBlur(c, el);
        };
        el.onmouseout = () => {
          this.onBlur(c, el);
        };
        el.onfocus = () => {
          this.onFocus(el);
        };
        el.onmouseover = () => {
          this.onFocus(el);
        };
        this.el.appendChild(el);
      }
    }
    onBlur(c, el) {
      if (c.is_dir) {
        el.style.backgroundColor = "cornsilk";
      } else {
        el.style.backgroundColor = "white";
      }
    }
    onFocus(el) {
      el.style.backgroundColor = "aliceblue";
    }
  };
  var WuiVfsPath = class {
    constructor(onClick) {
      this.el = document.createElement("div");
      this.el.classList.add(CLASS_VFS_PATH);
      this.el.style.borderWidth = "1px";
      this.el.style.borderStyle = "solid";
      this.el.style.borderColor = "silver";
      this.el.style.overflow = "auto";
      this.el.style.padding = "10px 10px 20px 0px";
      this.el.style.whiteSpace = "nowrap";
      this.onClick = onClick;
    }
    open(node) {
      this.el.innerHTML = "";
      let paths = [];
      if (node.path == "/") {
        paths.push(node.path);
      } else {
        paths = node.path.split("/");
      }
      paths.forEach((path, x) => {
        let fullPath = "";
        let p = "";
        if (x == 0) {
          p = "/";
          fullPath = "/";
        } else {
          p = path;
          fullPath = paths.slice(0, x + 1).join("/");
        }
        const crumb = document.createElement("span");
        crumb.style.padding = "1em";
        crumb.style.cursor = "pointer";
        crumb.setAttribute("tabindex", "0");
        crumb.innerHTML = p;
        crumb.onclick = () => {
          this.onClick(fullPath);
        };
        crumb.onkeydown = (ev) => {
          if (ev.key !== "Enter") {
            return true;
          }
          this.onClick(fullPath);
          this.el.focus();
          return false;
        };
        crumb.onmouseout = () => {
          this.onBlur(crumb);
        };
        crumb.onblur = () => {
          this.onBlur(crumb);
        };
        crumb.onmouseover = () => {
          this.onFocus(crumb);
        };
        crumb.onfocus = () => {
          this.onFocus(crumb);
        };
        this.el.appendChild(crumb);
      });
    }
    onBlur(crumb) {
      crumb.style.backgroundColor = "white";
    }
    onFocus(crumb) {
      crumb.style.backgroundColor = "aliceblue";
    }
  };

  // _wui/awwan.ts
  var ID_AWWAN_NAV_LEFT = "awwan_nav_left";
  var ID_VFS_INPUT = "com_vfs_input";
  var ID_BTN_NEW_DIR = "com_btn_new_dir";
  var ID_BTN_NEW_FILE = "com_btn_new_file";
  var ID_BTN_REMOVE = "com_btn_remove";
  var ID_VFS = "com_vfs";
  var ID_VFS_PATH = "vfs_path";
  var ID_COM_RESIZE_VFS = "com_resize_vfs";
  var ID_AWWAN_NAV_RIGHT = "awwan_nav_right";
  var ID_BTN_SAVE = "com_btn_save";
  var ID_BTN_DECRYPT = "com_btn_decrypt";
  var ID_BTN_ENCRYPT = "com_btn_encrypt";
  var ID_EDITOR = "com_editor";
  var CLASS_AWWAN_EXECUTE = "awwan_execute";
  var ID_INP_LINE_RANGE = "com_inp_line_range";
  var ID_BTN_EXEC_LOCAL = "com_btn_local";
  var ID_BTN_EXEC_REMOTE = "com_btn_remote";
  var ID_COM_RESIZE_EDITOR = "com_resize_editor";
  var ID_OUTPUT_WRAPPER = "output_wrapper";
  var ID_OUTPUT = "output";
  var MAX_FILE_SIZE = 1e6;
  function renderHtml() {
    const el = document.createElement("div");
    el.classList.add("awwan");
    el.innerHTML = `
      <div id="${ID_AWWAN_NAV_LEFT}" class="awwan_nav_left">
        <div class="awwan_vfs_form">
          <div class="${ID_VFS_INPUT}">
            <input id="${ID_VFS_INPUT}" placeholder="Input text to filter (allow regexp)" />
          </div>
          <button id="${ID_BTN_NEW_DIR}">New dir.</button>
          <button id="${ID_BTN_NEW_FILE}">New file</button>
          <button id="${ID_BTN_REMOVE}">Remove</button>
        </div>
        <div id="${ID_VFS}"></div>
      </div>
      <div id="${ID_COM_RESIZE_VFS}"></div>
      <div id="${ID_AWWAN_NAV_RIGHT}">
        <div class="awwan_file">
          <span class="tag">File</span>
          <span class="awwan_file_actions">
            <span id="${ID_VFS_PATH}">-</span>
            <button id="${ID_BTN_SAVE}" disabled="true">Save</button>
            <button id="${ID_BTN_ENCRYPT}" disabled="true">Encrypt</button>
            <button id="${ID_BTN_DECRYPT}" disabled="true">Decrypt</button>
          </span>
        </div>
        <div id="${ID_EDITOR}"></div>
        <div id="${ID_COM_RESIZE_EDITOR}"></div>
        <div id="${ID_OUTPUT_WRAPPER}" class="output">
          <div>
            <div class="${CLASS_AWWAN_EXECUTE}">
              Execute line
              <input id="${ID_INP_LINE_RANGE}" placeholder="Ex: 1,2-4,5-"/>
              on
              <button id="${ID_BTN_EXEC_LOCAL}" disabled="true">Local</button>
              or
              <button id="${ID_BTN_EXEC_REMOTE}" disabled="true">Remote</button>
              &nbsp;
              <a href="/doc/awwan.html#command__local__and__play_" target="_blank">
                &#x2139;
              </a>
            </div>
          </div>
          <div id="${ID_OUTPUT}"></div>
        </div>
      </div>
    `;
    document.body.appendChild(el);
  }
  var Awwan = class {
    constructor() {
      this.currentNode = null;
      this.request = {
        mode: "local",
        script: "",
        content: "",
        line_range: ""
      };
      this.orgContent = "";
      this._posx = 0;
      this._posy = 0;
      let el;
      el = document.getElementById(ID_AWWAN_NAV_LEFT);
      if (el) {
        this.comNavLeft = el;
      }
      el = document.getElementById(ID_AWWAN_NAV_RIGHT);
      if (el) {
        this.comNavRight = el;
      }
      el = document.getElementById(ID_COM_RESIZE_VFS);
      if (el) {
        const doResizeVfs = (ev) => this.doResizeVfs(ev);
        el.addEventListener("mousedown", () => {
          this._posx = 0;
          document.addEventListener("mousemove", doResizeVfs);
        });
        document.addEventListener("mouseup", () => {
          document.removeEventListener("mousemove", doResizeVfs);
          this._posx = 0;
        });
      }
      el = document.getElementById(ID_BTN_EXEC_LOCAL);
      if (el) {
        this.comBtnLocal = el;
        this.comBtnLocal.onclick = () => {
          this.execLocal();
        };
      }
      el = document.getElementById(ID_BTN_EXEC_REMOTE);
      if (el) {
        this.comBtnRemote = el;
        this.comBtnRemote.onclick = () => {
          this.execRemote();
        };
      }
      el = document.getElementById(ID_BTN_NEW_DIR);
      if (el) {
        this.comBtnNewDir = el;
        this.comBtnNewDir.onclick = () => {
          this.newNode(true);
        };
      }
      el = document.getElementById(ID_BTN_NEW_FILE);
      if (el) {
        this.comBtnNewFile = el;
        this.comBtnNewFile.onclick = () => {
          this.newNode(false);
        };
      }
      el = document.getElementById(ID_BTN_REMOVE);
      if (el) {
        this.comBtnRemove = el;
        this.comBtnRemove.onclick = () => {
          this.onClickRemove();
        };
      }
      el = document.getElementById(ID_BTN_SAVE);
      if (el) {
        this.comBtnSave = el;
        this.comBtnSave.onclick = () => {
          this.onClickSave();
        };
      }
      el = document.getElementById(ID_BTN_ENCRYPT);
      if (el) {
        this.comBtnEncrypt = el;
        this.comBtnEncrypt.onclick = () => {
          this.onClickEncrypt();
        };
      }
      el = document.getElementById(ID_BTN_DECRYPT);
      if (el) {
        this.comBtnDecrypt = el;
        this.comBtnDecrypt.onclick = () => {
          this.onClickDecrypt();
        };
      }
      el = document.getElementById(ID_INP_LINE_RANGE);
      if (!el) {
        console.error(`failed to get element by ID #${ID_INP_LINE_RANGE}`);
        return;
      }
      this.comInputLineRange = el;
      el = document.getElementById(ID_VFS_INPUT);
      if (el) {
        this.comVfsInput = el;
        this.comVfsInput.oninput = () => {
          this.onVfsInputFilter(this.comVfsInput.value);
        };
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
      const editorOpts = {
        id: ID_EDITOR,
        isEditable: true,
        onSave: (content) => {
          this.editorOnSave(content);
        }
      };
      this.editor = new WuiEditor(editorOpts);
      el = document.getElementById(ID_EDITOR);
      if (el) {
        this.comEditor = el;
      }
      this.notif = new WuiNotif();
      const vfsOpts = {
        id: ID_VFS,
        open: (path, isDir) => {
          return this.open(path, isDir);
        },
        openNode: (node) => {
          return this.openNode(node);
        }
      };
      this.vfs = new WuiVfs(vfsOpts);
      window.onhashchange = (ev) => {
        ev.preventDefault();
        const hashchange = ev;
        const url = new URL(hashchange.newURL);
        this.onHashChange(url.hash);
      };
      const elResizeEditor = document.getElementById(ID_COM_RESIZE_EDITOR);
      if (elResizeEditor) {
        const doResizeEditor = (ev) => this.doResizeEditor(ev);
        elResizeEditor.addEventListener("mousedown", () => {
          this._posy = 0;
          document.addEventListener("mousemove", doResizeEditor);
        });
        document.addEventListener("mouseup", () => {
          document.removeEventListener("mousemove", doResizeEditor);
          this._posy = 0;
        });
      }
    }
    onHashChange(hash) {
      if (hash === "") {
        hash = "#/";
      }
      hash = hash.substring(1);
      this.vfs.openDir(hash);
    }
    // confirmWhenDirty check if the editor content has changes before opening
    // new file.
    // If yes, display dialog box to confirm whether continuing opening file
    // or cancel it.
    // It will return true to continue opening file or false if user wants to
    // cancel it.
    confirmWhenDirty() {
      if (this.request.script === "") {
        return true;
      }
      const newContent = this.editor.getContent();
      if (this.orgContent == newContent) {
        return true;
      }
      return window.confirm("File has changes, continue without save?");
    }
    // open fetch the node content from remote server.
    async open(path, isDir) {
      const httpRes = await fetch("/awwan/api/fs?path=" + path);
      const res = await httpRes.json();
      if (res.code != 200) {
        this.notif.error(`Failed to open ${path}: ${res.message}`);
        return res;
      }
      const node = res.data;
      if (isDir) {
        this.currentNode = node;
        window.location.hash = "#" + path;
        this.comVfsInput.value = "";
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
      this.orgContent = this.editor.getContent();
      this.comBtnLocal.disabled = false;
      this.comBtnRemote.disabled = false;
      this.comBtnSave.disabled = false;
      if (path.endsWith(".vault")) {
        this.comBtnDecrypt.disabled = false;
        this.comBtnEncrypt.disabled = true;
        this.editor.setEditable(false);
      } else {
        this.comBtnDecrypt.disabled = true;
        this.comBtnEncrypt.disabled = false;
        this.editor.setEditable(true);
      }
      return res;
    }
    // openNode is an handler that will called when user click on of the
    // item in the list.
    async openNode(node) {
      let res = this.isEditAllowed(node);
      if (res.code != 200) {
        this.notif.error(res.message);
        return res;
      }
      if (!node.is_dir) {
        const ok = this.confirmWhenDirty();
        if (!ok) {
          return res;
        }
      }
      res = await this.open(node.path, node.is_dir);
      return res;
    }
    isEditAllowed(node) {
      const res = {
        code: 412,
        message: ""
      };
      if (node.size && node.size > MAX_FILE_SIZE) {
        res.message = `The file "${node.name}" with size ${node.size / 1024}KB is greater than maximum ${MAX_FILE_SIZE / 1e3}KB.`;
        return res;
      }
      res.code = 200;
      return res;
    }
    async onClickEncrypt() {
      if (this.request.script == "") {
        this.notif.error("No file selected");
        return;
      }
      const ok = this.confirmWhenDirty();
      if (!ok) {
        return false;
      }
      const path = this.request.script;
      const req = {
        path,
        path_vault: ""
      };
      const httpRes = await fetch("/awwan/api/encrypt", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(req)
      });
      const jsonRes = await httpRes.json();
      if (jsonRes.code != 200) {
        this.notif.error(`Failed to encrypt file ${path}: ${jsonRes.message}`);
        return false;
      }
      const encRes = jsonRes.data;
      this.notif.info(`File ${path} has been encrypted to ${encRes.path_vault}.`);
      if (this.currentNode) {
        this.open(this.currentNode.path, this.currentNode.is_dir);
      }
      return true;
    }
    async onClickDecrypt() {
      if (this.request.script == "") {
        this.notif.error("No file selected");
        return false;
      }
      const pathVault = this.request.script;
      const req = {
        path: "",
        path_vault: pathVault
      };
      const httpRes = await fetch("/awwan/api/decrypt", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(req)
      });
      const jsonRes = await httpRes.json();
      if (jsonRes.code != 200) {
        this.notif.error(
          `Failed to decrypt file ${pathVault}: ${jsonRes.message}`
        );
        return false;
      }
      const encRes = jsonRes.data;
      this.notif.info(`File ${pathVault} has been decrypted to ${encRes.path}.`);
      if (this.currentNode) {
        this.open(this.currentNode.path, this.currentNode.is_dir);
      }
      return true;
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
    editorOnSave(content) {
      this.doSaveFile(this.request.script, content);
    }
    async doSaveFile(path, content) {
      const req = {
        path,
        content: btoa(content)
      };
      const httpRes = await fetch("/awwan/api/fs", {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(req)
      });
      const res = await httpRes.json();
      if (res.code != 200) {
        this.notif.error(`Failed to save file ${path}: ${res.message}`);
        return null;
      }
      this.notif.info(`File ${path} has been saved.`);
      const node = res.data;
      this.editor.open(node);
      this.orgContent = this.editor.getContent();
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
    async httpApiExecute(mode, lineRange) {
      this.comOutput.innerText = "";
      this.request.mode = mode;
      this.request.content = btoa(this.editor.getContent());
      this.request.line_range = lineRange;
      const httpRes = await fetch("/awwan/api/execute", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(this.request)
      });
      const res = await httpRes.json();
      if (res.code != 200) {
        this.notif.error(`Execute failed: ${res.message}`);
        return;
      }
      if (res.data.output) {
        this.comOutput.innerText = atob(res.data.output);
      }
      if (res.data.error) {
        this.notif.error(res.data.error);
      } else {
        this.notif.info(
          `Successfully execute ${this.request.script} on ${mode}.`
        );
      }
    }
    async newNode(isDir) {
      if (!this.currentNode) {
        this.notif.error("No active directory loaded or selected.");
        return;
      }
      const name = this.comVfsInput.value;
      if (name === "") {
        this.notif.error("Empty file name");
        return;
      }
      const req = {
        path: this.currentNode.path + "/" + name,
        name,
        is_dir: isDir,
        content_type: "",
        mod_time: 0,
        size: 0,
        mode: "",
        childs: [],
        content: ""
      };
      const httpRes = await fetch("/awwan/api/fs", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(req)
      });
      const res = await httpRes.json();
      if (res.code != 200) {
        this.notif.error(`newNode: ${res.message}`);
        return;
      }
      const node = res.data;
      if (!this.currentNode.childs) {
        this.currentNode.childs = [];
      }
      this.currentNode.childs.push(node);
      this.vfs.set(this.currentNode);
    }
    async onClickRemove() {
      console.log("onClickRemove: ", this.currentNode);
      if (!this.currentNode) {
        this.notif.error("No file selected.");
        return;
      }
      const name = this.comVfsInput.value;
      if (name === "") {
        this.notif.error("Empty file name");
        return;
      }
      const req = {
        path: this.currentNode.path + "/" + name,
        is_dir: false,
        content: ""
      };
      const httpRes = await fetch("/awwan/api/fs", {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(req)
      });
      const res = await httpRes.json();
      if (res.code != 200) {
        this.notif.error(`remove: ${res.message}`);
        return;
      }
      this.notif.info(`${res.message}`);
      this.vfs.openDir(this.currentNode.path);
    }
    // onVfsInputFilter filter the VFS list based on input val.
    onVfsInputFilter(val) {
      this.vfs.filter(val);
    }
    doResizeVfs(ev) {
      ev.preventDefault();
      if (this._posx == 0) {
        this._posx = ev.clientX;
        return false;
      }
      const diff = this._posx - ev.clientX;
      if (diff > 0) {
        this.resizeVfsLeft(diff);
      } else {
        this.resizeVfsRight(diff * -1);
      }
      this._posx = ev.clientX;
      return false;
    }
    resizeVfsLeft(diff) {
      if (this.comNavLeft.clientWidth <= 300) {
        return false;
      }
      let width = this.comNavLeft.clientWidth - diff;
      this.comNavLeft.style.width = `${width}px`;
      width += 30;
      this.comNavRight.style.width = `calc(100% - ${width}px)`;
      return true;
    }
    resizeVfsRight(diff) {
      if (this.comNavRight.clientWidth <= 500) {
        return false;
      }
      let width = this.comNavLeft.clientWidth + diff;
      this.comNavLeft.style.width = `${width}px`;
      width += 30;
      this.comNavRight.style.width = `calc(100% - ${width}px)`;
      return true;
    }
    doResizeEditor(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if (this._posy == 0) {
        this._posy = ev.clientY;
        return false;
      }
      const diff = this._posy - ev.clientY;
      if (diff > 0) {
        this.resizeUp(diff);
      } else {
        this.resizeDown(diff * -1);
      }
      this._posy = ev.clientY;
      return true;
    }
    resizeUp(diff) {
      if (this.comEditor.clientHeight <= 126) {
        return;
      }
      let height = this.comEditor.clientHeight - diff;
      this.comEditor.style.height = `${height}px`;
      height += 100;
      this.comOutputWrapper.style.height = `calc(100% - ${height}px)`;
    }
    resizeDown(diff) {
      if (this.comOutputWrapper.clientHeight <= 126) {
        return;
      }
      let height = this.comEditor.clientHeight + diff;
      this.comEditor.style.height = `${height}px`;
      height += 100;
      this.comOutputWrapper.style.height = `calc(100% - ${height}px)`;
    }
  };

  // _wui/main.ts
  renderHtml();
  var awwan = new Awwan();
  awwan.onHashChange(window.location.hash);
})();
