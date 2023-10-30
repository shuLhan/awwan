"use strict";
var awwan = (() => {
  // _wui/wui/editor/editor.js
  var WUI_EDITOR_CLASS = "wui_editor";
  var WUI_EDITOR_CLASS_LINE = "wui_editor_line";
  var WUI_EDITOR_CLASS_LINE_NUMBER = "wui_editor_line_number";
  var WUI_EDITOR_CLASS_LINE_TEXT = "wui_editor_line_text";
  var WuiEditor = class {
    constructor(opts) {
      this.opts = opts;
      this.lines = [];
      this.range_begin = -1;
      this.range_end = -1;
      this.raw_lines = [];
      this.is_key_control = false;
      this.unre = new WuiEditorUndoRedo();
      this.id = opts.id;
      this.is_editable = opts.is_editable;
      const el = document.getElementById(opts.id);
      if (!el) {
        console.error("WuiEditor: element ID not found:", opts.id);
        return;
      }
      this.el = el;
      this.initStyle();
      this.el.classList.add(WUI_EDITOR_CLASS);
      const sel = window.getSelection();
      if (!sel) {
        console.error("WuiEditor: cannot get window selection", opts.id);
        return;
      }
      this.sel = sel;
      this.range = document.createRange();
      document.onkeydown = (ev) => {
        this.onKeydownDocument(this, ev);
      };
      document.onkeyup = (ev) => {
        this.onKeyupDocument(this, ev);
      };
    }
    // getContent return content of file.
    getContent() {
      let content = "";
      for (let x = 0; x < this.lines.length; x++) {
        if (x > 0) {
          content += "\n";
        }
        content += this.lines[x].elText.innerText;
      }
      return content;
    }
    getSelectionRange() {
      return {
        begin_at: this.range_begin,
        end_at: this.range_end
      };
    }
    onClickText() {
      const sel = window.getSelection();
      if (sel) {
        this.sel = sel;
      }
    }
    onKeyup(x, ev) {
      let elTextCurr;
      let elTextPrev;
      let textBefore;
      let textAfter;
      let off;
      switch (ev.key) {
        case "Alt":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight":
        case "ArrowUp":
        case "CapsLock":
        case "ContextMenu":
        case "End":
        case "Home":
        case "Insert":
        case "OS":
        case "PageDown":
        case "PageUp":
        case "Pause":
        case "PrintScreen":
        case "ScrollLock":
        case "Shift":
          break;
        case "Backspace":
          ev.preventDefault();
          textBefore = this.raw_lines[x];
          elTextCurr = this.lines[x].elText;
          textAfter = elTextCurr.innerText;
          off = this.sel.focusOffset;
          if (off > 0) {
            this.unre.doUpdate(x, textBefore, textAfter);
            this.raw_lines[x] = textAfter;
            this.setCaret(elTextCurr, off);
            return false;
          }
          elTextPrev = this.lines[x - 1].elText;
          this.unre.doJoin(x - 1, elTextPrev.innerText, elTextCurr.innerText);
          off = elTextPrev.innerText.length;
          elTextPrev.innerText = elTextPrev.innerText + elTextCurr.innerText;
          this.raw_lines[x - 1] = elTextPrev.innerText;
          this.deleteLine(x);
          this.setCaret(elTextPrev, off);
          return false;
        case "Enter":
          ev.preventDefault();
          break;
        default:
          if (this.is_key_control) {
            break;
          }
          this.unre.doUpdate(x, this.raw_lines[x], this.lines[x].elText.innerText);
          this.raw_lines[x] = this.lines[x].elText.innerText;
      }
      return true;
    }
    onKeydownOnLine(x, ev) {
      var _a;
      let textBefore;
      let textAfter;
      let off;
      let elText;
      let elTextCurrent;
      let text;
      let isJoinLineAfter;
      switch (ev.key) {
        case "ArrowUp":
          if (x == 0) {
            return false;
          }
          ev.preventDefault();
          elText = this.lines[x - 1].elText;
          off = this.sel.focusOffset;
          if (off > elText.innerText.length) {
            off = elText.innerText.length;
          }
          this.setCaret(elText, off);
          if (x == 1) {
            this.el.scrollTop = 0;
          } else if (x * 23 < this.el.scrollTop) {
            this.el.scrollTop -= 25;
          }
          return false;
        case "ArrowDown":
          if (x == this.lines.length - 1) {
            return false;
          }
          ev.preventDefault();
          elText = this.lines[x + 1].elText;
          off = this.sel.focusOffset;
          if (off > elText.innerText.length) {
            off = elText.innerText.length;
          }
          this.setCaret(elText, off);
          x += 2;
          if (x * 25 >= this.el.clientHeight + this.el.scrollTop) {
            this.el.scrollTop += 25;
          }
          return false;
        case "Delete":
          ev.preventDefault();
          isJoinLineAfter = false;
          elTextCurrent = this.lines[x].elText;
          off = this.sel.focusOffset;
          textBefore = elTextCurrent.innerText;
          textAfter = "";
          if (textBefore.length === 0 || off === textBefore.length) {
            isJoinLineAfter = true;
          }
          if (isJoinLineAfter) {
            if (x + 1 < this.lines.length) {
              const elTextAfter = this.lines[x + 1].elText;
              textAfter = elTextAfter.innerText;
              elTextAfter.innerText = "";
              this.unre.doJoin(x, textBefore, textAfter);
              this.deleteLine(x + 1);
              textAfter = textBefore + textAfter;
            }
          } else {
            textAfter = textBefore.slice(0, off) + textBefore.slice(off + 1, textBefore.length);
            this.unre.doUpdate(x, textBefore, textAfter);
          }
          this.lines[x].elText.innerText = textAfter;
          this.raw_lines[x] = textAfter;
          this.setCaret(elTextCurrent, off);
          break;
        case "Enter":
          ev.preventDefault();
          elText = this.lines[x].elText;
          off = this.sel.focusOffset;
          text = elText.innerText;
          textBefore = text.slice(0, off);
          textAfter = text.slice(off, text.length);
          this.unre.doSplit(x, textBefore, textAfter);
          elText.innerText = textBefore;
          this.raw_lines[x] = textBefore;
          this.insertNewline(x + 1, textAfter);
          if (x + 3 >= this.raw_lines.length) {
            this.el.scrollTop = this.el.scrollHeight;
          }
          break;
        case "Tab":
          ev.preventDefault();
          elText = (_a = this.lines[x]) === null || _a === void 0 ? void 0 : _a.elText;
          if (!elText) {
            break;
          }
          off = this.sel.focusOffset;
          textBefore = elText.innerText;
          textAfter = textBefore.slice(0, off) + "	" + textBefore.slice(off, textBefore.length);
          this.unre.doUpdate(x, textBefore, textAfter);
          elText.innerText = textAfter;
          this.raw_lines[x] = textAfter;
          this.setCaret(elText, off + 1);
          break;
      }
      return true;
    }
    onMouseDownAtLine(x) {
      this.range_begin = x;
    }
    onMouseUpAtLine(x) {
      var _a, _b, _c;
      this.range_end = x;
      if (this.range_end < this.range_begin) {
        return;
      }
      let y = 0;
      for (; y < this.range_begin; y++) {
        (_a = this.el.children[y]) === null || _a === void 0 ? void 0 : _a.setAttribute("style", "");
      }
      for (; y <= this.range_end; y++) {
        (_b = this.el.children[y]) === null || _b === void 0 ? void 0 : _b.setAttribute("style", "background-color:lightsalmon");
      }
      for (; y < this.el.children.length; y++) {
        (_c = this.el.children[y]) === null || _c === void 0 ? void 0 : _c.setAttribute("style", "");
      }
      if (this.opts.onSelection) {
        this.opts.onSelection(this.range_begin, this.range_end);
      }
    }
    // setEditOff make the content not editable.
    setEditOff() {
      this.lines.forEach((line) => {
        line.setEditOff();
      });
    }
    // setEditOn make the content to be editable.
    setEditOn() {
      this.lines.forEach((line) => {
        line.setEditOn();
      });
    }
    // open the node for editing.
    // The content MUST be encoded in base64.
    open(node) {
      let content = atob(node.content);
      content = content.replace("\r\n", "\n");
      this.raw_lines = content.split("\n");
      this.lines = [];
      this.raw_lines.forEach((rawLine, x) => {
        const line = new WuiEditorLine(x, rawLine, this);
        this.lines.push(line);
      });
      this.render();
    }
    // clearSelection clear selection range indicator.
    clearSelection() {
      var _a;
      if (this.range_begin < 0 || this.range_end == 0) {
        return;
      }
      for (let x = this.range_begin; x <= this.range_end; x++) {
        (_a = this.el.children[x]) === null || _a === void 0 ? void 0 : _a.setAttribute("style", "");
      }
      this.range_begin = -1;
      this.range_end = -1;
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
				font-family: monospace;
				overflow-y: auto;
				width: 100%;
			}
			.${WUI_EDITOR_CLASS_LINE} {
				display: block;
				width: 100%;
			}
			.${WUI_EDITOR_CLASS_LINE_NUMBER} {
				color: dimgrey;
				cursor: pointer;
				display: inline-block;
				padding: 4px 10px 4px 4px;
				text-align: right;
				user-select: none;
				vertical-align: top;
				width: 30px;
			}
			.${WUI_EDITOR_CLASS_LINE_NUMBER}:hover {
				background-color: lightsalmon;
			}
			.${WUI_EDITOR_CLASS_LINE_TEXT} {
				display: inline-block;
				padding: 4px;
				border-color: lightblue;
				border-width: 0px;
				border-style: solid;
				white-space: pre-wrap;
				width: calc(100% - 60px);
			}
		`;
      document.head.appendChild(style);
    }
    doJoin(changes) {
      const line = this.lines[changes.currLine];
      if (!line) {
        return;
      }
      line.elText.innerText = changes.currText;
      this.deleteLine(changes.nextLine);
      this.setCaret(line.elText, 0);
    }
    doSplit(changes) {
      const line = this.lines[changes.currLine];
      if (!line) {
        return;
      }
      line.elText.innerText = changes.currText;
      this.insertNewline(changes.nextLine, changes.nextText);
    }
    doUpdate(changes) {
      const line = this.lines[changes.currLine];
      if (!line) {
        return;
      }
      line.elText.innerText = changes.currText;
      this.setCaret(line.elText, 0);
    }
    doRedo() {
      const act = this.unre.redo();
      if (!act) {
        return;
      }
      switch (act.kind) {
        case "join":
          this.doJoin(act.after);
          break;
        case "split":
          this.doSplit(act.after);
          break;
        case "update":
          this.doUpdate(act.after);
          break;
      }
    }
    doUndo() {
      const act = this.unre.undo();
      if (!act) {
        return;
      }
      switch (act.kind) {
        case "join":
          this.doSplit(act.before);
          break;
        case "split":
          this.doJoin(act.before);
          break;
        case "update":
          this.doUpdate(act.before);
          break;
      }
    }
    deleteLine(x) {
      var _a;
      this.lines.splice(x, 1);
      this.raw_lines.splice(x, 1);
      for (; x < this.lines.length; x++) {
        (_a = this.lines[x]) === null || _a === void 0 ? void 0 : _a.setNumber(x);
      }
      this.render();
    }
    insertNewline(x, text) {
      var _a;
      const newline = new WuiEditorLine(x, text, this);
      for (let y = x; y < this.lines.length; y++) {
        (_a = this.lines[y]) === null || _a === void 0 ? void 0 : _a.setNumber(y + 1);
      }
      this.lines.splice(x, 0, newline);
      this.raw_lines.splice(x, 0, text);
      this.render();
      this.setCaret(newline.elText, 0);
    }
    onKeydownDocument(ed, ev) {
      switch (ev.key) {
        case "Control":
          ed.is_key_control = true;
          return;
        case "r":
          if (ed.is_key_control) {
            ev.preventDefault();
            ed.doRedo();
          }
          return;
        case "s":
          if (ed.is_key_control) {
            ev.preventDefault();
            ev.stopPropagation();
            if (ed.opts.onSave) {
              ed.opts.onSave(ed.getContent());
            }
          }
          return;
        case "z":
          if (ed.is_key_control) {
            ev.preventDefault();
            ed.doUndo();
          }
          return;
      }
    }
    onKeyupDocument(ed, ev) {
      switch (ev.key) {
        case "Control":
          ed.is_key_control = false;
          return;
        case "Escape":
          ev.preventDefault();
          ed.clearSelection();
          return;
      }
    }
    render() {
      this.el.innerHTML = "";
      for (const line of this.lines) {
        this.el.appendChild(line.el);
      }
    }
    setCaret(elText, off) {
      if (elText.firstChild) {
        this.range.setStart(elText.firstChild, off);
      } else {
        this.range.setStart(elText, off);
      }
      this.range.collapse(true);
      this.sel.removeAllRanges();
      this.sel.addRange(this.range);
    }
  };
  var WuiEditorLine = class {
    constructor(x, text, ed) {
      this.x = x;
      this.text = text;
      this.lineNum = 0;
      this.lineNum = x;
      this.el = document.createElement("div");
      this.el.classList.add(WUI_EDITOR_CLASS_LINE);
      this.el_number = document.createElement("span");
      this.el_number.classList.add(WUI_EDITOR_CLASS_LINE_NUMBER);
      this.el_number.innerText = this.lineNum + 1 + "";
      this.el_number.onmousedown = () => {
        ed.onMouseDownAtLine(this.lineNum);
      };
      this.el_number.onmouseup = () => {
        ed.onMouseUpAtLine(this.lineNum);
      };
      this.elText = document.createElement("span");
      this.elText.classList.add(WUI_EDITOR_CLASS_LINE_TEXT);
      this.elText.innerText = text;
      this.elText.contentEditable = "true";
      this.elText.onclick = () => {
        ed.onClickText();
      };
      this.elText.onkeydown = (ev) => {
        return ed.onKeydownOnLine(this.lineNum, ev);
      };
      this.elText.onkeyup = (ev) => {
        return ed.onKeyup(this.lineNum, ev);
      };
      this.elText.addEventListener("paste", (ev) => {
        if (!ev.clipboardData) {
          return;
        }
        ev.preventDefault();
        const text2 = ev.clipboardData.getData("text/plain");
        document.execCommand("insertHTML", false, text2);
      });
      this.el.appendChild(this.el_number);
      this.el.appendChild(this.elText);
    }
    setNumber(x) {
      this.lineNum = x;
      this.el_number.innerText = x + 1 + "";
    }
    setEditOn() {
      this.elText.contentEditable = "true";
    }
    setEditOff() {
      this.elText.contentEditable = "false";
    }
  };
  var WuiEditorUndoRedo = class {
    constructor() {
      this.idx = 0;
      this.actions = [];
    }
    doJoin(prevLine, prevText, currText) {
      const action = {
        kind: "join",
        before: {
          currLine: prevLine,
          currText: prevText,
          nextLine: prevLine + 1,
          nextText: currText
        },
        after: {
          currLine: prevLine,
          currText: prevText + currText,
          nextLine: prevLine + 1,
          nextText: ""
        }
      };
      if (this.actions.length > 0) {
        this.actions = this.actions.slice(0, this.idx);
      }
      this.actions.push(action);
      this.idx++;
    }
    doSplit(currLine, currText, nextText) {
      const action = {
        kind: "split",
        before: {
          currLine,
          currText: currText + nextText,
          nextLine: currLine + 1,
          nextText: ""
        },
        after: {
          currLine,
          currText,
          nextLine: currLine + 1,
          nextText
        }
      };
      if (this.actions.length > 0) {
        this.actions = this.actions.slice(0, this.idx);
      }
      this.actions.push(action);
      this.idx++;
    }
    doUpdate(lineNum, textBefore, textAfter) {
      const action = {
        kind: "update",
        before: {
          currLine: lineNum,
          currText: textBefore,
          nextLine: 0,
          nextText: ""
        },
        after: {
          currLine: lineNum,
          currText: textAfter,
          nextLine: 0,
          nextText: ""
        }
      };
      if (this.actions.length > 0) {
        this.actions = this.actions.slice(0, this.idx);
      }
      this.actions.push(action);
      this.idx++;
    }
    undo() {
      if (this.idx == 0) {
        return null;
      }
      this.idx--;
      const action = this.actions[this.idx];
      if (!action) {
        return null;
      }
      return action;
    }
    redo() {
      if (this.idx == this.actions.length) {
        return null;
      }
      const action = this.actions[this.idx];
      if (!action) {
        return null;
      }
      this.idx++;
      return action;
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
    open(node) {
      this.node = node;
      this.el.innerHTML = "";
      if (!this.node.childs) {
        return;
      }
      for (const c of this.node.childs) {
        const el = document.createElement("div");
        el.style.padding = "1em";
        el.style.cursor = "pointer";
        el.innerHTML = c.name;
        if (c.is_dir) {
          el.style.backgroundColor = "cornsilk";
        }
        el.onclick = () => {
          this.onClick(c);
        };
        el.onmouseout = () => {
          if (c.is_dir) {
            el.style.backgroundColor = "cornsilk";
          } else {
            el.style.backgroundColor = "white";
          }
        };
        el.onmouseover = () => {
          el.style.backgroundColor = "aliceblue";
        };
        this.el.appendChild(el);
      }
    }
  };
  var WuiVfsPath = class {
    constructor(onClick) {
      this.el = document.createElement("div");
      this.el.classList.add(CLASS_VFS_PATH);
      this.el.style.borderWidth = "1px";
      this.el.style.borderStyle = "solid";
      this.el.style.borderColor = "silver";
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
        crumb.style.display = "inline-block";
        crumb.style.padding = "1em";
        crumb.style.cursor = "pointer";
        crumb.innerHTML = p;
        crumb.onclick = () => {
          this.onClick(fullPath);
        };
        crumb.onmouseout = () => {
          crumb.style.backgroundColor = "white";
        };
        crumb.onmouseover = () => {
          crumb.style.backgroundColor = "aliceblue";
        };
        this.el.appendChild(crumb);
      });
    }
  };

  // _wui/awwan.ts
  var CLASS_EDITOR_ACTION = "editor_action";
  var ID_BTN_EXEC_LOCAL = "com_btn_local";
  var ID_BTN_EXEC_REMOTE = "com_btn_remote";
  var ID_BTN_NEW_DIR = "com_btn_new_dir";
  var ID_BTN_NEW_FILE = "com_btn_new_file";
  var ID_BTN_REMOVE = "com_btn_remove";
  var ID_BTN_SAVE = "com_btn_save";
  var ID_COM_RESIZE = "com_resize";
  var ID_EDITOR = "com_editor";
  var ID_INP_LINE_RANGE = "com_inp_line_range";
  var ID_INP_VFS_NEW = "com_inp_vfs_new";
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
      el = document.getElementById(ID_INP_LINE_RANGE);
      if (!el) {
        console.error(`failed to get element by ID #${ID_INP_LINE_RANGE}`);
        return;
      }
      this.comInputLineRange = el;
      el = document.getElementById(ID_INP_VFS_NEW);
      if (el) {
        this.comInputVfsNew = el;
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
        is_editable: true,
        onSave: (content) => {
          this.editorOnSave(content);
        },
        onSelection: () => {
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
      const res = await httpRes.json();
      if (res.code != 200) {
        this.notif.error(`Failed to open ${path}: ${res.message}`);
        return res;
      }
      const node = res.data;
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
      this.orgContent = this.editor.getContent();
      this.comBtnLocal.disabled = false;
      this.comBtnRemote.disabled = false;
      this.comBtnSave.disabled = false;
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
      let isTypeAllowed = false;
      if (node.content_type && (node.content_type.indexOf("json") >= 0 || node.content_type.indexOf("message") >= 0 || node.content_type.indexOf("script") >= 0 || node.content_type.indexOf("text") >= 0 || node.content_type.indexOf("xml") >= 0)) {
        isTypeAllowed = true;
      }
      if (!isTypeAllowed) {
        res.message = `The file "${node.name}" with content type "${node.content_type}" is not allowed to be opened`;
        return res;
      }
      if (node.size && node.size > MAX_FILE_SIZE) {
        res.message = `The file "${node.name}" with size ${node.size / 1e6}MB is greater than maximum ${MAX_FILE_SIZE / 1e6}MB.`;
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
      this.orgContent = content;
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
      this.notif.info(`Successfully execute ${this.request.script} on ${mode}.`);
    }
    async newNode(isDir) {
      if (!this.currentNode) {
        this.notif.error("No active directory loaded or selected.");
        return;
      }
      const name = this.comInputVfsNew.value;
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
      const name = this.comInputVfsNew.value;
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
