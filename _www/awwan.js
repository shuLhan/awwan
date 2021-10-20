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
    el.innerHTML = "\n\t\t\t<div class=\"awwan_nav_left\">\n\t\t\t\t<div id=\"" + ID_VFS + "\"></div>\n\n\t\t\t\t<br/>\n\t\t\t\t<div class=\"" + ID_INP_VFS_NEW + "\">\n\t\t\t\t\t<input id=\"" + ID_INP_VFS_NEW + "\" />\n\t\t\t\t</div>\n\t\t\t\t<button id=\"" + ID_BTN_NEW_DIR + "\">New directory</button>\n\t\t\t\t<button id=\"" + ID_BTN_NEW_FILE + "\">New file</button>\n\t\t\t</div>\n\t\t\t<div class=\"awwan_content\">\n\t\t\t\t<div class=\"editor_file\">\n\t\t\t\t\tFile: <span id=\"" + ID_VFS_PATH + "\">-</span>\n\t\t\t\t\t<button id=\"" + ID_BTN_SAVE + "\" disabled=\"true\">Save</button>\n\t\t\t\t</div>\n\t\t\t\t<div id=\"" + ID_EDITOR + "\"></div>\n\t\t\t\t<div>\n\t\t\t\t\t<div class=\"" + CLASS_EDITOR_ACTION + "\">\n\t\t\t\t\t\t<button id=\"" + ID_BTN_CLEAR_SELECTION + "\">Clear selection</button>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"" + CLASS_EDITOR_ACTION + "\">\n\t\t\t\t\t\tExecute script on\n\t\t\t\t\t\t<button id=\"" + ID_BTN_EXEC_LOCAL + "\" disabled=\"true\">Local</button>\n\t\t\t\t\t\tor\n\t\t\t\t\t\t<button id=\"" + ID_BTN_EXEC_REMOTE + "\" disabled=\"true\">Remote</button>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<p>Hints:</p>\n\t\t\t\t<ul>\n\t\t\t\t\t<li>\n\t\t\t\t\t\tClick and drag on the line numbers to select the specific line to be\n\t\t\t\t\t\texecuted.\n\t\t\t\t\t</li>\n\t\t\t\t\t<li>Press ESC to clear selection.</li>\n\t\t\t\t</ul>\n\t\t\t\t<div class=\"boxheader\">Standard output:</div>\n\t\t\t\t<div id=\"" + ID_STDOUT + "\"></div>\n\t\t\t\t<div class=\"boxheader\">Standard error:</div>\n\t\t\t\t<div id=\"" + ID_STDERR + "\"></div>\n\t\t\t</div>\n\t\t";
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
    return Awwan;
}());
export { Awwan };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXd3YW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhd3dhbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFvQixNQUFNLHdCQUF3QixDQUFBO0FBQ3BFLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQTtBQUUvQyxPQUFPLEVBQUUsTUFBTSxFQUFzQyxNQUFNLGtCQUFrQixDQUFBO0FBRTdFLElBQU0sbUJBQW1CLEdBQUcsZUFBZSxDQUFBO0FBQzNDLElBQU0sc0JBQXNCLEdBQUcseUJBQXlCLENBQUE7QUFDeEQsSUFBTSxpQkFBaUIsR0FBRyxlQUFlLENBQUE7QUFDekMsSUFBTSxrQkFBa0IsR0FBRyxnQkFBZ0IsQ0FBQTtBQUMzQyxJQUFNLGNBQWMsR0FBRyxpQkFBaUIsQ0FBQTtBQUN4QyxJQUFNLGVBQWUsR0FBRyxrQkFBa0IsQ0FBQTtBQUMxQyxJQUFNLFdBQVcsR0FBRyxjQUFjLENBQUE7QUFDbEMsSUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFBO0FBQzlCLElBQU0sY0FBYyxHQUFHLGlCQUFpQixDQUFBO0FBQ3hDLElBQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQTtBQUN4QixJQUFNLFdBQVcsR0FBRyxVQUFVLENBQUE7QUFDOUIsSUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFBO0FBQzFCLElBQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQTtBQUMxQixJQUFNLGFBQWEsR0FBRyxPQUFPLENBQUE7QUFVN0IsTUFBTSxVQUFVLFVBQVU7SUFDekIsSUFBSSxFQUFFLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUN0QyxFQUFFLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUN6QixFQUFFLENBQUMsU0FBUyxHQUFHLCtEQUVELE1BQU0seURBR0gsY0FBYyxtQ0FDZCxjQUFjLG9EQUVkLGNBQWMsd0RBQ2QsZUFBZSxpSkFJVixXQUFXLDRDQUNmLFdBQVcsOEVBRWYsU0FBUyx5REFFTCxtQkFBbUIsc0NBQ2xCLHNCQUFzQiw4RUFFdkIsbUJBQW1CLHFFQUVsQixpQkFBaUIsc0ZBRWpCLGtCQUFrQiwyWUFZdkIsU0FBUyw2RkFFVCxTQUFTLGtDQUVyQixDQUFBO0lBQ0YsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUE7QUFDOUIsQ0FBQztBQUVEO0lBdUJDO1FBQUEsaUJBc0dDO1FBbEhPLGlCQUFZLEdBQStCLElBQUksQ0FBQTtRQUMvQyxZQUFPLEdBQXFCO1lBQ25DLElBQUksRUFBRSxPQUFPO1lBQ2IsTUFBTSxFQUFFLEVBQUU7WUFDVixPQUFPLEVBQUUsRUFBRTtZQUNYLFFBQVEsRUFBRSxDQUFDO1lBQ1gsTUFBTSxFQUFFLENBQUM7U0FDVCxDQUFBO1FBTUEsSUFBSSxFQUFFLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFBO1FBQ3hELElBQUksRUFBRSxFQUFFO1lBQ1AsSUFBSSxDQUFDLGFBQWEsR0FBRyxFQUF1QixDQUFBO1lBQzVDLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxHQUFHO2dCQUM1QixLQUFJLENBQUMsVUFBVSxDQUFDLGNBQWMsRUFBRSxDQUFBO1lBQ2pDLENBQUMsQ0FBQTtTQUNEO1FBRUQsRUFBRSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENBQUMsQ0FBQTtRQUMvQyxJQUFJLEVBQUUsRUFBRTtZQUNQLElBQUksQ0FBQyxhQUFhLEdBQUcsRUFBdUIsQ0FBQTtZQUM1QyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sR0FBRztnQkFDNUIsS0FBSSxDQUFDLFNBQVMsRUFBRSxDQUFBO1lBQ2pCLENBQUMsQ0FBQTtTQUNEO1FBQ0QsRUFBRSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsa0JBQWtCLENBQUMsQ0FBQTtRQUNoRCxJQUFJLEVBQUUsRUFBRTtZQUNQLElBQUksQ0FBQyxjQUFjLEdBQUcsRUFBdUIsQ0FBQTtZQUM3QyxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sR0FBRztnQkFDN0IsS0FBSSxDQUFDLFVBQVUsRUFBRSxDQUFBO1lBQ2xCLENBQUMsQ0FBQTtTQUNEO1FBRUQsRUFBRSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFDLENBQUE7UUFDNUMsSUFBSSxFQUFFLEVBQUU7WUFDUCxJQUFJLENBQUMsZUFBZSxHQUFHLEVBQXVCLENBQUE7WUFDOUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEdBQUc7Z0JBQzlCLEtBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUE7WUFDbkIsQ0FBQyxDQUFBO1NBQ0Q7UUFDRCxFQUFFLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUMsQ0FBQTtRQUM3QyxJQUFJLEVBQUUsRUFBRTtZQUNQLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxFQUF1QixDQUFBO1lBQy9DLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEdBQUc7Z0JBQy9CLEtBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDcEIsQ0FBQyxDQUFBO1NBQ0Q7UUFFRCxFQUFFLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUN6QyxJQUFJLEVBQUUsRUFBRTtZQUNQLElBQUksQ0FBQyxZQUFZLEdBQUcsRUFBdUIsQ0FBQTtZQUMzQyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sR0FBRztnQkFDM0IsS0FBSSxDQUFDLFdBQVcsRUFBRSxDQUFBO1lBQ25CLENBQUMsQ0FBQTtTQUNEO1FBRUQsRUFBRSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFDLENBQUE7UUFDNUMsSUFBSSxFQUFFLEVBQUU7WUFDUCxJQUFJLENBQUMsZUFBZSxHQUFHLEVBQXNCLENBQUE7U0FDN0M7UUFFRCxFQUFFLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUN6QyxJQUFJLEVBQUUsRUFBRTtZQUNQLElBQUksQ0FBQyxhQUFhLEdBQUcsRUFBRSxDQUFBO1NBQ3ZCO1FBQ0QsRUFBRSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUE7UUFDdkMsSUFBSSxFQUFFLEVBQUU7WUFDUCxJQUFJLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQTtTQUNwQjtRQUNELEVBQUUsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFBO1FBQ3ZDLElBQUksRUFBRSxFQUFFO1lBQ1AsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUE7U0FDcEI7UUFFRCxJQUFJLFdBQVcsR0FBcUI7WUFDbkMsRUFBRSxFQUFFLFNBQVM7WUFDYixXQUFXLEVBQUUsSUFBSTtZQUNqQixXQUFXLEVBQUUsVUFBQyxRQUFnQixFQUFFLE1BQWM7Z0JBQzdDLEtBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUE7WUFDekMsQ0FBQztZQUNELE1BQU0sRUFBRSxJQUFJLENBQUMsWUFBWTtTQUN6QixDQUFBO1FBQ0QsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUU1QyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksUUFBUSxFQUFFLENBQUE7UUFFL0IsSUFBSSxZQUFZLEdBQWtCO1lBQ2pDLEVBQUUsRUFBRSxNQUFNO1lBQ1YsSUFBSSxFQUFFLFVBQ0wsSUFBWSxFQUNaLE1BQWU7Z0JBRWYsT0FBTyxLQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQTtZQUMvQixDQUFDO1lBQ0QsUUFBUSxFQUFFLFVBQ1QsSUFBeUI7Z0JBRXpCLE9BQU8sS0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQTtZQUMzQixDQUFDO1NBQ0QsQ0FBQTtRQUNELElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUE7UUFFdkMsTUFBTSxDQUFDLFlBQVksR0FBRyxVQUFDLEVBQVM7WUFDL0IsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFBO1lBQ25CLElBQUksVUFBVSxHQUFHLEVBQXFCLENBQUE7WUFDdEMsSUFBSSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQ3BDLEtBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQzVCLENBQUMsQ0FBQTtRQUVELDJCQUEyQjtRQUMzQixJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDeEMsQ0FBQztJQUVELDRCQUFZLEdBQVosVUFBYSxJQUFZO1FBQ3hCLElBQUksSUFBSSxLQUFLLEVBQUUsRUFBRTtZQUNoQixJQUFJLEdBQUcsSUFBSSxDQUFBO1NBQ1g7UUFFRCxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUN4QixJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUMzQixDQUFDO0lBRUQsa0RBQWtEO0lBQzVDLG9CQUFJLEdBQVYsVUFDQyxJQUFZLEVBQ1osTUFBZTs7Ozs7NEJBRUEscUJBQU0sS0FBSyxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQyxFQUFBOzt3QkFBcEQsUUFBUSxHQUFHLFNBQXlDO3dCQUM5QyxxQkFBTSxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUE7O3dCQUEzQixHQUFHLEdBQUcsU0FBcUI7d0JBQy9CLElBQUksR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLEVBQUU7NEJBQ3BCLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUNuQixvQkFBa0IsSUFBSSxVQUFLLEdBQUcsQ0FBQyxPQUFTLENBQ3hDLENBQUE7NEJBQ0Qsc0JBQU8sR0FBRyxFQUFBO3lCQUNWO3dCQUVHLElBQUksR0FBRyxHQUFHLENBQUMsSUFBMkIsQ0FBQTt3QkFDMUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQTt3QkFFdEMsSUFBSSxNQUFNLEVBQUU7NEJBQ1gsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUE7NEJBQ3hCLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUE7NEJBQ2pDLHNCQUFPLEdBQUcsRUFBQTt5QkFDVjt3QkFFRyxRQUFRLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQTt3QkFDdkMsSUFBSSxRQUFRLENBQUMsSUFBSSxJQUFJLEdBQUcsRUFBRTs0QkFDekIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFBOzRCQUN0QyxzQkFBTyxRQUFRLEVBQUE7eUJBQ2Y7d0JBRUQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFBO3dCQUNuQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUE7d0JBRTFCLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO3dCQUMxQixJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUE7d0JBQ25DLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQTt3QkFDcEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFBO3dCQUVsQyxzQkFBTyxHQUFHLEVBQUE7Ozs7S0FDVjtJQUVELG9FQUFvRTtJQUNwRSxvQkFBb0I7SUFDZCx3QkFBUSxHQUFkLFVBQ0MsSUFBeUI7Ozs7Ozt3QkFFckIsUUFBUSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUE7d0JBQ3ZDLElBQUksUUFBUSxDQUFDLElBQUksSUFBSSxHQUFHLEVBQUU7NEJBQ3pCLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQTs0QkFDdEMsc0JBQU8sUUFBUSxFQUFBO3lCQUNmO3dCQUVTLHFCQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUE7O3dCQUE3QyxHQUFHLEdBQUcsU0FBdUM7d0JBQ2pELHNCQUFPLEdBQUcsRUFBQTs7OztLQUNWO0lBRUQsNkJBQWEsR0FBYixVQUFjLElBQXlCO1FBQ3RDLElBQUksR0FBRyxHQUF5QjtZQUMvQixJQUFJLEVBQUUsR0FBRztZQUNULE9BQU8sRUFBRSxFQUFFO1NBQ1gsQ0FBQTtRQUVELElBQUksZUFBZSxHQUFHLEtBQUssQ0FBQTtRQUMzQixJQUNDLElBQUksQ0FBQyxZQUFZO1lBQ2pCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztnQkFDdEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztnQkFDekMsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztnQkFDeEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztnQkFDdEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQ3RDO1lBQ0QsZUFBZSxHQUFHLElBQUksQ0FBQTtTQUN0QjtRQUNELElBQUksQ0FBQyxlQUFlLEVBQUU7WUFDckIsR0FBRyxDQUFDLE9BQU8sR0FBRyxnQkFBYSxJQUFJLENBQUMsSUFBSSwrQkFBd0IsSUFBSSxDQUFDLFlBQVksbUNBQStCLENBQUE7WUFDNUcsT0FBTyxHQUFHLENBQUE7U0FDVjtRQUNELElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxHQUFHLGFBQWEsRUFBRTtZQUMzQyxHQUFHLENBQUMsT0FBTyxHQUFHLGdCQUFhLElBQUksQ0FBQyxJQUFJLHFCQUNuQyxJQUFJLENBQUMsSUFBSSxHQUFHLE9BQU8sbUNBRW5CLGFBQWEsR0FBRyxPQUFPLFFBQ25CLENBQUE7WUFDTCxPQUFPLEdBQUcsQ0FBQTtTQUNWO1FBQ0QsR0FBRyxDQUFDLElBQUksR0FBRyxHQUFHLENBQUE7UUFDZCxPQUFPLEdBQUcsQ0FBQTtJQUNYLENBQUM7SUFFRCwyQkFBVyxHQUFYO1FBQ0MsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sSUFBSSxFQUFFLEVBQUU7WUFDOUIsT0FBTTtTQUNOO1FBQ0QsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsQ0FBQTtRQUMxQyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFBO1FBQ3RCLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLElBQUksRUFBRTtZQUNwQyxPQUFPLElBQUksSUFBSSxDQUFBO1NBQ2Y7UUFDRCxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7UUFDOUIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQzNELENBQUM7SUFFRCw0QkFBWSxHQUFaLFVBQWEsT0FBZTtRQUMzQixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFBO0lBQzlDLENBQUM7SUFFSywwQkFBVSxHQUFoQixVQUFpQixJQUFZLEVBQUUsT0FBZTs7Ozs7O3dCQUN6QyxHQUFHLEdBQUc7NEJBQ1QsSUFBSSxFQUFFLElBQUk7NEJBQ1YsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUM7eUJBQ3RCLENBQUE7d0JBQ2MscUJBQU0sS0FBSyxDQUFDLGVBQWUsRUFBRTtnQ0FDM0MsTUFBTSxFQUFFLEtBQUs7Z0NBQ2IsT0FBTyxFQUFFO29DQUNSLE1BQU0sRUFBRSxrQkFBa0I7b0NBQzFCLGNBQWMsRUFBRSxrQkFBa0I7aUNBQ2xDO2dDQUNELElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQzs2QkFDekIsQ0FBQyxFQUFBOzt3QkFQRSxRQUFRLEdBQUcsU0FPYjt3QkFDUSxxQkFBTSxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUE7O3dCQUEzQixHQUFHLEdBQUcsU0FBcUI7d0JBQy9CLElBQUksR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLEVBQUU7NEJBQ3BCLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUNuQix5QkFBdUIsSUFBSSxVQUFLLEdBQUcsQ0FBQyxPQUFTLENBQzdDLENBQUE7NEJBQ0Qsc0JBQU8sSUFBSSxFQUFBO3lCQUNYO3dCQUVELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVEsSUFBSSxxQkFBa0IsQ0FBQyxDQUFBO3dCQUNuRCxzQkFBTyxHQUFHLEVBQUE7Ozs7S0FDVjtJQUVELGlDQUFpQixHQUFqQixVQUFrQixLQUFhLEVBQUUsR0FBVztRQUMzQyxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQTtRQUN2RCxLQUFtQixVQUFLLEVBQUwsZUFBSyxFQUFMLG1CQUFLLEVBQUwsSUFBSyxFQUFFO1lBQXJCLElBQU0sSUFBSSxjQUFBO1lBQ2QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7U0FDdkM7SUFDRixDQUFDO0lBRUQsb0VBQW9FO0lBQ3BFLHlCQUFTLEdBQVQ7UUFDQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxJQUFJLEVBQUUsRUFBRTtZQUM5QixJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FDbkIsb0NBQW9DLENBQ3BDLENBQUE7WUFDRCxPQUFNO1NBQ047UUFDRCxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQzdCLENBQUM7SUFFRCxzRUFBc0U7SUFDdEUsMEJBQVUsR0FBVjtRQUNDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLElBQUksRUFBRSxFQUFFO1lBQzlCLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUNuQixxQ0FBcUMsQ0FDckMsQ0FBQTtZQUNELE9BQU07U0FDTjtRQUNELElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUE7SUFDOUIsQ0FBQztJQUVLLDhCQUFjLEdBQXBCLFVBQXFCLElBQVk7Ozs7Ozt3QkFDNUIsZUFBZSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsaUJBQWlCLEVBQUUsQ0FBQTt3QkFDekQsSUFBSSxlQUFlLENBQUMsUUFBUSxHQUFHLENBQUMsRUFBRTs0QkFDakMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFBO3lCQUN6Qjs2QkFBTTs0QkFDTixJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsR0FBRyxlQUFlLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQTt5QkFDcEQ7d0JBQ0QsSUFBSSxlQUFlLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTs0QkFDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFBO3lCQUN2Qjs2QkFBTTs0QkFDTixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxlQUFlLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQTt5QkFDaEQ7d0JBRUQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFBO3dCQUM5QixJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUE7d0JBRTlCLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQTt3QkFDeEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQTt3QkFFMUMscUJBQU0sS0FBSyxDQUFDLG9CQUFvQixFQUFFO2dDQUNoRCxNQUFNLEVBQUUsTUFBTTtnQ0FDZCxPQUFPLEVBQUU7b0NBQ1IsTUFBTSxFQUFFLGtCQUFrQjtvQ0FDMUIsY0FBYyxFQUFFLGtCQUFrQjtpQ0FDbEM7Z0NBQ0QsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQzs2QkFDbEMsQ0FBQyxFQUFBOzt3QkFQRSxRQUFRLEdBQUcsU0FPYjt3QkFFUSxxQkFBTSxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUE7O3dCQUEzQixHQUFHLEdBQUcsU0FBcUI7d0JBQy9CLElBQUksR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLEVBQUU7NEJBQ3BCLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLHFCQUFtQixHQUFHLENBQUMsT0FBUyxDQUFDLENBQUE7NEJBQ3RELHNCQUFNO3lCQUNOO3dCQUVELElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO3dCQUNqRCxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFOzRCQUNwQixJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTt5QkFDakQ7d0JBRUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQ2xCLDBCQUF3QixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sWUFBTyxJQUFJLE1BQUcsQ0FDekQsQ0FBQTs7Ozs7S0FDRDtJQUVhLHVCQUFPLEdBQXJCLFVBQXNCLE1BQWU7Ozs7Ozt3QkFDcEMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUU7NEJBQ3ZCLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUNuQix5Q0FBeUMsQ0FDekMsQ0FBQTs0QkFDRCxzQkFBTTt5QkFDTjt3QkFFRyxJQUFJLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUE7d0JBQ3JDLElBQUksSUFBSSxLQUFLLEVBQUUsRUFBRTs0QkFDaEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQTs0QkFDdkMsc0JBQU07eUJBQ047d0JBQ0csR0FBRyxHQUF3Qjs0QkFDOUIsSUFBSSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJOzRCQUN6QyxJQUFJLEVBQUUsSUFBSTs0QkFDVixNQUFNLEVBQUUsTUFBTTs0QkFDZCxZQUFZLEVBQUUsRUFBRTs0QkFDaEIsUUFBUSxFQUFFLENBQUM7NEJBQ1gsSUFBSSxFQUFFLENBQUM7NEJBQ1AsSUFBSSxFQUFFLEVBQUU7NEJBQ1IsTUFBTSxFQUFFLEVBQUU7NEJBQ1YsT0FBTyxFQUFFLEVBQUU7eUJBQ1gsQ0FBQTt3QkFFYyxxQkFBTSxLQUFLLENBQUMsZUFBZSxFQUFFO2dDQUMzQyxNQUFNLEVBQUUsTUFBTTtnQ0FDZCxPQUFPLEVBQUU7b0NBQ1IsTUFBTSxFQUFFLGtCQUFrQjtvQ0FDMUIsY0FBYyxFQUFFLGtCQUFrQjtpQ0FDbEM7Z0NBQ0QsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDOzZCQUN6QixDQUFDLEVBQUE7O3dCQVBFLFFBQVEsR0FBRyxTQU9iO3dCQUVRLHFCQUFNLFFBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBQTs7d0JBQTNCLEdBQUcsR0FBRyxTQUFxQjt3QkFDL0IsSUFBSSxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsRUFBRTs0QkFDcEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsY0FBWSxHQUFHLENBQUMsT0FBUyxDQUFDLENBQUE7NEJBQy9DLHNCQUFNO3lCQUNOO3dCQUVHLElBQUksR0FBRyxHQUFHLENBQUMsSUFBMkIsQ0FBQTt3QkFDMUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFOzRCQUM5QixJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUE7eUJBQzdCO3dCQUNELElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTt3QkFDbkMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFBOzs7OztLQUNuQztJQUNGLFlBQUM7QUFBRCxDQUFDLEFBbFlELElBa1lDIn0=