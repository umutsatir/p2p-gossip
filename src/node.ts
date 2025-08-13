import { Bootstrap } from "./bootstrap";
import { Peer } from "./node-server";

class Node extends Bootstrap {
    public peerList: Array<Peer>;

    constructor(newIP: string, newPort: number, newPeerList: Array<Peer>) {
        super(newIP, newPort);
        this.peerList = newPeerList;
    }
}

export { Node };
