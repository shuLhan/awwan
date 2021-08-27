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
        style.innerText = "\n\t\t\t[contenteditable] {\n\t\t\t\toutline: 0px solid transparent;\n\t\t\t}\n\t\t\t.wui-editor {\n\t\t\t\tbackground-color: cornsilk;\n\t\t\t\tfont-family: monospace;\n\t\t\t\toverflow-y: auto;\n\t\t\t\twidth: 100%;\n\t\t\t}\n\t\t\t.wui-editor-line {\n\t\t\t\tdisplay: block;\n\t\t\t\twidth: 100%;\n\t\t\t}\n\t\t\t.wui-line-number {\n\t\t\t\tcolor: dimgrey;\n\t\t\t\tcursor: pointer;\n\t\t\t\tdisplay: inline-block;\n\t\t\t\tpadding: 4px 10px 4px 4px;\n\t\t\t\ttext-align: right;\n\t\t\t\tuser-select: none;\n\t\t\t\tvertical-align: top;\n\t\t\t\twidth: 30px;\n\t\t\t}\n\t\t\t.wui-line-number:hover {\n\t\t\t\tbackground-color: lightsalmon;\n\t\t\t}\n\t\t\t.wui-line-text {\n\t\t\t\tdisplay: inline-block;\n\t\t\t\tpadding: 4px;\n\t\t\t\tborder-color: lightblue;\n\t\t\t\tborder-width: 0px;\n\t\t\t\tborder-style: solid;\n\t\t\t\twhite-space: pre-wrap;\n\t\t\t\twidth: calc(100% - 60px);\n\t\t\t}\n\t\t";
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
                if (!this.sel) {
                    return false;
                }
                ev.preventDefault();
                textBefore = this.rawLines[x];
                var elTextCurr = this.lines[x].elText;
                textAfter = elTextCurr.innerText;
                off = this.sel.focusOffset;
                if (off > 0) {
                    this.unre.DoUpdate(x, textBefore, textAfter);
                    this.rawLines[x] = textAfter;
                    this.setCaret(elTextCurr, off);
                    return false;
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
                return false;
            case "Control":
                this.isKeyControl = false;
                break;
            case "Enter":
                ev.preventDefault();
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
            case "ArrowUp":
                if (x == 0) {
                    return false;
                }
                if (!this.el) {
                    return false;
                }
                if (!this.sel) {
                    return false;
                }
                ev.preventDefault();
                var elText_1 = this.lines[x - 1].elText;
                var off_1 = this.sel.focusOffset;
                if (off_1 > elText_1.innerText.length) {
                    off_1 = elText_1.innerText.length;
                }
                this.setCaret(elText_1, off_1);
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
                if (!this.el) {
                    return false;
                }
                if (!this.sel) {
                    return false;
                }
                ev.preventDefault();
                elText_1 = this.lines[x + 1].elText;
                off_1 = this.sel.focusOffset;
                if (off_1 > elText_1.innerText.length) {
                    off_1 = elText_1.innerText.length;
                }
                this.setCaret(elText_1, off_1);
                x += 2;
                if (x * 25 >= this.el.clientHeight + this.el.scrollTop) {
                    this.el.scrollTop += 25;
                }
                return false;
            case "Control":
                this.isKeyControl = true;
                break;
            case "Enter":
                if (!this.el) {
                    return;
                }
                if (!this.sel) {
                    return;
                }
                ev.preventDefault();
                off_1 = this.sel.focusOffset;
                var text = this.lines[x].elText.innerText;
                textBefore = text.slice(0, off_1);
                textAfter = text.slice(off_1, text.length);
                this.unre.DoSplit(x, textBefore, textAfter);
                this.lines[x].elText.innerText = textBefore;
                this.rawLines[x] = textBefore;
                this.insertNewline(x + 1, textAfter);
                console.log("scroll", x, this.rawLines.length);
                if (x + 3 >= this.rawLines.length) {
                    this.el.scrollTop = this.el.scrollHeight;
                }
                break;
            case "Escape":
                ev.preventDefault();
                this.clearSelection();
                break;
            case "Tab":
                if (!this.sel) {
                    return false;
                }
                ev.preventDefault();
                elText_1 = this.lines[x].elText;
                off_1 = this.sel.focusOffset;
                textBefore = elText_1.innerText;
                textAfter = textBefore.slice(0, off_1) + "\t" + textBefore.slice(off_1, textBefore.length);
                this.unre.DoUpdate(x, textBefore, textAfter);
                elText_1.innerText = textAfter;
                this.rawLines[x] = textAfter;
                this.setCaret(elText_1, off_1 + 1);
                break;
            case "r":
                if (this.isKeyControl) {
                    ev.preventDefault();
                    this.doRedo();
                    return;
                }
                break;
            case "s":
                if (this.isKeyControl) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    if (this.opts.OnSave) {
                        this.opts.OnSave(this.GetContent());
                    }
                    return false;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrRUFBa0U7QUFDbEUseUVBQXlFO0FBQ3pFLDZCQUE2Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaUI3QjtJQWVDLGdCQUFtQixJQUFhO1FBQWIsU0FBSSxHQUFKLElBQUksQ0FBUztRQVh4QixlQUFVLEdBQW9CLElBQUksQ0FBQTtRQUNsQyxlQUFVLEdBQXVCLElBQUksQ0FBQTtRQUNyQyxlQUFVLEdBQVcsQ0FBQyxDQUFDLENBQUE7UUFDdkIsYUFBUSxHQUFXLENBQUMsQ0FBQyxDQUFBO1FBQ3JCLGFBQVEsR0FBYSxFQUFFLENBQUE7UUFDdkIsVUFBSyxHQUFpQixFQUFFLENBQUE7UUFDeEIsUUFBRyxHQUFxQixJQUFJLENBQUE7UUFFNUIsaUJBQVksR0FBWSxLQUFLLENBQUE7UUFDN0IsU0FBSSxHQUFhLElBQUksUUFBUSxFQUFFLENBQUE7UUFHdEMsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFBO1FBQ2pCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQTtRQUVuQyxJQUFJLENBQUMsRUFBRSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQzFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFO1lBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQywrQkFBK0IsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUE7WUFDdkQsT0FBTTtTQUNOO1FBRUQsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFBO1FBRWhCLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQTtRQUVuQyxJQUFJLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQTtR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