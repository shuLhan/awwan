var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
define("wui/response", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
define("wui/vfs/vfs", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WuiVfs = void 0;
    var WuiVfs = /** @class */ (function () {
        function WuiVfs(opts) {
            var _this = this;
            this.opts = opts;
            this.opts = opts;
            var el = document.getElementById(opts.id);
            if (!el) {
                console.error("WuiVfs: element id", opts.id, "not found");
                return;
            }
            this.el = el;
            this.com_path = new WuiVfsPath(function (path) {
                _this.OpenDir(path);
            });
            this.el.appendChild(this.com_path.el);
            this.com_list = new WuiVfsList(function (node) {
                _this.OpenNode(node);
            });
            this.el.appendChild(this.com_list.el);
        }
        // OpenNode is a handler that will be called when a node is clicked
        // inside the WuiVfsList.
        WuiVfs.prototype.OpenNode = function (node) {
            if (node.is_dir) {
                this.OpenDir(node.path);
            }
            else {
                this.opts.OpenNode(node);
            }
        };
        // OpenDir is a handler that will be called when a path is clicked
        // inside the WuiVfsPath.
        WuiVfs.prototype.OpenDir = function (path) {
            return __awaiter(this, void 0, void 0, function () {
                var res;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.opts.Open(path, true)];
                        case 1:
                            res = _a.sent();
                            if (res.code != 200) {
                                return [2 /*return*/];
                            }
                            this.Set(res.data);
                            return [2 /*return*/];
                    }
                });
            });
        };
        WuiVfs.prototype.Set = function (node) {
            if (node.is_dir) {
                this.com_path.Open(node);
                this.com_list.Open(node);
            }
        };
        return WuiVfs;
    }());
    exports.WuiVfs = WuiVfs;
    var WuiVfsList = /** @class */ (function () {
        function WuiVfsList(onClick) {
            this.onClick = onClick;
            this.node = null;
            this.el = document.createElement("div");
            this.el.style.borderWidth = "1px";
            this.el.style.borderStyle = "solid";
            this.el.style.borderColor = "silver";
        }
        WuiVfsList.prototype.Open = function (node) {
            var _this = this;
            this.node = node;
            this.el.innerHTML = "";
            if (!this.node.childs) {
                return;
            }
            var _loop_1 = function (c) {
                var el = document.createElement("div");
                el.style.padding = "1em";
                el.style.cursor = "pointer";
                el.innerHTML = c.name;
                if (c.is_dir) {
                    el.style.backgroundColor = "cornsilk";
                }
                el.onclick = function (ev) {
                    _this.onClick(c);
                };
                el.onmouseout = function (event) {
                    if (c.is_dir) {
                        el.style.backgroundColor = "cornsilk";
                    }
                    else {
                        el.style.backgroundColor = "white";
                    }
                };
                el.onmouseover = function (event) {
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
        return WuiVfsList;
    }());
    var WuiVfsPath = /** @class */ (function () {
        function WuiVfsPath(onClick) {
            this.el = document.createElement("div");
            this.el.style.borderWidth = "1px";
            this.el.style.borderStyle = "solid";
            this.el.style.borderColor = "silver";
            this.crumbs = [];
            this.onClick = onClick;
        }
        WuiVfsPath.prototype.Open = function (node) {
            var _this = this;
            this.el.innerHTML = "";
            this.crumbs = [];
            var paths = [];
            if (node.path == "/") {
                paths.push(node.path);
            }
            else {
                paths = node.path.split("/");
            }
            var _loop_2 = function (x) {
                var full_path = "";
                var p = "";
                if (x == 0) {
                    p = "/";
                    full_path = "/";
                }
                else {
                    p = paths[x];
                    full_path = paths.slice(0, x + 1).join("/");
                }
                var crumb = document.createElement("span");
                crumb.style.display = "inline-block";
                crumb.style.padding = "1em";
                crumb.style.cursor = "pointer";
                crumb.innerHTML = p;
                crumb.onclick = function (event) {
                    _this.onClick(full_path);
                };
                crumb.onmouseout = function (event) {
                    crumb.style.backgroundColor = "white";
                };
                crumb.onmouseover = function (event) {
                    crumb.style.backgroundColor = "aliceblue";
                };
                this_2.el.appendChild(crumb);
            };
            var this_2 = this;
            for (var x = 0; x < paths.length; x++) {
                _loop_2(x);
            }
        };
        return WuiVfsPath;
    }());
});
// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
define("wui/editor/editor", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WuiEditor = void 0;
    var WUI_EDITOR_CLASS = "wui_editor";
    var WUI_EDITOR_CLASS_LINE = "wui_editor_line";
    var WUI_EDITOR_CLASS_LINE_NUMBER = "wui_editor_line_number";
    var WUI_EDITOR_CLASS_LINE_TEXT = "wui_editor_line_text";
    var WuiEditor = /** @class */ (function () {
        function WuiEditor(opts) {
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
            document.onkeyup = function (ev) {
                _this.onKeyupDocument(_this, ev);
            };
        }
        // GetContent return content of file.
        WuiEditor.prototype.GetContent = function () {
            var content = "";
            for (var x = 0; x < this.lines.length; x++) {
                if (x > 0) {
                    content += "\n";
                }
                content += this.lines[x].el_text.innerText;
            }
            return content;
        };
        WuiEditor.prototype.GetSelectionRange = function () {
            return {
                begin_at: this.range_begin,
                end_at: this.range_end,
            };
        };
        WuiEditor.prototype.OnClickText = function (text) {
            var sel = window.getSelection();
            if (sel) {
                this.sel = sel;
            }
        };
        WuiEditor.prototype.OnKeyup = function (x, text, ev) {
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
                case "Delete":
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
                    // Join current line with previous.
                    var el_text_prev = this.lines[x - 1].el_text;
                    this.unre.DoJoin(x - 1, el_text_prev.innerText, el_text_curr.innerText);
                    off = el_text_prev.innerText.length;
                    el_text_prev.innerText = el_text_prev.innerText + el_text_curr.innerText;
                    this.raw_lines[x - 1] = el_text_prev.innerText;
                    // Remove the current line
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
        WuiEditor.prototype.OnKeydownOnLine = function (x, el_text, ev) {
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
                    }
                    else if (x * 23 < this.el.scrollTop) {
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
                    text_after =
                        text_before.slice(0, off_1) + "\t" + text_before.slice(off_1, text_before.length);
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
        WuiEditor.prototype.OnMouseDownAtLine = function (x) {
            this.range_begin = x;
        };
        WuiEditor.prototype.OnMouseUpAtLine = function (x) {
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
        //
        // SetEditOff make the content not editable.
        //
        WuiEditor.prototype.SetEditOff = function () {
            for (var x = 0; x < this.lines.length; x++) {
                this.lines[x].SetEditOff();
            }
        };
        //
        // SetEditOn make the content to be editable.
        //
        WuiEditor.prototype.SetEditOn = function () {
            for (var x = 0; x < this.lines.length; x++) {
                this.lines[x].SetEditOn();
            }
        };
        // Open the node for editing.
        // The content MUST be encoded in base64.
        WuiEditor.prototype.Open = function (node) {
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
        WuiEditor.prototype.clearSelection = function () {
            if (this.range_begin < 0 || this.range_end == 0) {
                return;
            }
            for (var x = this.range_begin; x <= this.range_end; x++) {
                this.el.children[x].setAttribute("style", "");
            }
            this.range_begin = -1;
            this.range_end = -1;
        };
        WuiEditor.prototype.initStyle = function () {
            var style = document.createElement("style");
            style.type = "text/css";
            style.innerText = "\n\t\t\t[contenteditable] {\n\t\t\t\toutline: 0px solid transparent;\n\t\t\t}\n\t\t\t." + WUI_EDITOR_CLASS + " {\n\t\t\t\tbackground-color: cornsilk;\n\t\t\t\tfont-family: monospace;\n\t\t\t\toverflow-y: auto;\n\t\t\t\twidth: 100%;\n\t\t\t}\n\t\t\t." + WUI_EDITOR_CLASS_LINE + " {\n\t\t\t\tdisplay: block;\n\t\t\t\twidth: 100%;\n\t\t\t}\n\t\t\t." + WUI_EDITOR_CLASS_LINE_NUMBER + " {\n\t\t\t\tcolor: dimgrey;\n\t\t\t\tcursor: pointer;\n\t\t\t\tdisplay: inline-block;\n\t\t\t\tpadding: 4px 10px 4px 4px;\n\t\t\t\ttext-align: right;\n\t\t\t\tuser-select: none;\n\t\t\t\tvertical-align: top;\n\t\t\t\twidth: 30px;\n\t\t\t}\n\t\t\t." + WUI_EDITOR_CLASS_LINE_NUMBER + ":hover {\n\t\t\t\tbackground-color: lightsalmon;\n\t\t\t}\n\t\t\t." + WUI_EDITOR_CLASS_LINE_TEXT + " {\n\t\t\t\tdisplay: inline-block;\n\t\t\t\tpadding: 4px;\n\t\t\t\tborder-color: lightblue;\n\t\t\t\tborder-width: 0px;\n\t\t\t\tborder-style: solid;\n\t\t\t\twhite-space: pre-wrap;\n\t\t\t\twidth: calc(100% - 60px);\n\t\t\t}\n\t\t";
            document.head.appendChild(style);
        };
        WuiEditor.prototype.doJoin = function (changes) {
            this.lines[changes.curr_line].el_text.innerText = changes.curr_text;
            this.deleteLine(changes.next_line);
            this.setCaret(this.lines[changes.curr_line].el_text, 0);
        };
        WuiEditor.prototype.doSplit = function (changes) {
            this.lines[changes.curr_line].el_text.innerText = changes.curr_text;
            this.insertNewline(changes.next_line, changes.next_text);
        };
        WuiEditor.prototype.doUpdate = function (changes) {
            this.lines[changes.curr_line].el_text.innerText = changes.curr_text;
            this.setCaret(this.lines[changes.curr_line].el_text, 0);
        };
        WuiEditor.prototype.doRedo = function () {
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
        WuiEditor.prototype.doUndo = function () {
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
        WuiEditor.prototype.deleteLine = function (x) {
            this.lines.splice(x, 1);
            this.raw_lines.splice(x, 1);
            // Reset the line numbers.
            for (; x < this.lines.length; x++) {
                this.lines[x].SetNumber(x);
            }
            this.render();
        };
        WuiEditor.prototype.insertNewline = function (x, text) {
            var newline = new WuiEditorLine(x, text, this);
            for (var y = x; y < this.lines.length; y++) {
                this.lines[y].SetNumber(y + 1);
            }
            this.lines.splice(x, 0, newline);
            this.raw_lines.splice(x, 0, text);
            this.render();
            this.setCaret(newline.el_text, 0);
        };
        WuiEditor.prototype.onKeyupDocument = function (ed, ev) {
            switch (ev.key) {
                case "Escape":
                    ev.preventDefault();
                    ed.clearSelection();
                    break;
            }
            return true;
        };
        WuiEditor.prototype.render = function () {
            this.el.innerHTML = "";
            for (var _i = 0, _a = this.lines; _i < _a.length; _i++) {
                var line = _a[_i];
                this.el.appendChild(line.el);
            }
        };
        WuiEditor.prototype.setCaret = function (el_text, off) {
            if (el_text.firstChild) {
                this.range.setStart(el_text.firstChild, off);
            }
            else {
                this.range.setStart(el_text, off);
            }
            this.range.collapse(true);
            this.sel.removeAllRanges();
            this.sel.addRange(this.range);
        };
        return WuiEditor;
    }());
    exports.WuiEditor = WuiEditor;
    var WuiEditorLine = /** @class */ (function () {
        function WuiEditorLine(x, text, ed) {
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
            this.el_number.onmousedown = function (ev) {
                ed.OnMouseDownAtLine(_this.line_num);
            };
            this.el_number.onmouseup = function (ev) {
                ed.OnMouseUpAtLine(_this.line_num);
            };
            this.el_text = document.createElement("span");
            this.el_text.classList.add(WUI_EDITOR_CLASS_LINE_TEXT);
            this.el_text.innerText = text;
            this.el_text.contentEditable = "true";
            this.el_text.onclick = function (ev) {
                ed.OnClickText(_this.el_text);
            };
            this.el_text.onkeydown = function (ev) {
                return ed.OnKeydownOnLine(_this.line_num, _this.el_text, ev);
            };
            this.el_text.onkeyup = function (ev) {
                return ed.OnKeyup(_this.line_num, _this.el_text, ev);
            };
            this.el_text.addEventListener("paste", function (ev) {
                if (!ev.clipboardData) {
                    return;
                }
                ev.preventDefault();
                var text = ev.clipboardData.getData("text/plain");
                document.execCommand("insertHTML", false, text);
            });
            this.el.appendChild(this.el_number);
            this.el.appendChild(this.el_text);
        }
        WuiEditorLine.prototype.SetNumber = function (x) {
            this.line_num = x;
            this.el_number.innerText = x + 1 + "";
        };
        WuiEditorLine.prototype.SetEditOn = function () {
            this.el_text.contentEditable = "true";
        };
        WuiEditorLine.prototype.SetEditOff = function () {
            this.el_text.contentEditable = "false";
        };
        return WuiEditorLine;
    }());
    //
    // WuiEditorUndoRedo store the state of actions.
    //
    var WuiEditorUndoRedo = /** @class */ (function () {
        function WuiEditorUndoRedo() {
            this.idx = 0;
            this.actions = [];
        }
        WuiEditorUndoRedo.prototype.DoJoin = function (prevLine, prevText, curr_text) {
            var curr_line = prevLine + 1;
            var action = {
                kind: "join",
                before: {
                    curr_line: prevLine,
                    curr_text: prevText,
                    next_line: prevLine + 1,
                    next_text: curr_text,
                },
                after: {
                    curr_line: prevLine,
                    curr_text: prevText + curr_text,
                    next_line: prevLine + 1,
                    next_text: "",
                },
            };
            if (this.actions.length > 0) {
                this.actions = this.actions.slice(0, this.idx);
            }
            this.actions.push(action);
            this.idx++;
        };
        WuiEditorUndoRedo.prototype.DoSplit = function (curr_line, curr_text, next_text) {
            var action = {
                kind: "split",
                before: {
                    curr_line: curr_line,
                    curr_text: curr_text + next_text,
                    next_line: curr_line + 1,
                    next_text: "",
                },
                after: {
                    curr_line: curr_line,
                    curr_text: curr_text,
                    next_line: curr_line + 1,
                    next_text: next_text,
                },
            };
            if (this.actions.length > 0) {
                this.actions = this.actions.slice(0, this.idx);
            }
            this.actions.push(action);
            this.idx++;
        };
        WuiEditorUndoRedo.prototype.DoUpdate = function (line_num, text_before, text_after) {
            var action = {
                kind: "update",
                before: {
                    curr_line: line_num,
                    curr_text: text_before,
                    next_line: 0,
                    next_text: "",
                },
                after: {
                    curr_line: line_num,
                    curr_text: text_after,
                    next_line: 0,
                    next_text: "",
                },
            };
            if (this.actions.length > 0) {
                this.actions = this.actions.slice(0, this.idx);
            }
            this.actions.push(action);
            this.idx++;
        };
        WuiEditorUndoRedo.prototype.Undo = function () {
            if (this.idx == 0) {
                return null;
            }
            this.idx--;
            return this.actions[this.idx];
        };
        WuiEditorUndoRedo.prototype.Redo = function () {
            if (this.idx == this.actions.length) {
                return null;
            }
            var action = this.actions[this.idx];
            this.idx++;
            return action;
        };
        return WuiEditorUndoRedo;
    }());
});
// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
define("wui/notif/notif", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WuiNotif = void 0;
    var WUI_NOTIF_ID = "wui_notif";
    var WUI_NOTIF_CLASS_INFO = "wui_notif_info";
    var WUI_NOTIF_CLASS_ERROR = "wui_notif_error";
    //
    // WuiNotif implement the HTML interface to display pop-up notification.
    // The notification can be triggered by calling method Info() or Error().
    // Each pop-up has 5 seconds duration, after that they will be removed
    // automatically.
    //
    var WuiNotif = /** @class */ (function () {
        function WuiNotif() {
            this.timeout = 5000; // 5 seconds timeout
            this.el = document.createElement("div");
            this.el.id = WUI_NOTIF_ID;
            document.body.appendChild(this.el);
            this.initStyle();
        }
        // Info show the msg as information.
        WuiNotif.prototype.Info = function (msg) {
            var _this = this;
            var item = document.createElement("div");
            item.innerHTML = msg;
            item.classList.add(WUI_NOTIF_CLASS_INFO);
            this.el.appendChild(item);
            setTimeout(function () {
                _this.el.removeChild(item);
            }, this.timeout);
        };
        // Info show the msg as an error.
        WuiNotif.prototype.Error = function (msg) {
            var _this = this;
            var item = document.createElement("div");
            item.innerHTML = msg;
            item.classList.add(WUI_NOTIF_CLASS_ERROR);
            this.el.appendChild(item);
            setTimeout(function () {
                _this.el.removeChild(item);
            }, this.timeout);
        };
        WuiNotif.prototype.initStyle = function () {
            var style = document.createElement("style");
            style.type = "text/css";
            style.innerText = "\n\t\t\t#" + WUI_NOTIF_ID + " {\n\t\t\t\tleft: 10%;\n\t\t\t\tposition: fixed;\n\t\t\t\ttop: 1em;\n\t\t\t\twidth: 80%;\n\t\t\t}\n\t\t\t." + WUI_NOTIF_CLASS_INFO + " {\n\t\t\t\tborder: 1px solid silver;\n\t\t\t\tbackground-color: honeydew;\n\t\t\t\tmargin-bottom: 1em;\n\t\t\t\tpadding: 1em;\n\t\t\t}\n\t\t\t." + WUI_NOTIF_CLASS_ERROR + " {\n\t\t\t\tborder: 1px solid salmon;\n\t\t\t\tbackground-color: lightsalmon;\n\t\t\t\tmargin-bottom: 1em;\n\t\t\t\tpadding: 1em;\n\t\t\t}\n\t\t";
            document.head.appendChild(style);
        };
        return WuiNotif;
    }());
    exports.WuiNotif = WuiNotif;
});
define("awwan", ["require", "exports", "wui/editor/editor", "wui/notif/notif", "wui/vfs/vfs"], function (require, exports, editor_1, notif_1, vfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Awwan = exports.renderHtml = void 0;
    var ID_BTN_EXEC_LOCAL = "com_btn_local";
    var ID_BTN_EXEC_REMOTE = "com_btn_remote";
    var ID_BTN_NEW_DIR = "com_btn_new_dir";
    var ID_BTN_NEW_FILE = "com_btn_new_file";
    var ID_BTN_SAVE = "com_btn_save";
    var ID_INP_VFS_NEW = "com_inp_vfs_new";
    var ID_VFS_PATH = "vfs_path";
    var ID_STDOUT = "stdout";
    var ID_STDERR = "stderr";
    var MAX_FILE_SIZE = 3000000;
    function renderHtml() {
        var el = document.createElement("div");
        el.classList.add("awwan");
        el.innerHTML = "\n\t\t\t<div class=\"awwan_nav_left\">\n\t\t\t\t<div id=\"vfs\"></div>\n\n\t\t\t\t<br/>\n\t\t\t\t<div class=\"" + ID_INP_VFS_NEW + "\">\n\t\t\t\t\t<input id=\"" + ID_INP_VFS_NEW + "\" />\n\t\t\t\t</div>\n\t\t\t\t<button id=\"" + ID_BTN_NEW_DIR + "\">New directory</button>\n\t\t\t\t<button id=\"" + ID_BTN_NEW_FILE + "\">New file</button>\n\t\t\t</div>\n\t\t\t<div class=\"awwan_content\">\n\t\t\t\t<div class=\"editor_action\">\n\t\t\t\t\tFile: <span id=\"" + ID_VFS_PATH + "\">-</span>\n\t\t\t\t\t<button id=\"" + ID_BTN_SAVE + "\" disabled=\"true\">Save</button>\n\t\t\t\t</div>\n\t\t\t\t<div id=\"editor\"></div>\n\t\t\t\t<div class=\"execute_action\">\n\t\t\t\t\tExecute script on\n\t\t\t\t\t<button id=\"" + ID_BTN_EXEC_LOCAL + "\" disabled=\"true\">Local</button>\n\t\t\t\t\tor\n\t\t\t\t\t<button id=\"" + ID_BTN_EXEC_REMOTE + "\" disabled=\"true\">Remote</button>\n\t\t\t\t</div>\n\t\t\t\t<p>Hints:</p>\n\t\t\t\t<ul>\n\t\t\t\t\t<li>\n\t\t\t\t\t\tClick and drag on the line numbers to select the specific line to be\n\t\t\t\t\t\texecuted.\n\t\t\t\t\t</li>\n\t\t\t\t\t<li>Press ESC to clear selection.</li>\n\t\t\t\t</ul>\n\t\t\t\t<div class=\"boxheader\">Standard output:</div>\n\t\t\t\t<div id=\"" + ID_STDOUT + "\"></div>\n\t\t\t\t<div class=\"boxheader\">Standard error:</div>\n\t\t\t\t<div id=\"" + ID_STDERR + "\"></div>\n\t\t\t</div>\n\t\t";
        document.body.appendChild(el);
    }
    exports.renderHtml = renderHtml;
    var Awwan = /** @class */ (function () {
        function Awwan() {
            var _this = this;
            this.current_node = null;
            this.request = {
                mode: "local",
                script: "",
                content: "",
                begin_at: 0,
                end_at: 0,
            };
            var el = document.getElementById(ID_BTN_EXEC_LOCAL);
            if (el) {
                this.com_btn_local = el;
                this.com_btn_local.onclick = function () {
                    _this.execLocal();
                };
            }
            el = document.getElementById(ID_BTN_EXEC_REMOTE);
            if (el) {
                this.com_btn_remote = el;
                this.com_btn_remote.onclick = function () {
                    _this.execRemote();
                };
            }
            el = document.getElementById(ID_BTN_NEW_DIR);
            if (el) {
                this.com_btn_new_dir = el;
                this.com_btn_new_dir.onclick = function () {
                    _this.newNode(true);
                };
            }
            el = document.getElementById(ID_BTN_NEW_FILE);
            if (el) {
                this.com_btn_new_file = el;
                this.com_btn_new_file.onclick = function () {
                    _this.newNode(false);
                };
            }
            el = document.getElementById(ID_BTN_SAVE);
            if (el) {
                this.com_btn_save = el;
                this.com_btn_save.onclick = function () {
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
                id: "editor",
                is_editable: true,
                OnSelection: function (begin_at, end_at) {
                    _this.editorOnSelection(begin_at, end_at);
                },
                OnSave: this.editorOnSave,
            };
            this.wui_editor = new editor_1.WuiEditor(editor_opts);
            this.wui_notif = new notif_1.WuiNotif();
            var wui_vfs_opts = {
                id: "vfs",
                Open: function (path, is_dir) {
                    return _this.Open(path, is_dir);
                },
                OpenNode: function (node) {
                    return _this.OpenNode(node);
                },
            };
            this.wui_vfs = new vfs_1.WuiVfs(wui_vfs_opts);
            window.onhashchange = function (ev) {
                ev.preventDefault();
                var hashchange = ev;
                var url = new URL(hashchange.newURL);
                _this.onHashChange(url.hash);
            };
            // Open path based on hash.
            this.onHashChange(window.location.hash);
        }
        Awwan.prototype.onHashChange = function (hash) {
            if (hash === "") {
                hash = "#/";
            }
            hash = hash.substring(1);
            this.wui_vfs.OpenDir(hash);
        };
        // Open fetch the node content from remote server.
        Awwan.prototype.Open = function (path, is_dir) {
            return __awaiter(this, void 0, void 0, function () {
                var http_res, res, node, resAllow;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fetch("/awwan/api/fs?path=" + path)];
                        case 1:
                            http_res = _a.sent();
                            return [4 /*yield*/, http_res.json()];
                        case 2:
                            res = _a.sent();
                            if (res.code != 200) {
                                this.wui_notif.Error("Failed to open " + path + ": " + res.message);
                                return [2 /*return*/, res];
                            }
                            node = res.data;
                            this.com_inp_vfs_new.value = node.name;
                            if (is_dir) {
                                this.current_node = node;
                                window.location.hash = "#" + path;
                                return [2 /*return*/, res];
                            }
                            resAllow = this.isEditAllowed(node);
                            if (resAllow.code != 200) {
                                this.wui_notif.Error(resAllow.message);
                                return [2 /*return*/, resAllow];
                            }
                            this.com_file_path.innerText = path;
                            this.request.script = path;
                            this.wui_editor.Open(node);
                            this.com_btn_local.disabled = false;
                            this.com_btn_remote.disabled = false;
                            this.com_btn_save.disabled = false;
                            return [2 /*return*/, res];
                    }
                });
            });
        };
        // OpenNode is an handler that will called when user click on of the
        // item in the list.
        Awwan.prototype.OpenNode = function (node) {
            return __awaiter(this, void 0, void 0, function () {
                var resAllow, res;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            resAllow = this.isEditAllowed(node);
                            if (resAllow.code != 200) {
                                this.wui_notif.Error(resAllow.message);
                                return [2 /*return*/, resAllow];
                            }
                            return [4 /*yield*/, this.Open(node.path, node.is_dir)];
                        case 1:
                            res = _a.sent();
                            return [2 /*return*/, res];
                    }
                });
            });
        };
        Awwan.prototype.isEditAllowed = function (node) {
            var res = {
                code: 412,
                message: "",
            };
            var is_type_allowed = false;
            if (node.content_type.indexOf("json") >= 0 ||
                node.content_type.indexOf("message") >= 0 ||
                node.content_type.indexOf("script") >= 0 ||
                node.content_type.indexOf("text") >= 0 ||
                node.content_type.indexOf("xml") >= 0) {
                is_type_allowed = true;
            }
            if (!is_type_allowed) {
                res.message = "The file \"" + node.name + "\" with content type \"" + node.content_type + "\" is not allowed to be opened";
                return res;
            }
            if (node.size > MAX_FILE_SIZE) {
                res.message = "The file \"" + node.name + "\" with size " + node.size / 1000000 + "MB is greater than maximum " + MAX_FILE_SIZE / 1000000 + "MB.";
                return res;
            }
            res.code = 200;
            return res;
        };
        Awwan.prototype.onClickSave = function () {
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
        Awwan.prototype.editorOnSave = function (content) {
            this.doSaveFile(this.request.script, content);
        };
        Awwan.prototype.doSaveFile = function (path, content) {
            return __awaiter(this, void 0, void 0, function () {
                var req, http_res, res;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            req = {
                                path: path,
                                content: btoa(content),
                            };
                            return [4 /*yield*/, fetch("/awwan/api/fs", {
                                    method: "PUT",
                                    headers: {
                                        Accept: "application/json",
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify(req),
                                })];
                        case 1:
                            http_res = _a.sent();
                            return [4 /*yield*/, http_res.json()];
                        case 2:
                            res = _a.sent();
                            if (res.code != 200) {
                                this.wui_notif.Error("Failed to save file " + path + ": " + res.message);
                                return [2 /*return*/, null];
                            }
                            this.wui_notif.Info("File " + path + " has been saved.");
                            return [2 /*return*/, res];
                    }
                });
            });
        };
        Awwan.prototype.editorOnSelection = function (begin, end) {
            var stmts = this.wui_editor.lines.slice(begin, end + 1);
            for (var _i = 0, stmts_1 = stmts; _i < stmts_1.length; _i++) {
                var stmt = stmts_1[_i];
                console.log("stmt:", stmt.x, stmt.text);
            }
        };
        // execLocal request to execute the selected script on local system.
        Awwan.prototype.execLocal = function () {
            if (this.request.script == "") {
                this.wui_notif.Error("Execute on local: no file selected");
                return;
            }
            this.httpApiExecute("local");
        };
        // execRemote request to execute the selected script on remote system.
        Awwan.prototype.execRemote = function () {
            if (this.request.script == "") {
                this.wui_notif.Error("Execute on remote: no file selected");
                return;
            }
            this.httpApiExecute("remote");
        };
        Awwan.prototype.httpApiExecute = function (mode) {
            return __awaiter(this, void 0, void 0, function () {
                var selection_range, http_res, res;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            selection_range = this.wui_editor.GetSelectionRange();
                            if (selection_range.begin_at < 0) {
                                this.request.begin_at = 0;
                            }
                            else {
                                this.request.begin_at = selection_range.begin_at + 1;
                            }
                            if (selection_range.end_at < 0) {
                                this.request.end_at = 0;
                            }
                            else {
                                this.request.end_at = selection_range.end_at + 1;
                            }
                            this.request.mode = mode;
                            this.request.content = btoa(this.wui_editor.GetContent());
                            return [4 /*yield*/, fetch("/awwan/api/execute", {
                                    method: "POST",
                                    headers: {
                                        Accept: "application/json",
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify(this.request),
                                })];
                        case 1:
                            http_res = _a.sent();
                            return [4 /*yield*/, http_res.json()];
                        case 2:
                            res = _a.sent();
                            if (res.code != 200) {
                                this.wui_notif.Error("Execute failed: " + res.message);
                                return [2 /*return*/];
                            }
                            this.com_stdout.innerText = atob(res.data.stdout);
                            if (res.data.stderr) {
                                this.com_stderr.innerText = atob(res.data.stderr);
                            }
                            this.wui_notif.Info("Successfully execute " + this.request.script + " on " + mode + ".");
                            return [2 /*return*/];
                    }
                });
            });
        };
        Awwan.prototype.newNode = function (is_dir) {
            return __awaiter(this, void 0, void 0, function () {
                var name, req, http_res, res, node;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!this.current_node) {
                                this.wui_notif.Error("No active directory loaded or selected.");
                                return [2 /*return*/];
                            }
                            name = this.com_inp_vfs_new.value;
                            if (name === "") {
                                this.wui_notif.Error("Empty file name");
                                return [2 /*return*/];
                            }
                            req = {
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
                            return [4 /*yield*/, fetch("/awwan/api/fs", {
                                    method: "POST",
                                    headers: {
                                        Accept: "application/json",
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify(req),
                                })];
                        case 1:
                            http_res = _a.sent();
                            return [4 /*yield*/, http_res.json()];
                        case 2:
                            res = _a.sent();
                            if (res.code != 200) {
                                this.wui_notif.Error("newNode: " + res.message);
                                return [2 /*return*/];
                            }
                            node = res.data;
                            this.current_node.childs.push(node);
                            this.wui_vfs.Set(this.current_node);
                            return [2 /*return*/];
                    }
                });
            });
        };
        return Awwan;
    }());
    exports.Awwan = Awwan;
});
define("main", ["require", "exports", "awwan"], function (require, exports, awwan_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, awwan_1.renderHtml)();
    var awwan = new awwan_1.Awwan();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInd1aS9yZXNwb25zZS50cyIsInd1aS92ZnMvdmZzLnRzIiwid3VpL2VkaXRvci9lZGl0b3IudHMiLCJ3dWkvbm90aWYvbm90aWYudHMiLCJhd3dhbi50cyIsIm1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ0FBLGtFQUFrRTtBQUNsRSx5RUFBeUU7QUFDekUsNkJBQTZCOzs7OztJQStCN0I7UUFLQyxnQkFBbUIsSUFBbUI7WUFBdEMsaUJBbUJDO1lBbkJrQixTQUFJLEdBQUosSUFBSSxDQUFlO1lBQ3JDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFBO1lBRWhCLElBQUksRUFBRSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1lBQ3pDLElBQUksQ0FBQyxFQUFFLEVBQUU7Z0JBQ1IsT0FBTyxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFBO2dCQUN6RCxPQUFNO2FBQ047WUFDRCxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQTtZQUVaLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxVQUFVLENBQUMsVUFBQyxJQUFZO2dCQUMzQyxLQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFBO1lBQ25CLENBQUMsQ0FBQyxDQUFBO1lBQ0YsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUVyQyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksVUFBVSxDQUFDLFVBQUMsSUFBeUI7Z0JBQ3hELEtBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUE7WUFDcEIsQ0FBQyxDQUFDLENBQUE7WUFDRixJQUFJLENBQUMsRUFBRSxD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