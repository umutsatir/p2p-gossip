"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var node_server_1 = require("./node-server");
var utils_1 = require("./utils");
function main() {
    var args = process.argv.slice(2);
    if (!args || args.length == 0) {
        console.error("Port should be given as a command-line argument.");
        process.exit(1);
    }
    var portArg = args[0];
    var isBootstrap = args[1] && args[1] == "bootstrap" ? true : false;
    var port = parseInt(portArg, 10);
    if (isNaN(port) || port <= 0 || port > 65535) {
        console.error("Invalid port number.");
        process.exit(1);
    }
    var peerList = [];
    // creating peer list with bootstrap node(s)
    var bootstrapIP = (0, utils_1.getLocalIPAddress)(); // ! only get local IP for testing in the same computer
    var bootstrapPort = 5100;
    if (!isBootstrap) {
        peerList = [
            {
                id: (0, utils_1.getPeerID)(bootstrapIP, bootstrapPort),
                ip: bootstrapIP, // example IP
                port: bootstrapPort,
                lastSeen: Date.now(),
                socket: null,
            },
        ];
    }
    var server = new node_server_1.NodeServer(peerList, port);
    return server;
}
main();
