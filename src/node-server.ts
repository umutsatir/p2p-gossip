import { Node } from "./node";
import * as net from "net";
import { getLocalIPAddress, getUUID } from "./utils";

interface Message {
    type: "HELLO" | "MESSAGE";
    id: string;
    from: string;
    payload: object;
    timestamp: number;
}

interface Peer {
    id: string;
    ip: string;
    port: number;
    lastSeen: number;
    socket: any;
}

class NodeServer {
    private node: Node;
    private server: net.Server;
    private port: number;
    private messageCache: Set<string> = new Set();

    constructor(newPort: number, newPeerList: Array<Peer>) {
        this.port = newPort;
        this.node = new Node(getLocalIPAddress(), newPeerList);
        this.server = this.createServer();
        this.server.listen(this.port, () => {
            console.log(`Server listening on ${this.node.ip}:${this.port}`);
        });

        newPeerList.forEach((peer) => {
            const socket = this.connectToPeer(peer.ip, peer.port);
            peer.socket = socket;
        });
    }

    createServer() {
        const message: Message = {
            type: "HELLO",
            id: getUUID(),
            from: this.node.uid,
            payload: {
                ip: this.node.ip,
                port: this.port,
                peers: this.node.peerList,
            },
            timestamp: Date.now(),
        };

        return net.createServer((c) => {
            let buffer = "";
            console.log("Node " + this.node.ip + " connected.");
            c.on("end", () => {
                console.log("Node " + this.node.ip + " disconnected.");
            });
            c.on("data", (chunk) => {
                buffer += chunk.toString();
                let lines = buffer.split("\n");
                buffer = lines.pop()! || ""; // incomplete kısmı tekrar sakla
                lines.forEach((line) => {
                    this.parseMessage(line, c);
                });
            });
            c.write(JSON.stringify(message) + "\n");
        });
    }

    sendMessage(message: string, to: Peer) {
        const newMessage: Message = {
            type: "MESSAGE",
            id: getUUID(),
            from: this.node.uid,
            payload: {
                text: message,
            },
            timestamp: Date.now(),
        };

        // add message into cache first, then broadcast
        this.messageCache.add(newMessage.id);

        this.broadcast(newMessage);
    }

    private connectToPeer(ip: string, port: number): net.Socket {
        const socket = net.connect({ host: ip, port: port }, () => {
            console.log(`Connected to peer ${ip}:${port}`);

            const helloMessage: Message = {
                type: "HELLO",
                id: getUUID(),
                from: this.node.uid,
                payload: {
                    ip: this.node.ip,
                    port: this.port,
                    peers: this.node.peerList,
                },
                timestamp: Date.now(),
            };
            socket.write(JSON.stringify(helloMessage) + "\n");
        });

        let buffer = "";
        socket.on("data", (chunk) => {
            buffer += chunk.toString();
            let lines = buffer.split("\n");
            buffer = lines.pop()! || "";
            lines.forEach((line) => this.parseMessage(line, socket));
        });

        socket.on("end", () => {
            console.log(`Disconnected from ${ip}:${port}`);
        });

        return socket;
    }

    private parseMessage(message: string, socket: net.Socket) {
        try {
            let parsedMessage = JSON.parse(message);

            switch (parsedMessage.type) {
                case "HELLO":
                    const newPeer: Peer = {
                        id: parsedMessage.from,
                        ip: parsedMessage.payload.ip,
                        port: parsedMessage.payload.port,
                        lastSeen: Date.now(),
                        socket: socket,
                    };

                    // check is peer already added into the peer list
                    let isPeerAlreadyAdded = false;
                    this.node.peerList.forEach((peer) => {
                        if (peer.ip == newPeer.ip && peer.port == newPeer.port)
                            isPeerAlreadyAdded = true;
                    });
                    if (!isPeerAlreadyAdded) this.node.peerList.push(newPeer);

                    this.setupSocketEvents(socket, newPeer);

                    // handling peer list
                    if (
                        !parsedMessage.payload ||
                        !Array.isArray(parsedMessage.payload.peers)
                    ) {
                        console.log("Invalid payload in HELLO message.");
                        return;
                    }

                    const peers: Array<Peer> = parsedMessage.payload.peers;
                    peers.forEach((peer: Peer) => {
                        const socket = this.connectToPeer(peer.ip, peer.port);
                        peer.socket = socket;
                        this.node.peerList.push(peer);
                    });

                    // send message
                    const helloMessage: Message = {
                        type: "HELLO",
                        id: getUUID(),
                        from: this.node.uid,
                        payload: {
                            ip: this.node.ip,
                            port: this.port,
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

                        const originPeer = this.node.peerList.find(
                            (p) => p.socket === socket
                        );
                        // with broadcast function, we will gossip the received message to our peer list
                        this.broadcast(parsedMessage, originPeer);
                    }
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.log("Message cannot be parsed: " + error);
        }
    }

    private broadcast(message: Message, originPeer?: Peer) {
        // origin peer is the current peer (it shouldn't receive its own message)
        this.node.peerList.forEach((peer) => {
            if (
                originPeer &&
                peer.ip === originPeer.ip &&
                peer.port === originPeer.port
            ) {
                return;
            }

            try {
                peer.socket.write(JSON.stringify(message) + "\n");
            } catch (err) {
                console.error(
                    `Broadcast error to ${peer.ip}:${peer.port} → ${err}`
                );
            }
        });
    }

    private setupSocketEvents(socket: net.Socket, peer: Peer) {
        socket.setKeepAlive(true);

        socket.on("error", (err) => {
            console.log(`Peer ${peer.ip}:${peer.port} error:`, err.message);
            this.removePeer(peer);
        });

        socket.on("close", () => {
            console.log(`Peer ${peer.ip}:${peer.port} closed connection.`);
            this.removePeer(peer);
        });

        socket.on("timeout", () => {
            console.log(`Peer ${peer.ip}:${peer.port} timed out.`);
            this.removePeer(peer);
        });
    }

    private removePeer(peer: Peer) {
        this.node.peerList = this.node.peerList.filter((p) => p.id !== peer.id);
    }
}

export { NodeServer };
export type { Peer };
