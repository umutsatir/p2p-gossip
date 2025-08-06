import { v4 as uuidv4 } from "uuid";
import os from "os";

function getUUID() {
    return uuidv4();
}

function getLocalIPAddress(): string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] || []) {
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address;
            }
        }
    }
    return "127.0.0.1";
}

export { getUUID, getLocalIPAddress };
