"use strict";
// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
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
exports.__esModule = true;
exports.Editor = void 0;
var Editor = /** @class */ (function () {
    function Editor(opts) {
        this.opts = opts;
        this.activeFile = null;
        this.activeText = null;
        this.rangeBegin = -1;
        this.rangeEnd = -1;
        this.rawLines = [];
        this.lines = [];
        this.sel = null;
        this.isKeyControl = false;
        this.unre = new UndoRedo();
        this.id = opts.id;
        this.is_editable = opts.is_editable;
        this.el = document.getElementById(opts.id);
        if (!this.el) {
            console.error("Editor: element ID not found:", opts.id);
            return;
        }
        this.initStyle();
        this.el.classList.add("wui-editor");
        this.sel = window.getSelection();
        this.range = document.createRange();
    }
    // GetContent return content of file.
    Editor.prototype.GetContent = function () {
        var content = "";
        for (var x = 0; x < this.lines.length; x++) {
            if (x > 0) {
                content += "\n";
            }
            content += this.lines[x].elText.innerText;
        }
        return content;
    };
    Editor.prototype.GetFile = function () {
        var node = {
            name: "",
            path: ""
        };
        if (!this.activeFile) {
            return node;
        }
        node.name = this.activeFile.name;
        node.path = this.activeFile.path;
        node.content = this.GetContent();
        return node;
    };
    Editor.prototype.GetSelectionRange = function () {
        return {
            BeginAt: this.rangeBegin,
            EndAt: this.rangeEnd
        };
    };
    Editor.prototype.OpenFile = function (path) {
        return __awaiter(this, void 0, void 0, function () {
            var res, content, nlines, x, line;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.el) {
                            return [2 /*return*/, { code: 500 }];
                        }
                        return [4 /*yield*/, this.opts.OpenFile(path)];
                    case 1:
                        res = _a.sent();
                        if (!res) {
                            return [2 /*return*/, { code: 500 }];
                        }
                        if (res.code != 200) {
                            return [2 /*return*/, res];
                        }
                        if (!res.data) {
                            return [2 /*return*/, res];
                        }
                        this.activeFile = res.data;
                        content = this.activeFile.content;
                        content = content.replace("\r\n", "\n");
                        this.rawLines = content.split("\n");
                        nlines = this.rawLines.length;
                        if (nlines > 0) {
                            if (this.rawLines[nlines - 1] == "") {
                                this.rawLines.splice(nlines - 1, 1);
                            }
                        }
                        this.lines = [];
                        for (x = 0; x < this.rawLines.length; x++) {
                            line = new EditorLine(x, this.rawLines[x], this);
                            this.lines.push(line);
                        }
                        this.render();
                        return [2 /*return*/, res];
                }
            });
        });
    };
    Editor.prototype.SaveFile = function (node) {
        var res = this.opts.SaveFile(node);
        return res;
    };
    Editor.prototype.clearSelection = function () {
        if (!this.el) {
            return;
        }
        if (this.rangeEnd == 0) {
            return;
        }
        for (var x = this.rangeBegin; x <= this.rangeEnd; x++) {
            this.el.children[x].setAttribute("style", "");
        }
        this.rangeBegin = -1;
        this.rangeEnd = -1;
    };
    Editor.prototype.initStyle = function () {
        var style = document.createElement("style");
        style.type = "text/css";
        style.innerText = "\n\t\t\t[contenteditable] {\n\t\t\t\toutline: 0px solid transparent;\n\t\t\t}\n\t\t\t.wui-editor {\n\t\t\t\tbackground-color: cornsilk;\n\t\t\t\tfont-family: monospace;\n\t\t\t\twidth: 100%;\n\t\t\t\toverflow-y: scroll;\n\t\t\t}\n\t\t\t.wui-editor-line {\n\t\t\t\tdisplay: table;\n\t\t\t}\n\t\t\t.wui-line-number {\n\t\t\t\t-moz-user-select: none;\n\t\t\t\t-ms-user-select: none;\n\t\t\t\t-webkit-user-select: none;\n\t\t\t\tcolor: dimgrey;\n\t\t\t\tcursor: pointer;\n\t\t\t\tdisplay: table-cell;\n\t\t\t\tpadding: 4px 1em 4px 4px;\n\t\t\t\ttext-align: right;\n\t\t\t\tuser-select: none;\n\t\t\t\twidth: 3em;\n\t\t\t}\n\t\t\t.wui-line-number:hover {\n\t\t\t\tbackground-color: lightsalmon;\n\t\t\t}\n\t\t\t.wui-line-text {\n\t\t\t\tdisplay: table-cell;\n\t\t\t\tpadding: 4px;\n\t\t\t\tborder-color: lightblue;\n\t\t\t\tborder-width: 0px;\n\t\t\t\tborder-style: solid;\n\t\t\t\twhite-space: pre-wrap;\n\t\t\t}\n\t\t";
        document.head.appendChild(style);
    };
    Editor.prototype.doJoin = function (changes) {
        this.lines[changes.currLine].elText.innerText = changes.currText;
        this.deleteLine(changes.nextLine);
        this.setCaret(this.lines[changes.currLine].elText, 0);
    };
    Editor.prototype.doSplit = function (changes) {
        this.lines[changes.currLine].elText.innerText = changes.currText;
        this.insertNewline(changes.nextLine, changes.nextText);
    };
    Editor.prototype.doUpdate = function (changes) {
        this.lines[changes.currLine].elText.innerText = changes.currText;
        this.setCaret(this.lines[changes.currLine].elText, 0);
    };
    Editor.prototype.doRedo = function () {
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
    Editor.prototype.doUndo = function () {
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
    Editor.prototype.deleteLine = function (x) {
        this.lines.splice(x, 1);
        this.rawLines.splice(x, 1);
        // Reset the line numbers.
        for (; x < this.lines.length; x++) {
            this.lines[x].setNumber(x);
        }
        this.render();
    };
    Editor.prototype.insertNewline = function (x, text) {
        var newline = new EditorLine(x, text, this);
        for (var y = x; y < this.lines.length; y++) {
            this.lines[y].setNumber(y + 1);
        }
        this.lines.splice(x, 0, newline);
        this.rawLines.splice(x, 0, text);
        this.render();
        this.setCaret(newline.elText, 0);
    };
    Editor.prototype.onClickText = function (text) {
        this.sel = window.getSelection();
    };
    Editor.prototype.onKeyup = function (x, text, ev) {
        var textBefore;
        var textAfter;
        switch (ev.key) {
            case "Alt":
            case "ArrowLeft":
            case "ArrowRight":
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
            case "ArrowUp":
                if (x == 0) {
                    return false;
                }
                if (!this.sel) {
                    return false;
                }
                ev.preventDefault();
                var elText = this.lines[x - 1].elText;
                var off = this.sel.focusOffset;
                if (off > elText.innerText.length) {
                    off = elText.innerText.length;
                }
                this.setCaret(elText, off);
                break;
            case "ArrowDown":
                if (x == this.lines.length - 1) {
                    return false;
                }
                if (!this.sel) {
                    return false;
                }
                ev.preventDefault();
                elText = this.lines[x + 1].elText;
                off = this.sel.focusOffset;
                if (off > elText.innerText.length) {
                    off = elText.innerText.length;
                }
                this.setCaret(elText, off);
                break;
            case "Backspace":
                if (!this.sel) {
                    return;
                }
                ev.preventDefault();
                var elTextCurr = this.lines[x].elText;
                textBefore = elTextCurr.innerText;
                off = this.sel.focusOffset;
                if (off > 0) {
                    textAfter =
                        textBefore.slice(0, off - 1) + textBefore.slice(off, textBefore.length);
                    this.unre.DoUpdate(x, textBefore, textAfter);
                    elTextCurr.innerText = textAfter;
                    this.rawLines[x] = textAfter;
                    this.setCaret(elTextCurr, off - 1);
                    return;
                }
                // Join current line with previous.
                var elTextPrev = this.lines[x - 1].elText;
                this.unre.DoJoin(x - 1, elTextPrev.innerText, elTextCurr.innerText);
                off = elTextPrev.innerText.length;
                elTextPrev.innerText = elTextPrev.innerText + elTextCurr.innerText;
                this.rawLines[x - 1] = elTextPrev.innerText;
                // Remove the current line
                this.deleteLine(x);
                this.setCaret(elTextPrev, off);
                break;
            case "Enter":
                ev.preventDefault();
                break;
            case "Tab":
                if (!this.sel) {
                    return false;
                }
                elText = this.lines[x].elText;
                off = this.sel.focusOffset;
                textBefore = elText.innerText;
                textAfter = textBefore.slice(0, off) + "\t" + textBefore.slice(off, textBefore.length);
                this.unre.DoUpdate(x, textBefore, textAfter);
                elText.innerText = textAfter;
                this.rawLines[x] = textAfter;
                this.setCaret(elText, off + 1);
                ev.preventDefault();
                break;
            case "Control":
                this.isKeyControl = false;
                break;
            case "r":
                if (this.isKeyControl) {
                    ev.preventDefault();
                    return;
                }
                break;
            case "z":
                if (this.isKeyControl) {
                    ev.preventDefault();
                    return;
                }
                break;
            default:
                if (this.isKeyControl) {
                    break;
                }
                this.unre.DoUpdate(x, this.rawLines[x], this.lines[x].elText.innerText);
                this.rawLines[x] = this.lines[x].elText.innerText;
        }
        return true;
    };
    Editor.prototype.onKeydown = function (x, elText, ev) {
        var textBefore;
        var textAfter;
        var off;
        switch (ev.key) {
            case "Control":
                this.isKeyControl = true;
                break;
            case "Enter":
                if (!this.sel) {
                    return;
                }
                ev.preventDefault();
                off = this.sel.focusOffset;
                var text = this.lines[x].elText.innerText;
                textBefore = text.slice(0, off);
                textAfter = text.slice(off, text.length);
                this.unre.DoSplit(x, textBefore, textAfter);
                this.lines[x].elText.innerText = textBefore;
                this.rawLines[x] = textBefore;
                this.insertNewline(x + 1, textAfter);
                break;
            case "Escape":
                ev.preventDefault();
                this.clearSelection();
                break;
            case "r":
                if (this.isKeyControl) {
                    ev.preventDefault();
                    this.doRedo();
                    return;
                }
                break;
            case "z":
                if (this.isKeyControl) {
                    ev.preventDefault();
                    this.doUndo();
                    return;
                }
                break;
        }
    };
    Editor.prototype.onMouseDownAtLine = function (x) {
        this.rangeBegin = x;
    };
    Editor.prototype.onMouseUpAtLine = function (x) {
        this.rangeEnd = x;
        if (this.rangeEnd < this.rangeBegin) {
            return;
        }
        if (!this.el) {
            return;
        }
        var y = 0;
        for (; y < this.rangeBegin; y++) {
            this.el.children[y].setAttribute("style", "");
        }
        for (; y <= this.rangeEnd; y++) {
            this.el.children[y].setAttribute("style", "background-color:lightsalmon");
        }
        for (; y < this.el.children.length; y++) {
            this.el.children[y].setAttribute("style", "");
        }
        if (this.opts.OnSelection) {
            this.opts.OnSelection(this.rangeBegin, this.rangeEnd);
        }
    };
    Editor.prototype.render = function () {
        if (!this.el) {
            return;
        }
        this.el.innerHTML = "";
        for (var _i = 0, _a = this.lines; _i < _a.length; _i++) {
            var line = _a[_i];
            this.el.appendChild(line.el);
        }
    };
    Editor.prototype.setCaret = function (elText, off) {
        if (!this.sel) {
            return;
        }
        if (elText.firstChild) {
            this.range.setStart(elText.firstChild, off);
        }
        else {
            this.range.setStart(elText, off);
        }
        this.range.collapse(true);
        this.sel.removeAllRanges();
        this.sel.addRange(this.range);
    };
    return Editor;
}());
exports.Editor = Editor;
var EditorLine = /** @class */ (function () {
    function EditorLine(x, text, ed) {
        var _this = this;
        this.x = x;
        this.text = text;
        this.lineNum = 0;
        this.lineNum = x;
        this.el = document.createElement("div");
        this.el.classList.add("wui-editor-line");
        this.elNumber = document.createElement("span");
        this.elNumber.classList.add("wui-line-number");
        this.elNumber.innerText = this.lineNum + 1 + "";
        this.elNumber.onmousedown = function (ev) {
            ed.onMouseDownAtLine(_this.lineNum);
        };
        this.elNumber.onmouseup = function (ev) {
            ed.onMouseUpAtLine(_this.lineNum);
        };
        this.elText = document.createElement("span");
        this.elText.classList.add("wui-line-text");
        this.elText.innerText = text;
        this.elText.contentEditable = "true";
        this.elText.onclick = function (ev) {
            ed.onClickText(_this.elText);
        };
        this.elText.onkeydown = function (ev) {
            return ed.onKeydown(_this.lineNum, _this.elText, ev);
        };
        this.elText.onkeyup = function (ev) {
            return ed.onKeyup(_this.lineNum, _this.elText, ev);
        };
        this.elText.addEventListener("paste", function (ev) {
            if (!ev.clipboardData) {
                return;
            }
            ev.preventDefault();
            var text = ev.clipboardData.getData("text/plain");
            document.execCommand("insertHTML", false, text);
        });
        this.el.appendChild(this.elNumber);
        this.el.appendChild(this.elText);
    }
    EditorLine.prototype.setNumber = function (x) {
        this.lineNum = x;
        this.elNumber.innerText = x + 1 + "";
    };
    return EditorLine;
}());
//
// UndoRedo store the state of actions.
//
var UndoRedo = /** @class */ (function () {
    function UndoRedo() {
        this.idx = 0;
        this.actions = [];
    }
    UndoRedo.prototype.DoJoin = function (prevLine, prevText, currText) {
        var currLine = prevLine + 1;
        var action = {
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
    };
    UndoRedo.prototype.DoSplit = function (currLine, currText, nextText) {
        var action = {
            kind: "split",
            before: {
                currLine: currLine,
                currText: currText + nextText,
                nextLine: currLine + 1,
                nextText: ""
            },
            after: {
                currLine: currLine,
                currText: currText,
                nextLine: currLine + 1,
                nextText: nextText
            }
        };
        if (this.actions.length > 0) {
            this.actions = this.actions.slice(0, this.idx);
        }
        this.actions.push(action);
        this.idx++;
    };
    UndoRedo.prototype.DoUpdate = function (lineNum, textBefore, textAfter) {
        var action = {
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
    };
    UndoRedo.prototype.Undo = function () {
        if (this.idx == 0) {
            return null;
        }
        this.idx--;
        return this.actions[this.idx];
    };
    UndoRedo.prototype.Redo = function () {
        if (this.idx == this.actions.length) {
            return null;
        }
        var action = this.actions[this.idx];
        this.idx++;
        return action;
    };
    return UndoRedo;
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrRUFBa0U7QUFDbEUseUVBQXlFO0FBQ3pFLDZCQUE2Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBZTdCO0lBZUMsZ0JBQW1CLElBQWE7UUFBYixTQUFJLEdBQUosSUFBSSxDQUFTO1FBWHhCLGVBQVUsR0FBb0IsSUFBSSxDQUFBO1FBQ2xDLGVBQVUsR0FBdUIsSUFBSSxDQUFBO1FBQ3JDLGVBQVUsR0FBVyxDQUFDLENBQUMsQ0FBQTtRQUN2QixhQUFRLEdBQVcsQ0FBQyxDQUFDLENBQUE7UUFDckIsYUFBUSxHQUFhLEVBQUUsQ0FBQTtRQUN2QixVQUFLLEdBQWlCLEVBQUUsQ0FBQTtRQUN4QixRQUFHLEdBQXFCLElBQUksQ0FBQTtRQUU1QixpQkFBWSxHQUFZLEtBQUssQ0FBQTtRQUM3QixTQUFJLEdBQWEsSUFBSSxRQUFRLEVBQUUsQ0FBQTtRQUd0QyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUE7UUFDakIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFBO1FBRW5DLElBQUksQ0FBQyxFQUFFLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDMUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUU7WUFDYixPQUFPLENBQUMsS0FBSyxDQUFDLCtCQUErQixFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUN2RCxPQUFNO1NBQ047UUFFRCxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUE7UUFFaEIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFBO1FBRW5DLElBQUksQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFBO1FB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