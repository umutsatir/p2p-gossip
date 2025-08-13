"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bootstrap = void 0;
var utils_1 = require("./utils");
var Bootstrap = /** @class */ (function () {
    function Bootstrap(newIP, newPort) {
        this.uid = (0, utils_1.getUUID)();
        this.ip = newIP;
        this.port = newPort;
    }
    return Bootstrap;
}());
exports.Bootstrap = Bootstrap;
