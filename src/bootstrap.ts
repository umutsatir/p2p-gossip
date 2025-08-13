import { getUUID } from "./utils";

class Bootstrap {
    public uid: string;
    public ip: string;
    public port: number;

    constructor(newIP: string, newPort: number) {
        this.uid = getUUID();
        this.ip = newIP;
        this.port = newPort;
    }
}

export { Bootstrap };
