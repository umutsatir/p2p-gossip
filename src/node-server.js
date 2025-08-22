"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeServer = void 0;
var node_1 = require("./node");
var net = require("net");
var utils_1 = require("./utils");
var NodeServer = /** @class */ (function () {
    function NodeServer(newPeerList, newPort) {
        var _this = this;
        this.messageCache = new Set();
        this.node = new node_1.Node((0, utils_1.getLocalIPAddress)(), newPort, newPeerList);
        this.server = this.createServer();
        this.server.listen(this.node.port, function () {
            console.log("Server listening on ".concat(_this.node.ip, ":").concat(_this.node.port));
        });
        newPeerList.forEach(function (peer) {
            var socket = _this.connectToPeer(peer.ip, peer.port);
            peer.socket = socket;
        });
    }
    NodeServer.prototype.createServer = function () {
        var _this = this;
        return net.createServer(function (c) {
            var buffer = "";
            // Normalize IPv6-mapped IPv4 addresses and use correct remote port
            var remoteAddress = c.remoteAddress || "unknown";
            if (remoteAddress.startsWith("::ffff:")) {
                remoteAddress = remoteAddress.replace("::ffff:", "");
            }
            var remotePort = c.remotePort
                ? c.remotePort.toString()
                : "unknown";
            console.log("New node ".concat(remoteAddress, ":").concat(remotePort, " connected."));
            c.on("end", function () {
                console.log("Node ".concat(remoteAddress, ":").concat(remotePort, " disconnected."));
            });
            c.on("data", function (chunk) {
                buffer += chunk.toString();
                var lines = buffer.split("\n");
                buffer = lines.pop() || ""; // store the incompleted side of the buffer
                lines.forEach(function (line) {
                    _this.parseMessage(line, c);
                });
            });
        });
    };
    NodeServer.prototype.sendMessage = function (message) {
        var newMessage = {
            type: "MESSAGE",
            id: (0, utils_1.getUUID)(),
            from: this.node.uid,
            payload: {
                text: message,
            },
            timestamp: Date.now(),
        };
        // add message into cache first, then broadcast
        this.messageCache.add(newMessage.id);
        this.broadcast(newMessage);
    };
    NodeServer.prototype.connectToPeer = function (ip, port) {
        var _this = this;
        var socket = net.connect({ host: ip, port: port }, function () {
            console.log("Connected to peer ".concat(ip, ":").concat(port));
            var helloMessage = {
                type: "HELLO",
                id: (0, utils_1.getUUID)(),
                from: _this.node.uid,
                payload: {
                    ip: _this.node.ip,
                    port: _this.node.port,
                    peers: _this.node.peerList,
                },
                timestamp: Date.now(),
            };
            socket.write(JSON.stringify(helloMessage) + "\n");
        });
        var buffer = "";
        socket.on("data", function (chunk) {
            buffer += chunk.toString();
            var lines = buffer.split("\n");
            buffer = lines.pop() || "";
            lines.forEach(function (line) { return _this.parseMessage(line, socket); });
        });
        socket.on("error", function (err) {
            console.log("Error in connectToPeer, IP:", ip, ", Port:", port, ", Error:", err);
        });
        socket.on("end", function () {
            console.log("Disconnected from ".concat(ip, ":").concat(port));
        });
        return socket;
    };
    NodeServer.prototype.parseMessage = function (message, socket) {
        var _this = this;
        try {
            var parsedMessage = JSON.parse(message);
            switch (parsedMessage.type) {
                case "HELLO":
                    var newPeer_1 = {
                        id: parsedMessage.from,
                        ip: parsedMessage.payload.ip,
                        port: parsedMessage.payload.port,
                        lastSeen: Date.now(),
                        socket: socket,
                    };
                    // check is peer already added into the peer list
                    var isPeerAlreadyAdded_1 = false;
                    this.node.peerList.forEach(function (peer) {
                        if (peer.ip == newPeer_1.ip &&
                            peer.port == newPeer_1.port) {
                            isPeerAlreadyAdded_1 = true;
                            peer.lastSeen = Date.now();
                        }
                    });
                    if (!isPeerAlreadyAdded_1)
                        this.node.peerList.push(newPeer_1);
                    this.setupSocketEvents(socket, newPeer_1);
                    // handling peer list
                    if (!parsedMessage.payload ||
                        !Array.isArray(parsedMessage.payload.peers)) {
                        console.log("Invalid payload in HELLO message.");
                        return;
                    }
                    var peers = parsedMessage.payload.peers;
                    peers = peers.filter(function (peer) {
                        return !_this.node.peerList.some(function (p) { return p.ip === peer.ip && p.port === peer.port; });
                    });
                    // send message
                    var helloMessage = {
                        type: "HELLO",
                        id: (0, utils_1.getUUID)(),
                        from: this.node.uid,
                        payload: {
                            ip: this.node.ip,
                            port: this.node.port,
                            peers: this.node.peerList,
                        },
                        timestamp: Date.now(),
                    };
                    socket.write(JSON.stringify(helloMessage) + "\n");
                    break;
                case "MESSAGE":
                    if (!this.messageCache.has(parsedMessage.id)) {
                        this.messageCache.add(parsedMessage.id);
                        console.log("New message:", parsedMessage.payload);
                        var originPeer = this.node.peerList.find(function (p) { return p.socket === socket; });
                        // with broadcast function, we will gossip the received message to our peer list
                        this.broadcast(parsedMessage, originPeer);
                    }
                    break;
                default:
                    break;
            }
        }
        catch (error) {
            console.log("Message cannot be parsed: " + error);
        }
    };
    NodeServer.prototype.broadcast = function (message, originPeer) {
        // origin peer is the current peer (it shouldn't receive its own message)
        this.node.peerList.forEach(function (peer) {
            if (originPeer &&
                peer.ip === originPeer.ip &&
                peer.port === originPeer.port) {
                return;
            }
            try {
                peer.socket.write(JSON.stringify(message) + "\n");
            }
            catch (err) {
                console.error("Broadcast error to ".concat(peer.ip, ":").concat(peer.port, " \u2192 ").concat(err));
            }
        });
    };
    NodeServer.prototype.setupSocketEvents = function (socket, peer) {
        var _this = this;
        if (socket._eventsBound)
            return; // disconnect if it's already connected
        socket._eventsBound = true;
        socket.setKeepAlive(true);
        socket.on("error", function (err) {
            console.log("Peer ".concat(peer.ip, ":").concat(peer.port, " error:"), err.message);
            _this.removePeer(peer);
        });
        socket.on("close", function () {
            console.log("Peer ".concat(peer.ip, ":").concat(peer.port, " closed connection."));
            _this.removePeer(peer);
        });
        socket.on("timeout", function () {
            console.log("Peer ".concat(peer.ip, ":").concat(peer.port, " timed out."));
            _this.removePeer(peer);
        });
    };
    NodeServer.prototype.removePeer = function (peer) {
        this.node.peerList = this.node.peerList.filter(function (p) { return p.id !== peer.id; });
    };
    return NodeServer;
}());
exports.NodeServer = NodeServer;
