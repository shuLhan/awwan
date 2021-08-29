"use strict";
// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
exports.__esModule = true;
exports.WuiEditor = void 0;
var WUI_EDITOR_CLASS = "wui_editor";
var WUI_EDITOR_CLASS_LINE = "wui_editor_line";
var WUI_EDITOR_CLASS_LINE_NUMBER = "wui_editor_line_number";
var WUI_EDITOR_CLASS_LINE_TEXT = "wui_editor_line_text";
var WuiEditor = /** @class */ (function () {
    function WuiEditor(opts) {
        var _this = this;
        this.opts = opts;
        this.active_file = null;
        this.active_text = null;
        this.range_begin = -1;
        this.range_end = -1;
        this.raw_lines = [];
        this.lines = [];
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
            end_at: this.range_end
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
    WuiEditorUndoRedo.prototype.DoSplit = function (curr_line, curr_text, next_text) {
        var action = {
            kind: "split",
            before: {
                curr_line: curr_line,
                curr_text: curr_text + next_text,
                next_line: curr_line + 1,
                next_text: ""
            },
            after: {
                curr_line: curr_line,
                curr_text: curr_text,
                next_line: curr_line + 1,
                next_text: next_text
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrRUFBa0U7QUFDbEUseUVBQXlFO0FBQ3pFLDZCQUE2Qjs7O0FBRTdCLElBQU0sZ0JBQWdCLEdBQUcsWUFBWSxDQUFBO0FBQ3JDLElBQU0scUJBQXFCLEdBQUcsaUJBQWlCLENBQUE7QUFDL0MsSUFBTSw0QkFBNEIsR0FBRyx3QkFBd0IsQ0FBQTtBQUM3RCxJQUFNLDBCQUEwQixHQUFHLHNCQUFzQixDQUFBO0FBZ0J6RDtJQWVDLG1CQUFtQixJQUFzQjtRQUF6QyxpQkEwQkM7UUExQmtCLFNBQUksR0FBSixJQUFJLENBQWtCO1FBVmpDLGdCQUFXLEdBQStCLElBQUksQ0FBQTtRQUM5QyxnQkFBVyxHQUF1QixJQUFJLENBQUE7UUFDdEMsZ0JBQVcsR0FBVyxDQUFDLENBQUMsQ0FBQTtRQUN4QixjQUFTLEdBQVcsQ0FBQyxDQUFDLENBQUE7UUFDdEIsY0FBUyxHQUFhLEVBQUUsQ0FBQTtRQUN4QixVQUFLLEdBQW9CLEVBQUUsQ0FBQTtRQUUzQixtQkFBYyxHQUFZLEtBQUssQ0FBQTtRQUMvQixTQUFJLEdBQXNCLElBQUksaUJBQWlCLEVBQUUsQ0FBQTtRQUd4RCxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUE7UUFDakIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFBO1FBRW5DLElBQUksRUFBRSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ3pDLElBQUksQ0FBQyxFQUFFLEVBQUU7WUFDUixPQUFPLENBQUMsS0FBSyxDQUFDLGtDQUFrQyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUMxRCxPQUFNO1NBQ047UUFDRCxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQTtRQUVaLElBQUksQ0FBQyxTQUFTLEVBQUUs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