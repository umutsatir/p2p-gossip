import { NodeServer, Peer } from "./node-server";
import { getUUID } from "./utils";

function main() {
    const portArg = process.argv.slice(2)[0];
    if (!portArg) {
        console.error("Port should be given as a command-line argument.");
        process.exit(1);
    }

    const port: number = parseInt(portArg, 10);
    if (isNaN(port) || port <= 0 || port > 65535) {
        console.error("Invalid port number.");
        process.exit(1);
    }

    const peerList: Array<Peer> = [
        {
            id: getUUID(),
            ip: "127.0.0.1", // example IP
            port: port,
            lastSeen: Date.now(),
            socket: null,
        },
    ];

    const server = new NodeServer(port, peerList);
}

main();
