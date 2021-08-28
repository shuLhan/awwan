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
exports.Vfs = void 0;
var Vfs = /** @class */ (function () {
    function Vfs(opts) {
        this.opts = opts;
        this.el = null;
        this.pathNode = {};
        this.el = document.getElementById(opts.id);
        if (!this.el) {
            console.error("Vfs: element id", opts.id, "not found");
            return;
        }
    }
    Vfs.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var resPathNode, key, value, node;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.el) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.opts.ListNodes()];
                    case 1:
                        resPathNode = _a.sent();
                        if (!resPathNode) {
                            return [2 /*return*/];
                        }
                        for (key in resPathNode) {
                            value = resPathNode[key];
                            node = new VfsNode(value, function (node) {
                                _this.onClickNode(node);
                            });
                            this.pathNode[key] = node;
                        }
                        this.el.innerHTML = "";
                        this.comPath = new VfsPath(function (path) {
                            _this.OpenPath(path);
                        });
                        this.el.appendChild(this.comPath.el);
                        this.comList = new VfsList();
                        this.el.appendChild(this.comList.el);
                        this.open(this.pathNode["/"]);
                        return [2 /*return*/];
                }
            });
        });
    };
    Vfs.prototype.onClickNode = function (node) {
        if (this.opts.OnClickNode) {
            this.opts.OnClickNode(node.path, node.is_dir);
        }
        if (node.is_dir) {
            this.comPath.open(node);
            this.comList.open(node);
        }
    };
    Vfs.prototype.OpenPath = function (path) {
        var node = this.pathNode[path];
        if (!node) {
            console.error("Vfs: OpenPath: invalid path: ", path);
            return;
        }
        if (this.opts.OnClickNode) {
            this.opts.OnClickNode(node.path, node.is_dir);
        }
        this.open(node);
    };
    Vfs.prototype.open = function (node) {
        this.comPath.open(node);
        this.comList.open(node);
    };
    return Vfs;
}());
exports.Vfs = Vfs;
var VfsNode = /** @class */ (function () {
    function VfsNode(opts, onClick) {
        var _this = this;
        this.path = opts.path || "";
        this.name = opts.name || "";
        this.mod_time_epoch = opts.mod_time_epoch || 0;
        this.mod_time_rfc3339 = opts.mod_time_rfc3339 || "";
        this.size = opts.size || 0;
        this.mode = opts.mode || "";
        this.is_dir = opts.is_dir || false;
        this.childs = [];
        if (opts.childs !== undefined) {
            for (var _i = 0, _a = opts.childs; _i < _a.length; _i++) {
                var c = _a[_i];
                this.childs.push(new VfsNode(c, onClick));
            }
        }
        this.el = document.createElement("div");
        this.el.style.padding = "1em";
        this.el.style.cursor = "pointer";
        this.el.innerHTML = this.name;
        if (this.is_dir) {
            this.el.style.backgroundColor = "cornsilk";
        }
        this.el.onclick = function (event) {
            onClick(_this);
        };
        this.el.onmouseout = function (event) {
            _this.onMouseOut(_this);
        };
        this.el.onmouseover = function (event) {
            _this.onMouseOver(_this);
        };
    }
    VfsNode.prototype.onMouseOut = function (t) {
        if (this.is_dir) {
            this.el.style.backgroundColor = "cornsilk";
        }
        else {
            t.el.style.backgroundColor = "white";
        }
    };
    VfsNode.prototype.onMouseOver = function (t) {
        t.el.style.backgroundColor = "aliceblue";
    };
    return VfsNode;
}());
var VfsList = /** @class */ (function () {
    function VfsList() {
        this.el = document.createElement("div");
        this.el.style.borderWidth = "1px";
        this.el.style.borderStyle = "solid";
        this.el.style.borderColor = "silver";
    }
    VfsList.prototype.open = function (node) {
        this.el.innerHTML = "";
        if (node.childs === undefined) {
            return;
        }
        for (var _i = 0, _a = node.childs; _i < _a.length; _i++) {
            var c = _a[_i];
            this.el.appendChild(c.el);
        }
    };
    return VfsList;
}());
var VfsPath = /** @class */ (function () {
    function VfsPath(onClick) {
        this.el = document.createElement("div");
        this.el.style.borderWidth = "1px";
        this.el.style.borderStyle = "solid";
        this.el.style.borderColor = "silver";
        this.crumbs = [];
        this.onClick = onClick;
    }
    VfsPath.prototype.open = function (node) {
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
        var _loop_1 = function (x) {
            var fullPath = "";
            var p = "";
            if (x == 0) {
                p = "/";
                fullPath = "/";
            }
            else {
                p = paths[x];
                fullPath = paths.slice(0, x + 1).join("/");
            }
            var crumb = document.createElement("span");
            crumb.style.display = "inline-block";
            crumb.style.padding = "1em";
            crumb.style.cursor = "pointer";
            crumb.innerHTML = p;
            crumb.onclick = function (event) {
                _this.onClick(fullPath);
            };
            crumb.onmouseout = function (event) {
                _this.onMouseOut(crumb, event);
            };
            crumb.onmouseover = function (event) {
                _this.onMouseOver(crumb, event);
            };
            this_1.el.appendChild(crumb);
        };
        var this_1 = this;
        for (var x = 0; x < paths.length; x++) {
            _loop_1(x);
        }
    };
    VfsPath.prototype.onMouseOut = function (crumb, event) {
        crumb.style.backgroundColor = "white";
    };
    VfsPath.prototype.onMouseOver = function (crumb, event) {
        crumb.style.backgroundColor = "aliceblue";
    };
    return VfsPath;
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmZzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidmZzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrRUFBa0U7QUFDbEUseUVBQXlFO0FBQ3pFLDZCQUE2Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBK0I3QjtJQU1DLGFBQW1CLElBQWdCO1FBQWhCLFNBQUksR0FBSixJQUFJLENBQVk7UUFMM0IsT0FBRSxHQUF1QixJQUFJLENBQUE7UUFHN0IsYUFBUSxHQUFhLEVBQUUsQ0FBQTtRQUc5QixJQUFJLENBQUMsRUFBRSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQzFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFO1lBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFBO1lBQ3RELE9BQU07U0FDTjtJQUNGLENBQUM7SUFFSyxrQkFBSSxHQUFWOzs7Ozs7O3dCQUNDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFOzRCQUNiLHNCQUFNO3lCQUNOO3dCQUVpQixxQkFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxFQUFBOzt3QkFBekMsV0FBVyxHQUFHLFNBQTJCO3dCQUM3QyxJQUFJLENBQUMsV0FBVyxFQUFFOzRCQUNqQixzQkFBTTt5QkFDTjt3QkFFRCxLQUFXLEdBQUcsSUFBSSxXQUFXLEVBQUU7NEJBQ3hCLEtBQUssR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFhLENBQUE7NEJBQ3BDLElBQUksR0FBRyxJQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQUUsVUFBQyxJQUFhO2dDQUM3QyxLQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFBOzRCQUN2QixDQUFDLENBQUMsQ0FBQTs0QkFDRixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElB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