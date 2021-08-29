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
    exports.WuiVfsNode = exports.WuiVfs = void 0;
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
                var res, node;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.opts.Open(path, true)];
                        case 1:
                            res = _a.sent();
                            if (res.code != 200) {
                                return [2 /*return*/];
                            }
                            node = new WuiVfsNode(res.data);
                            this.com_path.Open(node);
                            this.com_list.Open(node);
                            return [2 /*return*/];
                    }
                });
            });
        };
        return WuiVfs;
    }());
    exports.WuiVfs = WuiVfs;
    var WuiVfsNode = /** @class */ (function () {
        function WuiVfsNode(opts) {
            this.path = opts.path || "";
            this.name = opts.name || "";
            this.content_type = opts.content_type || "";
            this.mod_time = opts.mod_time || 0;
            this.size = opts.size || 0;
            this.mode = opts.mode || "";
            this.is_dir = opts.is_dir || false;
            this.childs = [];
            if (opts.childs) {
                for (var _i = 0, _a = opts.childs; _i < _a.length; _i++) {
                    var c = _a[_i];
                    this.childs.push(new WuiVfsNode(c));
                }
            }
        }
        return WuiVfsNode;
    }());
    exports.WuiVfsNode = WuiVfsNode;
    var WuiVfsList = /** @class */ (function () {
        function WuiVfsList(onClick) {
            this.onClick = onClick;
            this.el = document.createElement("div");
            this.el.style.borderWidth = "1px";
            this.el.style.borderStyle = "solid";
            this.el.style.borderColor = "silver";
        }
        WuiVfsList.prototype.Open = function (node) {
            var _this = this;
            this.el.innerHTML = "";
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
            for (var _i = 0, _a = node.childs; _i < _a.length; _i++) {
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
            var content = atob(node.content || "");
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
    var ID_BTN_LOCAL = "com_btn_local";
    var ID_BTN_REMOTE = "com_btn_remote";
    var ID_BTN_SAVE = "com_btn_save";
    var ID_VFS_PATH = "vfs_path";
    var ID_STDOUT = "stdout";
    var ID_STDERR = "stderr";
    var MAX_FILE_SIZE = 3000000;
    function renderHtml() {
        var el = document.createElement("div");
        el.classList.add("awwan");
        el.innerHTML = "\n\t\t\t<div class=\"awwan_nav_left\">\n\t\t\t\t<div id=\"vfs\"></div>\n\t\t\t</div>\n\t\t\t<div class=\"awwan_content\">\n\t\t\t\t<div class=\"editor_action\">\n\t\t\t\t\tFile: <span id=\"" + ID_VFS_PATH + "\">-</span>\n\t\t\t\t\t<button id=\"" + ID_BTN_SAVE + "\">Save</button>\n\t\t\t\t</div>\n\t\t\t\t<div id=\"editor\"></div>\n\t\t\t\t<div class=\"execute_action\">\n\t\t\t\t\tExecute script on\n\t\t\t\t\t<button id=\"" + ID_BTN_LOCAL + "\">Local</button>\n\t\t\t\t\tor\n\t\t\t\t\t<button id=\"" + ID_BTN_REMOTE + "\">Remote</button>\n\t\t\t\t</div>\n\t\t\t\t<p>Hints:</p>\n\t\t\t\t<ul>\n\t\t\t\t\t<li>\n\t\t\t\t\t\tClick and drag on the line numbers to select the specific line to be\n\t\t\t\t\t\texecuted.\n\t\t\t\t\t</li>\n\t\t\t\t\t<li>Press ESC to clear selection.</li>\n\t\t\t\t</ul>\n\t\t\t\t<div class=\"boxheader\">Standard output:</div>\n\t\t\t\t<div id=\"" + ID_STDOUT + "\"></div>\n\t\t\t\t<div class=\"boxheader\">Standard error:</div>\n\t\t\t\t<div id=\"" + ID_STDERR + "\"></div>\n\t\t\t</div>\n\t\t";
        document.body.appendChild(el);
    }
    exports.renderHtml = renderHtml;
    var Awwan = /** @class */ (function () {
        function Awwan() {
            var _this = this;
            this.request = {
                mode: "local",
                script: "",
                content: "",
                begin_at: 0,
                end_at: 0,
            };
            var el = document.getElementById(ID_BTN_LOCAL);
            if (el) {
                this.com_btn_local = el;
                this.com_btn_local.onclick = function () {
                    _this.execLocal();
                };
            }
            el = document.getElementById(ID_BTN_REMOTE);
            if (el) {
                this.com_btn_remote = el;
                this.com_btn_remote.onclick = function () {
                    _this.execRemote();
                };
            }
            el = document.getElementById(ID_BTN_SAVE);
            if (el) {
                this.com_btn_save = el;
                this.com_btn_save.onclick = function () {
                    _this.onClickSave();
                };
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
                var http_res, res, resAllow;
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
                            if (is_dir) {
                                window.location.hash = "#" + path;
                                return [2 /*return*/, res];
                            }
                            resAllow = this.isEditAllowed(res.data);
                            if (resAllow.code != 200) {
                                this.wui_notif.Error(resAllow.message);
                                return [2 /*return*/, resAllow];
                            }
                            this.com_file_path.innerText = path;
                            this.request.script = path;
                            this.wui_editor.Open(res.data);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInd1aS9yZXNwb25zZS50cyIsInd1aS92ZnMvdmZzLnRzIiwid3VpL2VkaXRvci9lZGl0b3IudHMiLCJ3dWkvbm90aWYvbm90aWYudHMiLCJhd3dhbi50cyIsIm1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ0FBLGtFQUFrRTtBQUNsRSx5RUFBeUU7QUFDekUsNkJBQTZCOzs7OztJQTRCN0I7UUFLQyxnQkFBbUIsSUFBbUI7WUFBdEMsaUJBbUJDO1lBbkJrQixTQUFJLEdBQUosSUFBSSxDQUFlO1lBQ3JDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFBO1lBRWhCLElBQUksRUFBRSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1lBQ3pDLElBQUksQ0FBQyxFQUFFLEVBQUU7Z0JBQ1IsT0FBTyxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFBO2dCQUN6RCxPQUFNO2FBQ047WUFDRCxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQTtZQUVaLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxVQUFVLENBQUMsVUFBQyxJQUFZO2dCQUMzQyxLQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFBO1lBQ25CLENBQUMsQ0FBQyxDQUFBO1lBQ0YsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUVyQyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksVUFBVSxDQUFDLFVBQUMsSUFBZ0I7Z0JBQy9DLEtBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUE7WUFDcEIsQ0FBQyxDQUFDLENBQUE7WUFDRixJQUFJLENBQUMsRUFBRSxD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