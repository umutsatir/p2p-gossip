import { Bootstrap } from "./bootstrap";
import { Peer } from "./node-server";

class Node extends Bootstrap {
    public peerList: Array<Peer>;

    constructor(newIP: string, newPeerList: Array<Peer>) {
        super(newIP);
        this.peerList = newPeerList;
    }
}

export { Node };
