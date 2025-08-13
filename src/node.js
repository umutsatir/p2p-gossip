"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Node = void 0;
var bootstrap_1 = require("./bootstrap");
var Node = /** @class */ (function (_super) {
    __extends(Node, _super);
    function Node(newIP, newPort, newPeerList) {
        var _this = _super.call(this, newIP, newPort) || this;
        _this.peerList = newPeerList;
        return _this;
    }
    return Node;
}(bootstrap_1.Bootstrap));
exports.Node = Node;
