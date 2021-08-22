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
            var res, content, x, line;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrRUFBa0U7QUFDbEUseUVBQXlFO0FBQ3pFLDZCQUE2Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBYzdCO0lBZUMsZ0JBQW1CLElBQWE7UUFBYixTQUFJLEdBQUosSUFBSSxDQUFTO1FBWHhCLGVBQVUsR0FBb0IsSUFBSSxDQUFBO1FBQ2xDLGVBQVUsR0FBdUIsSUFBSSxDQUFBO1FBQ3JDLGVBQVUsR0FBVyxDQUFDLENBQUMsQ0FBQTtRQUN2QixhQUFRLEdBQVcsQ0FBQyxDQUFDLENBQUE7UUFDckIsYUFBUSxHQUFhLEVBQUUsQ0FBQTtRQUN2QixVQUFLLEdBQWlCLEVBQUUsQ0FBQTtRQUN4QixRQUFHLEdBQXFCLElBQUksQ0FBQTtRQUU1QixpQkFBWSxHQUFZLEtBQUssQ0FBQTtRQUM3QixTQUFJLEdBQWEsSUFBSSxRQUFRLEVBQUUsQ0FBQTtRQUd0QyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUE7UUFDakIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFBO1FBRW5DLElBQUksQ0FBQyxFQUFFLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDMUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUU7WUFDYixPQUFPLENBQUMsS0FBSyxDQUFDLCtCQUErQixFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUN2RCxPQUFNO1NBQ047UUFFRCxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUE7UUFFaEIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFBO1FBRW5DLElBQUksQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFBO1FB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