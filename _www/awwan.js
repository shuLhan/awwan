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
import { WuiEditor } from "./wui/editor/editor.js";
import { WuiNotif } from "./wui/notif/notif.js";
import { WuiVfs } from "./wui/vfs/vfs.js";
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
var MAX_FILE_SIZE = 3000000;
export function renderHtml() {
    var el = document.createElement("div");
    el.classList.add("awwan");
    el.innerHTML = "\n\t\t\t<div class=\"awwan_nav_left\">\n\t\t\t\t<div id=\"" + ID_VFS + "\"></div>\n\n\t\t\t\t<br/>\n\t\t\t\t<div class=\"" + ID_INP_VFS_NEW + "\">\n\t\t\t\t\t<input id=\"" + ID_INP_VFS_NEW + "\" />\n\t\t\t\t</div>\n\t\t\t\t<button id=\"" + ID_BTN_NEW_DIR + "\">New directory</button>\n\t\t\t\t<button id=\"" + ID_BTN_NEW_FILE + "\">New file</button>\n\t\t\t\t<button id=\"" + ID_BTN_REMOVE + "\">Remove</button>\n\t\t\t</div>\n\t\t\t<div class=\"awwan_content\">\n\t\t\t\t<div class=\"editor_file\">\n\t\t\t\t\tFile: <span id=\"" + ID_VFS_PATH + "\">-</span>\n\t\t\t\t\t<button id=\"" + ID_BTN_SAVE + "\" disabled=\"true\">Save</button>\n\t\t\t\t</div>\n\t\t\t\t<div id=\"" + ID_EDITOR + "\"></div>\n\t\t\t\t<div>\n\t\t\t\t\t<div class=\"" + CLASS_EDITOR_ACTION + "\">\n\t\t\t\t\t\t<button id=\"" + ID_BTN_CLEAR_SELECTION + "\">Clear selection</button>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"" + CLASS_EDITOR_ACTION + "\">\n\t\t\t\t\t\tExecute script on\n\t\t\t\t\t\t<button id=\"" + ID_BTN_EXEC_LOCAL + "\" disabled=\"true\">Local</button>\n\t\t\t\t\t\tor\n\t\t\t\t\t\t<button id=\"" + ID_BTN_EXEC_REMOTE + "\" disabled=\"true\">Remote</button>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<p>Hints:</p>\n\t\t\t\t<ul>\n\t\t\t\t\t<li>\n\t\t\t\t\t\tClick and drag on the line numbers to select the specific line to be\n\t\t\t\t\t\texecuted.\n\t\t\t\t\t</li>\n\t\t\t\t\t<li>Press ESC to clear selection.</li>\n\t\t\t\t</ul>\n\t\t\t\t<div class=\"boxheader\">Standard output:</div>\n\t\t\t\t<div id=\"" + ID_STDOUT + "\"></div>\n\t\t\t\t<div class=\"boxheader\">Standard error:</div>\n\t\t\t\t<div id=\"" + ID_STDERR + "\"></div>\n\t\t\t</div>\n\t\t";
    document.body.appendChild(el);
}
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
        var el = document.getElementById(ID_BTN_CLEAR_SELECTION);
        if (el) {
            this.com_btn_clear = el;
            this.com_btn_clear.onclick = function () {
                _this.wui_editor.ClearSelection();
            };
        }
        el = document.getElementById(ID_BTN_EXEC_LOCAL);
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
        el = document.getElementById(ID_BTN_REMOVE);
        if (el) {
            this.com_btn_remove = el;
            this.com_btn_remove.onclick = function () {
                _this.onClickRemove();
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
            id: ID_EDITOR,
            is_editable: true,
            OnSelection: function (begin_at, end_at) {
                _this.editorOnSelection(begin_at, end_at);
            },
            OnSave: this.editorOnSave,
        };
        this.wui_editor = new WuiEditor(editor_opts);
        this.wui_notif = new WuiNotif();
        var wui_vfs_opts = {
            id: ID_VFS,
            Open: function (path, is_dir) {
                return _this.Open(path, is_dir);
            },
            OpenNode: function (node) {
                return _this.OpenNode(node);
            },
        };
        this.wui_vfs = new WuiVfs(wui_vfs_opts);
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
        if (node.content_type &&
            (node.content_type.indexOf("json") >= 0 ||
                node.content_type.indexOf("message") >= 0 ||
                node.content_type.indexOf("script") >= 0 ||
                node.content_type.indexOf("text") >= 0 ||
                node.content_type.indexOf("xml") >= 0)) {
            is_type_allowed = true;
        }
        if (!is_type_allowed) {
            res.message = "The file \"" + node.name + "\" with content type \"" + node.content_type + "\" is not allowed to be opened";
            return res;
        }
        if (node.size && node.size > MAX_FILE_SIZE) {
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
                        this.com_stdout.innerText = "";
                        this.com_stderr.innerText = "";
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
                        if (!this.current_node.childs) {
                            this.current_node.childs = [];
                        }
                        this.current_node.childs.push(node);
                        this.wui_vfs.Set(this.current_node);
                        return [2 /*return*/];
                }
            });
        });
    };
    Awwan.prototype.onClickRemove = function () {
        return __awaiter(this, void 0, void 0, function () {
            var name, req, http_res, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("onClickRemove: ", this.current_node);
                        if (!this.current_node) {
                            this.wui_notif.Error("No file selected.");
                            return [2 /*return*/];
                        }
                        name = this.com_inp_vfs_new.value;
                        if (name === "") {
                            this.wui_notif.Error("Empty file name");
                            return [2 /*return*/];
                        }
                        req = {
                            path: this.current_node.path + "/" + name,
                            is_dir: false,
                            content: "",
                        };
                        return [4 /*yield*/, fetch("/awwan/api/fs", {
                                method: "DELETE",
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
                            this.wui_notif.Error("remove: " + res.message);
                            return [2 /*return*/];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return Awwan;
}());
export { Awwan };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXd3YW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhd3dhbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFvQixNQUFNLHdCQUF3QixDQUFBO0FBQ3BFLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQTtBQUUvQyxPQUFPLEVBQUUsTUFBTSxFQUFzQyxNQUFNLGtCQUFrQixDQUFBO0FBRTdFLElBQU0sbUJBQW1CLEdBQUcsZUFBZSxDQUFBO0FBQzNDLElBQU0sc0JBQXNCLEdBQUcseUJBQXlCLENBQUE7QUFDeEQsSUFBTSxpQkFBaUIsR0FBRyxlQUFlLENBQUE7QUFDekMsSUFBTSxrQkFBa0IsR0FBRyxnQkFBZ0IsQ0FBQTtBQUMzQyxJQUFNLGNBQWMsR0FBRyxpQkFBaUIsQ0FBQTtBQUN4QyxJQUFNLGVBQWUsR0FBRyxrQkFBa0IsQ0FBQTtBQUMxQyxJQUFNLGFBQWEsR0FBRyxnQkFBZ0IsQ0FBQTtBQUN0QyxJQUFNLFdBQVcsR0FBRyxjQUFjLENBQUE7QUFDbEMsSUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFBO0FBQzlCLElBQU0sY0FBYyxHQUFHLGlCQUFpQixDQUFBO0FBQ3hDLElBQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQTtBQUN4QixJQUFNLFdBQVcsR0FBRyxVQUFVLENBQUE7QUFDOUIsSUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFBO0FBQzFCLElBQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQTtBQUMxQixJQUFNLGFBQWEsR0FBRyxPQUFPLENBQUE7QUFnQjdCLE1BQU0sVUFBVSxVQUFVO0lBQ3pCLElBQUksRUFBRSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDdEMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUE7SUFDekIsRUFBRSxDQUFDLFNBQVMsR0FBRywr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