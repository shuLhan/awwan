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
        if (line == "\n") {
          content += line;
        } else {
          content += line + "\n";
        }
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
          const text = (_a = ev.clipboardData) === null || _a === void 0 ? void 0 : _a.getData("text/plain");
          document.execCommand("insertText", false, text);
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
        font-family: monospace;
        float: left;
        left: 0px;
        margin-right: 8px;
        padding: 0px 8px;
        position: sticky;
        text-align: right;
        width: 3em;
      }
      .${WUI_EDITOR_CLASS_CONTENT} {
        // Do not use "float: left" to fix line break.
        display: inline-block;
        padding: 0px 8px;
        white-space: pre;
        width: calc(100% - 6em);
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
      const res2 = await this.opts.open(path, true);
      if (res2.code != 200) {
        return;
      }
      this.set(res2.data);
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
  var CLASS_EDITOR_ACTION = "editor_action";
  var ID_BTN_ENCRYPT = "com_btn_encrypt";
  var ID_BTN_EXEC_LOCAL = "com_btn_local";
  var ID_BTN_EXEC_REMOTE = "com_btn_remote";
  var ID_BTN_NEW_DIR = "com_btn_new_dir";
  var ID_BTN_NEW_FILE = "com_btn_new_file";
  var ID_BTN_REMOVE = "com_btn_remove";
  var ID_BTN_SAVE = "com_btn_save";
  var ID_COM_RESIZE = "com_resize";
  var ID_EDITOR = "com_editor";
  var ID_INP_LINE_RANGE = "com_inp_line_range";
  var ID_VFS_INPUT = "com_vfs_input";
  var ID_VFS = "com_vfs";
  var ID_VFS_PATH = "vfs_path";
  var ID_OUTPUT = "output";
  var ID_OUTPUT_WRAPPER = "output_wrapper";
  var MAX_FILE_SIZE = 3e6;
  function renderHtml() {
    const el = document.createElement("div");
    el.classList.add("awwan");
    el.innerHTML = `
      <div class="awwan_nav_left">
        <div class="${ID_VFS_INPUT}">
          <input id="${ID_VFS_INPUT}" placeholder="Input text to filter (allow regexp)" />
        </div>
        <button id="${ID_BTN_NEW_DIR}">New dir.</button>
        <button id="${ID_BTN_NEW_FILE}">New file</button>
        <button id="${ID_BTN_REMOVE}">Remove</button>
        <div id="${ID_VFS}"></div>
      </div>
      <div class="awwan_content">
        <div class="boxheader">
          <span class="tag">File</span>
          <span id="${ID_VFS_PATH}">-</span>
          <button id="${ID_BTN_SAVE}" disabled="true">Save</button>
          <button id="${ID_BTN_ENCRYPT}" disabled="true">Encrypt</button>
        </div>
        <div id="${ID_EDITOR}"></div>
        <div id="${ID_COM_RESIZE}">&#9868;</div>
        <div id="${ID_OUTPUT_WRAPPER}" class="output">
          <div>
            <div class="${CLASS_EDITOR_ACTION}">
              Execute
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
      // currentFile store the selected file node opened in editor.
      this.currentFile = null;
      this.request = {
        mode: "local",
        script: "",
        content: "",
        line_range: ""
      };
      this.orgContent = "";
      this._posy = 0;
      let el = document.getElementById(ID_BTN_EXEC_LOCAL);
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
      const elResize = document.getElementById(ID_COM_RESIZE);
      if (elResize) {
        const onMouseMove = (ev) => this.doResize(ev);
        elResize.addEventListener("mousedown", () => {
          this._posy = 0;
          document.addEventListener("mousemove", onMouseMove);
        });
        document.addEventListener("mouseup", () => {
          document.removeEventListener("mousemove", onMouseMove);
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
      const res2 = await httpRes.json();
      if (res2.code != 200) {
        this.notif.error(`Failed to open ${path}: ${res2.message}`);
        return res2;
      }
      const node = res2.data;
      if (isDir) {
        this.currentNode = node;
        window.location.hash = "#" + path;
        this.comVfsInput.value = "";
        return res2;
      }
      const resAllow = this.isEditAllowed(node);
      if (resAllow.code != 200) {
        this.notif.error(resAllow.message);
        return resAllow;
      }
      this.comFilePath.innerText = path;
      this.request.script = path;
      this.editor.open(node);
      this.currentFile = node;
      this.orgContent = this.editor.getContent();
      this.comBtnLocal.disabled = false;
      this.comBtnRemote.disabled = false;
      this.comBtnSave.disabled = false;
      this.comBtnEncrypt.disabled = false;
      return res2;
    }
    // openNode is an handler that will called when user click on of the
    // item in the list.
    async openNode(node) {
      let res2 = this.isEditAllowed(node);
      if (res2.code != 200) {
        this.notif.error(res2.message);
        return res2;
      }
      if (!node.is_dir) {
        const ok = this.confirmWhenDirty();
        if (!ok) {
          return res2;
        }
      }
      res2 = await this.open(node.path, node.is_dir);
      return res2;
    }
    isEditAllowed(node) {
      const res2 = {
        code: 412,
        message: ""
      };
      let isTypeAllowed = false;
      if (node.content_type && (node.content_type.indexOf("json") >= 0 || node.content_type.indexOf("message") >= 0 || node.content_type.indexOf("octet-stream") >= 0 || node.content_type.indexOf("script") >= 0 || node.content_type.indexOf("text") >= 0 || node.content_type.indexOf("xml") >= 0)) {
        isTypeAllowed = true;
      }
      if (!isTypeAllowed) {
        res2.message = `The file "${node.name}" with content type "${node.content_type}" is not allowed to be opened`;
        return res2;
      }
      if (node.size && node.size > MAX_FILE_SIZE) {
        res2.message = `The file "${node.name}" with size ${node.size / 1e6}MB is greater than maximum ${MAX_FILE_SIZE / 1e6}MB.`;
        return res2;
      }
      res2.code = 200;
      return res2;
    }
    async onClickEncrypt() {
      if (this.request.script == "") {
        this.notif.error("No file selected");
        return;
      }
      const ok = this.confirmWhenDirty();
      if (!ok) {
        return res;
      }
      const path = this.request.script;
      const req = {
        path
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
        return null;
      }
      const encRes = jsonRes.data;
      this.notif.info(`File ${path} has been encrypted to ${encRes.path_vault}.`);
      const nodeVault = {
        path: this.currentNode.path + "/" + this.currentFile.name,
        name: this.currentFile.name + ".vault",
        is_dir: false,
        content_type: "",
        mod_time: 0,
        size: 0,
        mode: "",
        childs: [],
        content: ""
      };
      this.currentNode.childs.push(nodeVault);
      this.vfs.set(this.currentNode);
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
      const res2 = await httpRes.json();
      if (res2.code != 200) {
        this.notif.error(`Failed to save file ${path}: ${res2.message}`);
        return null;
      }
      this.notif.info(`File ${path} has been saved.`);
      this.orgContent = content;
      const node = res2.data;
      this.editor.open(node);
      return res2;
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
      const res2 = await httpRes.json();
      if (res2.code != 200) {
        this.notif.error(`Execute failed: ${res2.message}`);
        return;
      }
      if (res2.data.output) {
        this.comOutput.innerText = atob(res2.data.output);
      }
      if (res2.data.error) {
        this.notif.error(res2.data.error);
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
      const res2 = await httpRes.json();
      if (res2.code != 200) {
        this.notif.error(`newNode: ${res2.message}`);
        return;
      }
      const node = res2.data;
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
      const res2 = await httpRes.json();
      if (res2.code != 200) {
        this.notif.error(`remove: ${res2.message}`);
        return;
      }
      this.notif.info(`${res2.message}`);
      this.vfs.openDir(this.currentNode.path);
    }
    // onVfsInputFilter filter the VFS list based on input val.
    onVfsInputFilter(val) {
      this.vfs.filter(val);
    }
    doResize(ev) {
      if (this._posy == 0) {
        this._posy = ev.screenY;
        return true;
      }
      const diff = this._posy - ev.screenY;
      if (diff > 0) {
        this.resizeUp(diff);
      } else if (diff < 0) {
        this.resizeDown(diff * -1);
      }
      this._posy = ev.screenY;
      return true;
    }
    resizeUp(diff) {
      if (this.comEditor.clientHeight <= 126) {
        return;
      }
      this.comEditor.style.height = `${this.comEditor.clientHeight - diff}px`;
      this.comOutputWrapper.style.height = `${this.comOutputWrapper.clientHeight + diff}px`;
    }
    resizeDown(diff) {
      if (this.comOutputWrapper.clientHeight <= 126) {
        return;
      }
      this.comEditor.style.height = `${this.comEditor.clientHeight + diff}px`;
      this.comOutputWrapper.style.height = `${this.comOutputWrapper.clientHeight - diff}px`;
    }
  };

  // _wui/main.ts
  renderHtml();
  var awwan = new Awwan();
  awwan.onHashChange(window.location.hash);
})();
