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
            _this.OnClickNode(node);
        });
        this.el.appendChild(this.com_list.el);
    }
    // OnClickNode is a handler that will be called when a node is clicked
    // inside the WuiVfsList.
    WuiVfs.prototype.OnClickNode = function (node) {
        if (!node.is_dir) {
            this.opts.Open(node.path, false);
            return;
        }
        this.OpenDir(node.path);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmZzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidmZzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrRUFBa0U7QUFDbEUseUVBQXlFO0FBQ3pFLDZCQUE2Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBd0I3QjtJQUtDLGdCQUFtQixJQUFtQjtRQUF0QyxpQkFtQkM7UUFuQmtCLFNBQUksR0FBSixJQUFJLENBQWU7UUFDckMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUE7UUFFaEIsSUFBSSxFQUFFLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDekMsSUFBSSxDQUFDLEVBQUUsRUFBRTtZQUNSLE9BQU8sQ0FBQyxLQUFLLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxXQUFXLENBQUMsQ0FBQTtZQUN6RCxPQUFNO1NBQ047UUFDRCxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQTtRQUVaLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxVQUFVLENBQUMsVUFBQyxJQUFZO1lBQzNDLEtBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDbkIsQ0FBQyxDQUFDLENBQUE7UUFDRixJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBRXJDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxVQUFVLENBQUMsVUFBQyxJQUFnQjtZQUMvQyxLQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ3ZCLENBQUMsQ0FBQyxDQUFBO1FBQ0YsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUN0QyxDQUFDO0lBRUQsc0VBQXNFO0lBQ3RFLHlCQUF5QjtJQUN6Qiw0QkFBVyxHQUFY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