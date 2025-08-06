import { Bootstrap } from "./bootstrap";
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
    public node: Node;
    public server: net.Server;
    public port: number;

    constructor(newPort: number) {
        this.port = newPort;
        this.node = new Node(getLocalIPAddress(), [
            {
                id: getUUID(),
                ip: "192.168.1.101",
                port: this.port,
                lastSeen: Date.now(),
                socket: null,
            },
        ]);
        this.server = this.createServer();

        // if (!process.argv.slice(2)[0]) {
        //     console.log("Port should be given.");
        //     return;
        // }
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

    private parseMessage(message: string, socket: net.Socket) {
        try {
            let parsedMessage = JSON.parse(message);

            switch (parsedMessage.type) {
                case "HELLO":
                    const newPeer: Peer = {
                        id: getUUID(),
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

                    // send message
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
                    socket.write(JSON.stringify(message) + "\n");
                    break;
                case "MESSAGE":
                    // TODO: receive message logic will be added
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.log("Message cannot be parsed: " + error);
        }
    }
}

export { NodeServer };
export type { Peer };
