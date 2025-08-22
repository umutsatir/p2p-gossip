import { NodeServer, Peer } from "./node-server";
import { getLocalIPAddress, getPeerID } from "./utils";

function main() {
    const args = process.argv.slice(2);
    if (!args || args.length == 0) {
        console.error("Port should be given as a command-line argument.");
        process.exit(1);
    }

    const portArg = args[0];
    const isBootstrap = args[1] && args[1] == "bootstrap" ? true : false;

    const port: number = parseInt(portArg as string, 10);
    if (isNaN(port) || port <= 0 || port > 65535) {
        console.error("Invalid port number.");
        process.exit(1);
    }

    let peerList: Array<Peer> = [];

    // creating peer list with bootstrap node(s)
    const bootstrapIP: string = getLocalIPAddress(); // ! only get local IP for testing in the same computer
    const bootstrapPort: number = 5100;

    if (!isBootstrap) {
        peerList = [
            {
                id: getPeerID(bootstrapIP, bootstrapPort),
                ip: bootstrapIP, // example IP
                port: bootstrapPort,
                lastSeen: Date.now(),
                socket: null,
            },
        ];
    }

    const server = new NodeServer(peerList, port);
    return server;
}

main();
