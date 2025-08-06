import { getUUID } from "./utils";

class Bootstrap {
    public uid: string;
    public ip: string;

    constructor(newIP: string) {
        this.uid = getUUID();
        this.ip = newIP;
    }
}

export { Bootstrap };
