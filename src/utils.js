"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUUID = getUUID;
exports.getPeerID = getPeerID;
exports.getLocalIPAddress = getLocalIPAddress;
var uuid_1 = require("uuid");
var crypto = require("crypto");
var os = require("os");
function getUUID() {
    return (0, uuid_1.v4)();
}
function getPeerID(ip, port) {
    var data = "".concat(ip, ":").concat(port);
    return crypto.createHash("sha256").update(data).digest("hex");
}
function getLocalIPAddress() {
    var interfaces = os.networkInterfaces();
    for (var _i = 0, _a = Object.keys(interfaces); _i < _a.length; _i++) {
        var name_1 = _a[_i];
        for (var _b = 0, _c = interfaces[name_1] || []; _b < _c.length; _b++) {
            var iface = _c[_b];
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address;
            }
        }
    }
    return "127.0.0.1";
}
