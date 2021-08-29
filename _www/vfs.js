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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmZzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidmZzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrRUFBa0U7QUFDbEUseUVBQXlFO0FBQ3pFLDZCQUE2Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBNEI3QjtJQUtDLGdCQUFtQixJQUFtQjtRQUF0QyxpQkFtQkM7UUFuQmtCLFNBQUksR0FBSixJQUFJLENBQWU7UUFDckMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUE7UUFFaEIsSUFBSSxFQUFFLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDekMsSUFBSSxDQUFDLEVBQUUsRUFBRTtZQUNSLE9BQU8sQ0FBQyxLQUFLLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxXQUFXLENBQUMsQ0FBQTtZQUN6RCxPQUFNO1NBQ047UUFDRCxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQTtRQUVaLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxVQUFVLENBQUMsVUFBQyxJQUFZO1lBQzNDLEtBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDbkIsQ0FBQyxDQUFDLENBQUE7UUFDRixJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBRXJDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxVQUFVLENBQUMsVUFBQyxJQUFnQjtZQUMvQyxLQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ3BCLENBQUMsQ0FBQyxDQUFBO1FBQ0YsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUN0QyxDQUFDO0lBRUQsbUVBQW1FO0lBQ25FLHlCQUF5QjtJQUN6Qix5QkFBUSxHQUFS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