"use strict";
// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
exports.__esModule = true;
exports.WuiNotif = void 0;
var WUI_NOTIF_ID = "wui_notif";
var WUI_NOTIF_CLASS_INFO = "wui_notif_info";
var WUI_NOTIF_CLASS_ERROR = "wui_notif_error";
//
// WuiNotif implement the HTML interface to display pop-up notification.
// The notification can be triggered by calling method Info() or Error().
// Each pop-up has 5 seconds duration, after that they will be removed
// automatically.
//
var WuiNotif = /** @class */ (function () {
    function WuiNotif() {
        this.timeout = 5000; // 5 seconds timeout
        this.el = document.createElement("div");
        this.el.id = WUI_NOTIF_ID;
        document.body.appendChild(this.el);
        this.initStyle();
    }
    // Info show the msg as information.
    WuiNotif.prototype.Info = function (msg) {
        var _this = this;
        var item = document.createElement("div");
        item.innerHTML = msg;
        item.classList.add(WUI_NOTIF_CLASS_INFO);
        this.el.appendChild(item);
        setTimeout(function () {
            _this.el.removeChild(item);
        }, this.timeout);
    };
    // Info show the msg as an error.
    WuiNotif.prototype.Error = function (msg) {
        var _this = this;
        var item = document.createElement("div");
        item.innerHTML = msg;
        item.classList.add(WUI_NOTIF_CLASS_ERROR);
        this.el.appendChild(item);
        setTimeout(function () {
            _this.el.removeChild(item);
        }, this.timeout);
    };
    WuiNotif.prototype.initStyle = function () {
        var style = document.createElement("style");
        style.type = "text/css";
        style.innerText = "\n\t\t\t#" + WUI_NOTIF_ID + " {\n\t\t\t\tleft: 10%;\n\t\t\t\tposition: fixed;\n\t\t\t\ttop: 1em;\n\t\t\t\twidth: 80%;\n\t\t\t}\n\t\t\t." + WUI_NOTIF_CLASS_INFO + " {\n\t\t\t\tborder: 1px solid silver;\n\t\t\t\tbackground-color: honeydew;\n\t\t\t\tmargin-bottom: 1em;\n\t\t\t\tpadding: 1em;\n\t\t\t}\n\t\t\t." + WUI_NOTIF_CLASS_ERROR + " {\n\t\t\t\tborder: 1px solid salmon;\n\t\t\t\tbackground-color: lightsalmon;\n\t\t\t\tmargin-bottom: 1em;\n\t\t\t\tpadding: 1em;\n\t\t\t}\n\t\t";
        document.head.appendChild(style);
    };
    return WuiNotif;
}());
exports.WuiNotif = WuiNotif;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJub3RpZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0VBQWtFO0FBQ2xFLHlFQUF5RTtBQUN6RSw2QkFBNkI7OztBQUU3QixJQUFNLFlBQVksR0FBRyxXQUFXLENBQUE7QUFDaEMsSUFBTSxvQkFBb0IsR0FBRyxnQkFBZ0IsQ0FBQTtBQUM3QyxJQUFNLHFCQUFxQixHQUFHLGlCQUFpQixDQUFBO0FBRS9DLEVBQUU7QUFDRix3RUFBd0U7QUFDeEUseUVBQXlFO0FBQ3pFLHNFQUFzRTtBQUN0RSxpQkFBaUI7QUFDakIsRUFBRTtBQUNGO0lBSUM7UUFGUSxZQUFPLEdBQVcsSUFBSSxDQUFBLENBQUMsb0JBQW9CO1FBR2xELElBQUksQ0FBQyxFQUFFLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUN2QyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxZQUFZLENBQUE7UUFFekIsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBRWxDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQTtJQUNqQixDQUFDO0lBRUQsb0NBQW9DO0lBQ3BDLHVCQUFJLEdBQUosVUFBSyxHQUFXO1FBQWhCLGlCQVNDO1FBUkEsSUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUN4QyxJQUFJLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQTtRQUNwQixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFBO1FBQ3hDLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBRXpCLFVBQVUsQ0FBQztZQUNWLEtBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQzFCLENBQUMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7SUFDakIsQ0FBQztJQUVELGlDQUFpQztJQUNqQyx3QkFBSyxHQUFMLFVBQU0sR0FBVztRQUFqQixpQkFTQztRQVJBLElBQUksSUFBSSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDeEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUE7UUFDcEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQTtRQUN6QyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUV6QixVQUFVLENBQUM7WUFDVixLQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUMxQixDQUFDLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQ2pCLENBQUM7SUFFTyw0QkFBUyxHQUFqQjtRQUNDLElBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDM0MsS0FBSyxDQUFDLElBQUksR0FBRyxVQUFVLENBQUE7UUFDdkIsS0FBSyxDQUFDLFNBQVMsR0FBRyxjQUNkLFlBQVksa0hBTVosb0JBQW9CLHdKQU1wQixxQkFBcUIscUpBTXhCLENBQUE7UUFDRCxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUNqQyxDQUFDO0lBQ0YsZUFBQztBQUFELENBQUMsQUE5REQsSUE4REM7QUE5RFksNEJBQVEifQ==