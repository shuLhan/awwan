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
            console.log("Vfs: element id", opts.id, "not found");
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
                            _this.onClickPath(path);
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
        if (!node.is_dir) {
            this.opts.OnClickNode(node.path);
            return;
        }
        this.comPath.open(node);
        this.comList.open(node);
    };
    Vfs.prototype.onClickPath = function (path) {
        var node = this.pathNode[path];
        if (!node) {
            console.log("Vfs: onClickPath: invalid path: ", path);
            return;
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
        if (this.is_dir) {
            this.el.style.backgroundColor = "cornsilk";
        }
        this.el.innerHTML = this.name;
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
        if (t.is_dir) {
            t.el.style.backgroundColor = "cornsilk";
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
        this.el.style.borderColor = "black";
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
        this.el.style.borderColor = "black";
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
        var _loop_1 = function (p) {
            if (p == "") {
                p = "/";
            }
            var crumb = document.createElement("span");
            crumb.style.display = "inline-block";
            crumb.style.padding = "1em";
            crumb.style.cursor = "pointer";
            crumb.innerHTML = p;
            crumb.onclick = function (event) {
                _this.onClick(p);
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
        for (var _i = 0, paths_1 = paths; _i < paths_1.length; _i++) {
            var p = paths_1[_i];
            _loop_1(p);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmZzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidmZzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrRUFBa0U7QUFDbEUseUVBQXlFO0FBQ3pFLDZCQUE2Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBNEI3QjtJQU1DLGFBQW1CLElBQWdCO1FBQWhCLFNBQUksR0FBSixJQUFJLENBQVk7UUFMM0IsT0FBRSxHQUF1QixJQUFJLENBQUE7UUFHN0IsYUFBUSxHQUFhLEVBQUUsQ0FBQTtRQUc5QixJQUFJLENBQUMsRUFBRSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQzFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFO1lBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFBO1lBQ3BELE9BQU07U0FDTjtJQUNGLENBQUM7SUFFSyxrQkFBSSxHQUFWOzs7Ozs7O3dCQUNDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFOzRCQUNiLHNCQUFNO3lCQUNOO3dCQUVpQixxQkFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxFQUFBOzt3QkFBekMsV0FBVyxHQUFHLFNBQTJCO3dCQUM3QyxJQUFJLENBQUMsV0FBVyxFQUFFOzRCQUNqQixzQkFBTTt5QkFDTjt3QkFFRCxLQUFXLEdBQUcsSUFBSSxXQUFXLEVBQUU7NEJBQ3hCLEtBQUssR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFhLENBQUE7NEJBQ3BDLElBQUksR0FBRyxJQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQUUsVUFBQyxJQUFhO2dDQUM3QyxLQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFBOzRCQUN2QixDQUFDLENBQUMsQ0FBQTs0QkFDRixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElB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