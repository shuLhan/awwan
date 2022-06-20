var app = (() => {
  // _www/wui/editor/editor.js
  var WUI_EDITOR_CLASS = "wui_editor";
  var WUI_EDITOR_CLASS_LINE = "wui_editor_line";
  var WUI_EDITOR_CLASS_LINE_NUMBER = "wui_editor_line_number";
  var WUI_EDITOR_CLASS_LINE_TEXT = "wui_editor_line_text";
  var WuiEditor = function() {
    function WuiEditor2(opts) {
      var _this = this;
      this.opts = opts;
      this.lines = [];
      this.active_file = null;
      this.active_text = null;
      this.range_begin = -1;
      this.range_end = -1;
      this.raw_lines = [];
      this.is_key_control = false;
      this.unre = new WuiEditorUndoRedo();
      this.id = opts.id;
      this.is_editable = opts.is_editable;
      var el = document.getElementById(opts.id);
      if (!el) {
        console.error("WuiEditor: element ID not found:", opts.id);
        return;
      }
      this.el = el;
      this.initStyle();
      this.el.classList.add(WUI_EDITOR_CLASS);
      var sel = window.getSelection();
      if (!sel) {
        console.error("WuiEditor: cannot get window selection", opts.id);
        return;
      }
      this.sel = sel;
      this.range = document.createRange();
      document.onkeyup = function(ev) {
        _this.onKeyupDocument(_this, ev);
      };
    }
    WuiEditor2.prototype.GetContent = function() {
      var content = "";
      for (var x = 0; x < this.lines.length; x++) {
        if (x > 0) {
          content += "\n";
        }
        content += this.lines[x].el_text.innerText;
      }
      return content;
    };
    WuiEditor2.prototype.GetSelectionRange = function() {
      return {
        begin_at: this.range_begin,
        end_at: this.range_end
      };
    };
    WuiEditor2.prototype.OnClickText = function(text) {
      var sel = window.getSelection();
      if (sel) {
        this.sel = sel;
      }
    };
    WuiEditor2.prototype.OnKeyup = function(x, text, ev) {
      var text_before;
      var text_after;
      var off;
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
          text_before = this.raw_lines[x];
          var el_text_curr = this.lines[x].el_text;
          text_after = el_text_curr.innerText;
          off = this.sel.focusOffset;
          if (off > 0) {
            this.unre.DoUpdate(x, text_before, text_after);
            this.raw_lines[x] = text_after;
            this.setCaret(el_text_curr, off);
            return false;
          }
          var el_text_prev = this.lines[x - 1].el_text;
          this.unre.DoJoin(x - 1, el_text_prev.innerText, el_text_curr.innerText);
          off = el_text_prev.innerText.length;
          el_text_prev.innerText = el_text_prev.innerText + el_text_curr.innerText;
          this.raw_lines[x - 1] = el_text_prev.innerText;
          this.deleteLine(x);
          this.setCaret(el_text_prev, off);
          return false;
        case "Control":
          this.is_key_control = false;
          break;
        case "Enter":
          ev.preventDefault();
          break;
        case "r":
          if (this.is_key_control) {
            ev.preventDefault();
            return;
          }
          break;
        case "z":
          if (this.is_key_control) {
            ev.preventDefault();
            return;
          }
          break;
        default:
          if (this.is_key_control) {
            break;
          }
          this.unre.DoUpdate(x, this.raw_lines[x], this.lines[x].el_text.innerText);
          this.raw_lines[x] = this.lines[x].el_text.innerText;
      }
      return true;
    };
    WuiEditor2.prototype.OnKeydownOnLine = function(x, el_text, ev) {
      var text_before;
      var text_after;
      var off;
      switch (ev.key) {
        case "ArrowUp":
          if (x == 0) {
            return false;
          }
          ev.preventDefault();
          var el_text_1 = this.lines[x - 1].el_text;
          var off_1 = this.sel.focusOffset;
          if (off_1 > el_text_1.innerText.length) {
            off_1 = el_text_1.innerText.length;
          }
          this.setCaret(el_text_1, off_1);
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
          el_text_1 = this.lines[x + 1].el_text;
          off_1 = this.sel.focusOffset;
          if (off_1 > el_text_1.innerText.length) {
            off_1 = el_text_1.innerText.length;
          }
          this.setCaret(el_text_1, off_1);
          x += 2;
          if (x * 25 >= this.el.clientHeight + this.el.scrollTop) {
            this.el.scrollTop += 25;
          }
          return false;
        case "Control":
          this.is_key_control = true;
          break;
        case "Delete":
          ev.preventDefault();
          var is_join_line_after = false;
          var el_text_current = this.lines[x].el_text;
          off_1 = this.sel.focusOffset;
          text_before = el_text_current.innerText;
          text_after = "";
          if (text_before.length === 0 || off_1 === text_before.length) {
            is_join_line_after = true;
          }
          if (is_join_line_after) {
            if (x + 1 < this.lines.length) {
              var el_text_after = this.lines[x + 1].el_text;
              text_after = el_text_after.innerText;
              el_text_after.innerText = "";
              this.unre.DoJoin(x, text_before, text_after);
              this.deleteLine(x + 1);
              text_after = text_before + text_after;
            }
          } else {
            text_after = text_before.slice(0, off_1) + text_before.slice(off_1 + 1, text_before.length);
            this.unre.DoUpdate(x, text_before, text_after);
          }
          this.lines[x].el_text.innerText = text_after;
          this.raw_lines[x] = text_after;
          this.setCaret(el_text_current, off_1);
          break;
        case "Enter":
          ev.preventDefault();
          off_1 = this.sel.focusOffset;
          var text = this.lines[x].el_text.innerText;
          text_before = text.slice(0, off_1);
          text_after = text.slice(off_1, text.length);
          this.unre.DoSplit(x, text_before, text_after);
          this.lines[x].el_text.innerText = text_before;
          this.raw_lines[x] = text_before;
          this.insertNewline(x + 1, text_after);
          if (x + 3 >= this.raw_lines.length) {
            this.el.scrollTop = this.el.scrollHeight;
          }
          break;
        case "Tab":
          ev.preventDefault();
          el_text_1 = this.lines[x].el_text;
          off_1 = this.sel.focusOffset;
          text_before = el_text_1.innerText;
          text_after = text_before.slice(0, off_1) + "	" + text_before.slice(off_1, text_before.length);
          this.unre.DoUpdate(x, text_before, text_after);
          el_text_1.innerText = text_after;
          this.raw_lines[x] = text_after;
          this.setCaret(el_text_1, off_1 + 1);
          break;
        case "r":
          if (this.is_key_control) {
            ev.preventDefault();
            this.doRedo();
            return;
          }
          break;
        case "s":
          if (this.is_key_control) {
            ev.preventDefault();
            ev.stopPropagation();
            if (this.opts.OnSave) {
              this.opts.OnSave(this.GetContent());
            }
            return false;
          }
          break;
        case "z":
          if (this.is_key_control) {
            ev.preventDefault();
            this.doUndo();
            return;
          }
          break;
      }
    };
    WuiEditor2.prototype.OnMouseDownAtLine = function(x) {
      this.range_begin = x;
    };
    WuiEditor2.prototype.OnMouseUpAtLine = function(x) {
      this.range_end = x;
      if (this.range_end < this.range_begin) {
        return;
      }
      var y = 0;
      for (; y < this.range_begin; y++) {
        this.el.children[y].setAttribute("style", "");
      }
      for (; y <= this.range_end; y++) {
        this.el.children[y].setAttribute("style", "background-color:lightsalmon");
      }
      for (; y < this.el.children.length; y++) {
        this.el.children[y].setAttribute("style", "");
      }
      if (this.opts.OnSelection) {
        this.opts.OnSelection(this.range_begin, this.range_end);
      }
    };
    WuiEditor2.prototype.SetEditOff = function() {
      for (var x = 0; x < this.lines.length; x++) {
        this.lines[x].SetEditOff();
      }
    };
    WuiEditor2.prototype.SetEditOn = function() {
      for (var x = 0; x < this.lines.length; x++) {
        this.lines[x].SetEditOn();
      }
    };
    WuiEditor2.prototype.Open = function(node) {
      this.active_file = node;
      var content = atob(node.content);
      content = content.replace("\r\n", "\n");
      this.raw_lines = content.split("\n");
      this.lines = [];
      for (var x = 0; x < this.raw_lines.length; x++) {
        var line = new WuiEditorLine(x, this.raw_lines[x], this);
        this.lines.push(line);
      }
      this.render();
    };
    WuiEditor2.prototype.ClearSelection = function() {
      if (this.range_begin < 0 || this.range_end == 0) {
        return;
      }
      for (var x = this.range_begin; x <= this.range_end; x++) {
        this.el.children[x].setAttribute("style", "");
      }
      this.range_begin = -1;
      this.range_end = -1;
    };
    WuiEditor2.prototype.initStyle = function() {
      var style = document.createElement("style");
      style.type = "text/css";
      style.innerText = "\n			[contenteditable] {\n				outline: 0px solid transparent;\n			}\n			." + WUI_EDITOR_CLASS + " {\n				background-color: cornsilk;\n				font-family: monospace;\n				overflow-y: auto;\n				width: 100%;\n			}\n			." + WUI_EDITOR_CLASS_LINE + " {\n				display: block;\n				width: 100%;\n			}\n			." + WUI_EDITOR_CLASS_LINE_NUMBER + " {\n				color: dimgrey;\n				cursor: pointer;\n				display: inline-block;\n				padding: 4px 10px 4px 4px;\n				text-align: right;\n				user-select: none;\n				vertical-align: top;\n				width: 30px;\n			}\n			." + WUI_EDITOR_CLASS_LINE_NUMBER + ":hover {\n				background-color: lightsalmon;\n			}\n			." + WUI_EDITOR_CLASS_LINE_TEXT + " {\n				display: inline-block;\n				padding: 4px;\n				border-color: lightblue;\n				border-width: 0px;\n				border-style: solid;\n				white-space: pre-wrap;\n				width: calc(100% - 60px);\n			}\n		";
      document.head.appendChild(style);
    };
    WuiEditor2.prototype.doJoin = function(changes) {
      this.lines[changes.curr_line].el_text.innerText = changes.curr_text;
      this.deleteLine(changes.next_line);
      this.setCaret(this.lines[changes.curr_line].el_text, 0);
    };
    WuiEditor2.prototype.doSplit = function(changes) {
      this.lines[changes.curr_line].el_text.innerText = changes.curr_text;
      this.insertNewline(changes.next_line, changes.next_text);
    };
    WuiEditor2.prototype.doUpdate = function(changes) {
      this.lines[changes.curr_line].el_text.innerText = changes.curr_text;
      this.setCaret(this.lines[changes.curr_line].el_text, 0);
    };
    WuiEditor2.prototype.doRedo = function() {
      var act = this.unre.Redo();
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
    };
    WuiEditor2.prototype.doUndo = function() {
      var act = this.unre.Undo();
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
    };
    WuiEditor2.prototype.deleteLine = function(x) {
      this.lines.splice(x, 1);
      this.raw_lines.splice(x, 1);
      for (; x < this.lines.length; x++) {
        this.lines[x].SetNumber(x);
      }
      this.render();
    };
    WuiEditor2.prototype.insertNewline = function(x, text) {
      var newline = new WuiEditorLine(x, text, this);
      for (var y = x; y < this.lines.length; y++) {
        this.lines[y].SetNumber(y + 1);
      }
      this.lines.splice(x, 0, newline);
      this.raw_lines.splice(x, 0, text);
      this.render();
      this.setCaret(newline.el_text, 0);
    };
    WuiEditor2.prototype.onKeyupDocument = function(ed, ev) {
      switch (ev.key) {
        case "Escape":
          ev.preventDefault();
          ed.ClearSelection();
          break;
      }
      return true;
    };
    WuiEditor2.prototype.render = function() {
      this.el.innerHTML = "";
      for (var _i = 0, _a = this.lines; _i < _a.length; _i++) {
        var line = _a[_i];
        this.el.appendChild(line.el);
      }
    };
    WuiEditor2.prototype.setCaret = function(el_text, off) {
      if (el_text.firstChild) {
        this.range.setStart(el_text.firstChild, off);
      } else {
        this.range.setStart(el_text, off);
      }
      this.range.collapse(true);
      this.sel.removeAllRanges();
      this.sel.addRange(this.range);
    };
    return WuiEditor2;
  }();
  var WuiEditorLine = function() {
    function WuiEditorLine2(x, text, ed) {
      var _this = this;
      this.x = x;
      this.text = text;
      this.line_num = 0;
      this.line_num = x;
      this.el = document.createElement("div");
      this.el.classList.add(WUI_EDITOR_CLASS_LINE);
      this.el_number = document.createElement("span");
      this.el_number.classList.add(WUI_EDITOR_CLASS_LINE_NUMBER);
      this.el_number.innerText = this.line_num + 1 + "";
      this.el_number.onmousedown = function(ev) {
        ed.OnMouseDownAtLine(_this.line_num);
      };
      this.el_number.onmouseup = function(ev) {
        ed.OnMouseUpAtLine(_this.line_num);
      };
      this.el_text = document.createElement("span");
      this.el_text.classList.add(WUI_EDITOR_CLASS_LINE_TEXT);
      this.el_text.innerText = text;
      this.el_text.contentEditable = "true";
      this.el_text.onclick = function(ev) {
        ed.OnClickText(_this.el_text);
      };
      this.el_text.onkeydown = function(ev) {
        return ed.OnKeydownOnLine(_this.line_num, _this.el_text, ev);
      };
      this.el_text.onkeyup = function(ev) {
        return ed.OnKeyup(_this.line_num, _this.el_text, ev);
      };
      this.el_text.addEventListener("paste", function(ev) {
        if (!ev.clipboardData) {
          return;
        }
        ev.preventDefault();
        var text2 = ev.clipboardData.getData("text/plain");
        document.execCommand("insertHTML", false, text2);
      });
      this.el.appendChild(this.el_number);
      this.el.appendChild(this.el_text);
    }
    WuiEditorLine2.prototype.SetNumber = function(x) {
      this.line_num = x;
      this.el_number.innerText = x + 1 + "";
    };
    WuiEditorLine2.prototype.SetEditOn = function() {
      this.el_text.contentEditable = "true";
    };
    WuiEditorLine2.prototype.SetEditOff = function() {
      this.el_text.contentEditable = "false";
    };
    return WuiEditorLine2;
  }();
  var WuiEditorUndoRedo = function() {
    function WuiEditorUndoRedo2() {
      this.idx = 0;
      this.actions = [];
    }
    WuiEditorUndoRedo2.prototype.DoJoin = function(prevLine, prevText, curr_text) {
      var curr_line = prevLine + 1;
      var action = {
        kind: "join",
        before: {
          curr_line: prevLine,
          curr_text: prevText,
          next_line: prevLine + 1,
          next_text: curr_text
        },
        after: {
          curr_line: prevLine,
          curr_text: prevText + curr_text,
          next_line: prevLine + 1,
          next_text: ""
        }
      };
      if (this.actions.length > 0) {
        this.actions = this.actions.slice(0, this.idx);
      }
      this.actions.push(action);
      this.idx++;
    };
    WuiEditorUndoRedo2.prototype.DoSplit = function(curr_line, curr_text, next_text) {
      var action = {
        kind: "split",
        before: {
          curr_line,
          curr_text: curr_text + next_text,
          next_line: curr_line + 1,
          next_text: ""
        },
        after: {
          curr_line,
          curr_text,
          next_line: curr_line + 1,
          next_text
        }
      };
      if (this.actions.length > 0) {
        this.actions = this.actions.slice(0, this.idx);
      }
      this.actions.push(action);
      this.idx++;
    };
    WuiEditorUndoRedo2.prototype.DoUpdate = function(line_num, text_before, text_after) {
      var action = {
        kind: "update",
        before: {
          curr_line: line_num,
          curr_text: text_before,
          next_line: 0,
          next_text: ""
        },
        after: {
          curr_line: line_num,
          curr_text: text_after,
          next_line: 0,
          next_text: ""
        }
      };
      if (this.actions.length > 0) {
        this.actions = this.actions.slice(0, this.idx);
      }
      this.actions.push(action);
      this.idx++;
    };
    WuiEditorUndoRedo2.prototype.Undo = function() {
      if (this.idx == 0) {
        return null;
      }
      this.idx--;
      return this.actions[this.idx];
    };
    WuiEditorUndoRedo2.prototype.Redo = function() {
      if (this.idx == this.actions.length) {
        return null;
      }
      var action = this.actions[this.idx];
      this.idx++;
      return action;
    };
    return WuiEditorUndoRedo2;
  }();

  // _www/wui/notif/notif.js
  var WUI_NOTIF_ID = "wui_notif";
  var WUI_NOTIF_CLASS_INFO = "wui_notif_info";
  var WUI_NOTIF_CLASS_ERROR = "wui_notif_error";
  var WuiNotif = function() {
    function WuiNotif2() {
      this.timeout = 5e3;
      this.el = document.createElement("div");
      this.el.id = WUI_NOTIF_ID;
      document.body.appendChild(this.el);
      this.initStyle();
    }
    WuiNotif2.prototype.Info = function(msg) {
      var _this = this;
      var item = document.createElement("div");
      item.innerHTML = msg;
      item.classList.add(WUI_NOTIF_CLASS_INFO);
      this.el.appendChild(item);
      setTimeout(function() {
        _this.el.removeChild(item);
      }, this.timeout);
    };
    WuiNotif2.prototype.Error = function(msg) {
      var _this = this;
      var item = document.createElement("div");
      item.innerHTML = msg;
      item.classList.add(WUI_NOTIF_CLASS_ERROR);
      this.el.appendChild(item);
      setTimeout(function() {
        _this.el.removeChild(item);
      }, this.timeout);
    };
    WuiNotif2.prototype.initStyle = function() {
      var style = document.createElement("style");
      style.type = "text/css";
      style.innerText = "\n			#" + WUI_NOTIF_ID + " {\n				left: 10%;\n				position: fixed;\n				top: 1em;\n				width: 80%;\n				z-index: 10000;\n			}\n			." + WUI_NOTIF_CLASS_INFO + " {\n				border: 1px solid silver;\n				background-color: honeydew;\n				margin-bottom: 1em;\n				padding: 1em;\n			}\n			." + WUI_NOTIF_CLASS_ERROR + " {\n				border: 1px solid salmon;\n				background-color: lightsalmon;\n				margin-bottom: 1em;\n				padding: 1em;\n			}\n		";
      document.head.appendChild(style);
    };
    return WuiNotif2;
  }();

  // _www/wui/vfs/vfs.js
  var __awaiter = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var __generator = function(thisArg, body) {
    var _ = { label: 0, sent: function() {
      if (t[0] & 1)
        throw t[1];
      return t[1];
    }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
      return this;
    }), g;
    function verb(n) {
      return function(v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f)
        throw new TypeError("Generator is already executing.");
      while (_)
        try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
            return t;
          if (y = 0, t)
            op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2])
                _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5)
        throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
  var CLASS_VFS_PATH = "wui_vfs_path";
  var CLASS_VFS_LIST = "wui_vfs_list";
  var WuiVfs = function() {
    function WuiVfs2(opts) {
      var _this = this;
      this.opts = opts;
      this.opts = opts;
      var el = document.getElementById(opts.id);
      if (!el) {
        console.error("WuiVfs: element id", opts.id, "not found");
        return;
      }
      this.el = el;
      this.com_path = new WuiVfsPath(function(path) {
        _this.OpenDir(path);
      });
      this.el.appendChild(this.com_path.el);
      this.com_list = new WuiVfsList(function(node) {
        _this.OpenNode(node);
      });
      this.el.appendChild(this.com_list.el);
    }
    WuiVfs2.prototype.OpenNode = function(node) {
      if (node.is_dir) {
        this.OpenDir(node.path);
      } else {
        this.opts.OpenNode(node);
      }
    };
    WuiVfs2.prototype.OpenDir = function(path) {
      return __awaiter(this, void 0, void 0, function() {
        var res;
        return __generator(this, function(_a) {
          switch (_a.label) {
            case 0:
              return [4, this.opts.Open(path, true)];
            case 1:
              res = _a.sent();
              if (res.code != 200) {
                return [2];
              }
              this.Set(res.data);
              return [2];
          }
        });
      });
    };
    WuiVfs2.prototype.Set = function(node) {
      if (node.is_dir) {
        this.com_path.Open(node);
        this.com_list.Open(node);
      }
    };
    return WuiVfs2;
  }();
  var WuiVfsList = function() {
    function WuiVfsList2(onClick) {
      this.onClick = onClick;
      this.node = null;
      this.el = document.createElement("div");
      this.el.classList.add(CLASS_VFS_LIST);
      this.el.style.borderWidth = "1px";
      this.el.style.borderStyle = "solid";
      this.el.style.borderColor = "silver";
    }
    WuiVfsList2.prototype.Open = function(node) {
      var _this = this;
      this.node = node;
      this.el.innerHTML = "";
      if (!this.node.childs) {
        return;
      }
      var _loop_1 = function(c2) {
        var el = document.createElement("div");
        el.style.padding = "1em";
        el.style.cursor = "pointer";
        el.innerHTML = c2.name;
        if (c2.is_dir) {
          el.style.backgroundColor = "cornsilk";
        }
        el.onclick = function(ev) {
          _this.onClick(c2);
        };
        el.onmouseout = function(event) {
          if (c2.is_dir) {
            el.style.backgroundColor = "cornsilk";
          } else {
            el.style.backgroundColor = "white";
          }
        };
        el.onmouseover = function(event) {
          el.style.backgroundColor = "aliceblue";
        };
        this_1.el.appendChild(el);
      };
      var this_1 = this;
      for (var _i = 0, _a = this.node.childs; _i < _a.length; _i++) {
        var c = _a[_i];
        _loop_1(c);
      }
    };
    return WuiVfsList2;
  }();
  var WuiVfsPath = function() {
    function WuiVfsPath2(onClick) {
      this.el = document.createElement("div");
      this.el.classList.add(CLASS_VFS_PATH);
      this.el.style.borderWidth = "1px";
      this.el.style.borderStyle = "solid";
      this.el.style.borderColor = "silver";
      this.crumbs = [];
      this.onClick = onClick;
    }
    WuiVfsPath2.prototype.Open = function(node) {
      var _this = this;
      this.el.innerHTML = "";
      this.crumbs = [];
      var paths = [];
      if (node.path == "/") {
        paths.push(node.path);
      } else {
        paths = node.path.split("/");
      }
      var _loop_2 = function(x2) {
        var full_path = "";
        var p = "";
        if (x2 == 0) {
          p = "/";
          full_path = "/";
        } else {
          p = paths[x2];
          full_path = paths.slice(0, x2 + 1).join("/");
        }
        var crumb = document.createElement("span");
        crumb.style.display = "inline-block";
        crumb.style.padding = "1em";
        crumb.style.cursor = "pointer";
        crumb.innerHTML = p;
        crumb.onclick = function(event) {
          _this.onClick(full_path);
        };
        crumb.onmouseout = function(event) {
          crumb.style.backgroundColor = "white";
        };
        crumb.onmouseover = function(event) {
          crumb.style.backgroundColor = "aliceblue";
        };
        this_2.el.appendChild(crumb);
      };
      var this_2 = this;
      for (var x = 0; x < paths.length; x++) {
        _loop_2(x);
      }
    };
    return WuiVfsPath2;
  }();

  // _www/awwan.js
  var __awaiter2 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var __generator2 = function(thisArg, body) {
    var _ = { label: 0, sent: function() {
      if (t[0] & 1)
        throw t[1];
      return t[1];
    }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
      return this;
    }), g;
    function verb(n) {
      return function(v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f)
        throw new TypeError("Generator is already executing.");
      while (_)
        try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
            return t;
          if (y = 0, t)
            op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2])
                _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5)
        throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
  var CLASS_EDITOR_ACTION = "editor_action";
  var ID_BTN_CLEAR_SELECTION = "com_btn_clear_selection";
  var ID_BTN_EXEC_LOCAL = "com_btn_local";
  var ID_BTN_EXEC_REMOTE = "com_btn_remote";
  var ID_BTN_NEW_DIR = "com_btn_new_dir";
  var ID_BTN_NEW_FILE = "com_btn_new_file";
  var ID_BTN_REMOVE = "com_btn_remove";
  var ID_BTN_SAVE = "com_btn_save";
  var ID_EDITOR = "com_editor";
  var ID_INP_VFS_NEW = "com_inp_vfs_new";
  var ID_VFS = "com_vfs";
  var ID_VFS_PATH = "vfs_path";
  var ID_STDOUT = "stdout";
  var ID_STDERR = "stderr";
  var MAX_FILE_SIZE = 3e6;
  function renderHtml() {
    var el = document.createElement("div");
    el.classList.add("awwan");
    el.innerHTML = '\n			<div class="awwan_nav_left">\n				<div id="' + ID_VFS + '"></div>\n\n				<br/>\n				<div class="' + ID_INP_VFS_NEW + '">\n					<input id="' + ID_INP_VFS_NEW + '" />\n				</div>\n				<button id="' + ID_BTN_NEW_DIR + '">New directory</button>\n				<button id="' + ID_BTN_NEW_FILE + '">New file</button>\n				<button id="' + ID_BTN_REMOVE + '">Remove</button>\n			</div>\n			<div class="awwan_content">\n				<div class="editor_file">\n					File: <span id="' + ID_VFS_PATH + '">-</span>\n					<button id="' + ID_BTN_SAVE + '" disabled="true">Save</button>\n				</div>\n				<div id="' + ID_EDITOR + '"></div>\n				<div>\n					<div class="' + CLASS_EDITOR_ACTION + '">\n						<button id="' + ID_BTN_CLEAR_SELECTION + '">Clear selection</button>\n					</div>\n					<div class="' + CLASS_EDITOR_ACTION + '">\n						Execute script on\n						<button id="' + ID_BTN_EXEC_LOCAL + '" disabled="true">Local</button>\n						or\n						<button id="' + ID_BTN_EXEC_REMOTE + '" disabled="true">Remote</button>\n					</div>\n				</div>\n				<p>Hints:</p>\n				<ul>\n					<li>\n						Click and drag on the line numbers to select the specific line to be\n						executed.\n					</li>\n					<li>Press ESC to clear selection.</li>\n				</ul>\n				<div class="boxheader">Standard output:</div>\n				<div id="' + ID_STDOUT + '"></div>\n				<div class="boxheader">Standard error:</div>\n				<div id="' + ID_STDERR + '"></div>\n			</div>\n		';
    document.body.appendChild(el);
  }
  var Awwan = function() {
    function Awwan2() {
      var _this = this;
      this.current_node = null;
      this.request = {
        mode: "local",
        script: "",
        content: "",
        begin_at: 0,
        end_at: 0
      };
      var el = document.getElementById(ID_BTN_CLEAR_SELECTION);
      if (el) {
        this.com_btn_clear = el;
        this.com_btn_clear.onclick = function() {
          _this.wui_editor.ClearSelection();
        };
      }
      el = document.getElementById(ID_BTN_EXEC_LOCAL);
      if (el) {
        this.com_btn_local = el;
        this.com_btn_local.onclick = function() {
          _this.execLocal();
        };
      }
      el = document.getElementById(ID_BTN_EXEC_REMOTE);
      if (el) {
        this.com_btn_remote = el;
        this.com_btn_remote.onclick = function() {
          _this.execRemote();
        };
      }
      el = document.getElementById(ID_BTN_NEW_DIR);
      if (el) {
        this.com_btn_new_dir = el;
        this.com_btn_new_dir.onclick = function() {
          _this.newNode(true);
        };
      }
      el = document.getElementById(ID_BTN_NEW_FILE);
      if (el) {
        this.com_btn_new_file = el;
        this.com_btn_new_file.onclick = function() {
          _this.newNode(false);
        };
      }
      el = document.getElementById(ID_BTN_REMOVE);
      if (el) {
        this.com_btn_remove = el;
        this.com_btn_remove.onclick = function() {
          _this.onClickRemove();
        };
      }
      el = document.getElementById(ID_BTN_SAVE);
      if (el) {
        this.com_btn_save = el;
        this.com_btn_save.onclick = function() {
          _this.onClickSave();
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
      var editor_opts = {
        id: ID_EDITOR,
        is_editable: true,
        OnSelection: function(begin_at, end_at) {
          _this.editorOnSelection(begin_at, end_at);
        },
        OnSave: this.editorOnSave
      };
      this.wui_editor = new WuiEditor(editor_opts);
      this.wui_notif = new WuiNotif();
      var wui_vfs_opts = {
        id: ID_VFS,
        Open: function(path, is_dir) {
          return _this.Open(path, is_dir);
        },
        OpenNode: function(node) {
          return _this.OpenNode(node);
        }
      };
      this.wui_vfs = new WuiVfs(wui_vfs_opts);
      window.onhashchange = function(ev) {
        ev.preventDefault();
        var hashchange = ev;
        var url = new URL(hashchange.newURL);
        _this.onHashChange(url.hash);
      };
      this.onHashChange(window.location.hash);
    }
    Awwan2.prototype.onHashChange = function(hash) {
      if (hash === "") {
        hash = "#/";
      }
      hash = hash.substring(1);
      this.wui_vfs.OpenDir(hash);
    };
    Awwan2.prototype.Open = function(path, is_dir) {
      return __awaiter2(this, void 0, void 0, function() {
        var http_res, res, node, resAllow;
        return __generator2(this, function(_a) {
          switch (_a.label) {
            case 0:
              return [4, fetch("/awwan/api/fs?path=" + path)];
            case 1:
              http_res = _a.sent();
              return [4, http_res.json()];
            case 2:
              res = _a.sent();
              if (res.code != 200) {
                this.wui_notif.Error("Failed to open " + path + ": " + res.message);
                return [2, res];
              }
              node = res.data;
              this.com_inp_vfs_new.value = node.name;
              if (is_dir) {
                this.current_node = node;
                window.location.hash = "#" + path;
                return [2, res];
              }
              resAllow = this.isEditAllowed(node);
              if (resAllow.code != 200) {
                this.wui_notif.Error(resAllow.message);
                return [2, resAllow];
              }
              this.com_file_path.innerText = path;
              this.request.script = path;
              this.wui_editor.Open(node);
              this.com_btn_local.disabled = false;
              this.com_btn_remote.disabled = false;
              this.com_btn_save.disabled = false;
              return [2, res];
          }
        });
      });
    };
    Awwan2.prototype.OpenNode = function(node) {
      return __awaiter2(this, void 0, void 0, function() {
        var resAllow, res;
        return __generator2(this, function(_a) {
          switch (_a.label) {
            case 0:
              resAllow = this.isEditAllowed(node);
              if (resAllow.code != 200) {
                this.wui_notif.Error(resAllow.message);
                return [2, resAllow];
              }
              return [4, this.Open(node.path, node.is_dir)];
            case 1:
              res = _a.sent();
              return [2, res];
          }
        });
      });
    };
    Awwan2.prototype.isEditAllowed = function(node) {
      var res = {
        code: 412,
        message: ""
      };
      var is_type_allowed = false;
      if (node.content_type && (node.content_type.indexOf("json") >= 0 || node.content_type.indexOf("message") >= 0 || node.content_type.indexOf("script") >= 0 || node.content_type.indexOf("text") >= 0 || node.content_type.indexOf("xml") >= 0)) {
        is_type_allowed = true;
      }
      if (!is_type_allowed) {
        res.message = 'The file "' + node.name + '" with content type "' + node.content_type + '" is not allowed to be opened';
        return res;
      }
      if (node.size && node.size > MAX_FILE_SIZE) {
        res.message = 'The file "' + node.name + '" with size ' + node.size / 1e6 + "MB is greater than maximum " + MAX_FILE_SIZE / 1e6 + "MB.";
        return res;
      }
      res.code = 200;
      return res;
    };
    Awwan2.prototype.onClickSave = function() {
      if (this.request.script == "") {
        return;
      }
      var content = this.wui_editor.GetContent();
      var l = content.length;
      if (l > 0 && content[l - 1] != "\n") {
        content += "\n";
      }
      this.request.content = content;
      this.doSaveFile(this.request.script, this.request.content);
    };
    Awwan2.prototype.editorOnSave = function(content) {
      this.doSaveFile(this.request.script, content);
    };
    Awwan2.prototype.doSaveFile = function(path, content) {
      return __awaiter2(this, void 0, void 0, function() {
        var req, http_res, res;
        return __generator2(this, function(_a) {
          switch (_a.label) {
            case 0:
              req = {
                path,
                content: btoa(content)
              };
              return [4, fetch("/awwan/api/fs", {
                method: "PUT",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(req)
              })];
            case 1:
              http_res = _a.sent();
              return [4, http_res.json()];
            case 2:
              res = _a.sent();
              if (res.code != 200) {
                this.wui_notif.Error("Failed to save file " + path + ": " + res.message);
                return [2, null];
              }
              this.wui_notif.Info("File " + path + " has been saved.");
              return [2, res];
          }
        });
      });
    };
    Awwan2.prototype.editorOnSelection = function(begin, end) {
      var stmts = this.wui_editor.lines.slice(begin, end + 1);
      for (var _i = 0, stmts_1 = stmts; _i < stmts_1.length; _i++) {
        var stmt = stmts_1[_i];
        console.log("stmt:", stmt.x, stmt.text);
      }
    };
    Awwan2.prototype.execLocal = function() {
      if (this.request.script == "") {
        this.wui_notif.Error("Execute on local: no file selected");
        return;
      }
      this.httpApiExecute("local");
    };
    Awwan2.prototype.execRemote = function() {
      if (this.request.script == "") {
        this.wui_notif.Error("Execute on remote: no file selected");
        return;
      }
      this.httpApiExecute("remote");
    };
    Awwan2.prototype.httpApiExecute = function(mode) {
      return __awaiter2(this, void 0, void 0, function() {
        var selection_range, http_res, res;
        return __generator2(this, function(_a) {
          switch (_a.label) {
            case 0:
              selection_range = this.wui_editor.GetSelectionRange();
              if (selection_range.begin_at < 0) {
                this.request.begin_at = 0;
              } else {
                this.request.begin_at = selection_range.begin_at + 1;
              }
              if (selection_range.end_at < 0) {
                this.request.end_at = 0;
              } else {
                this.request.end_at = selection_range.end_at + 1;
              }
              this.com_stdout.innerText = "";
              this.com_stderr.innerText = "";
              this.request.mode = mode;
              this.request.content = btoa(this.wui_editor.GetContent());
              return [4, fetch("/awwan/api/execute", {
                method: "POST",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(this.request)
              })];
            case 1:
              http_res = _a.sent();
              return [4, http_res.json()];
            case 2:
              res = _a.sent();
              if (res.code != 200) {
                this.wui_notif.Error("Execute failed: " + res.message);
                return [2];
              }
              this.com_stdout.innerText = atob(res.data.stdout);
              if (res.data.stderr) {
                this.com_stderr.innerText = atob(res.data.stderr);
              }
              this.wui_notif.Info("Successfully execute " + this.request.script + " on " + mode + ".");
              return [2];
          }
        });
      });
    };
    Awwan2.prototype.newNode = function(is_dir) {
      return __awaiter2(this, void 0, void 0, function() {
        var name, req, http_res, res, node;
        return __generator2(this, function(_a) {
          switch (_a.label) {
            case 0:
              if (!this.current_node) {
                this.wui_notif.Error("No active directory loaded or selected.");
                return [2];
              }
              name = this.com_inp_vfs_new.value;
              if (name === "") {
                this.wui_notif.Error("Empty file name");
                return [2];
              }
              req = {
                path: this.current_node.path + "/" + name,
                name,
                is_dir,
                content_type: "",
                mod_time: 0,
                size: 0,
                mode: "",
                childs: [],
                content: ""
              };
              return [4, fetch("/awwan/api/fs", {
                method: "POST",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(req)
              })];
            case 1:
              http_res = _a.sent();
              return [4, http_res.json()];
            case 2:
              res = _a.sent();
              if (res.code != 200) {
                this.wui_notif.Error("newNode: " + res.message);
                return [2];
              }
              node = res.data;
              if (!this.current_node.childs) {
                this.current_node.childs = [];
              }
              this.current_node.childs.push(node);
              this.wui_vfs.Set(this.current_node);
              return [2];
          }
        });
      });
    };
    Awwan2.prototype.onClickRemove = function() {
      return __awaiter2(this, void 0, void 0, function() {
        var name, req, http_res, res;
        return __generator2(this, function(_a) {
          switch (_a.label) {
            case 0:
              console.log("onClickRemove: ", this.current_node);
              if (!this.current_node) {
                this.wui_notif.Error("No file selected.");
                return [2];
              }
              name = this.com_inp_vfs_new.value;
              if (name === "") {
                this.wui_notif.Error("Empty file name");
                return [2];
              }
              req = {
                path: this.current_node.path + "/" + name,
                is_dir: false,
                content: ""
              };
              return [4, fetch("/awwan/api/fs", {
                method: "DELETE",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(req)
              })];
            case 1:
              http_res = _a.sent();
              return [4, http_res.json()];
            case 2:
              res = _a.sent();
              if (res.code != 200) {
                this.wui_notif.Error("remove: " + res.message);
                return [2];
              }
              return [2];
          }
        });
      });
    };
    return Awwan2;
  }();

  // _www/main.ts
  renderHtml();
  var awwan = new Awwan();
})();
