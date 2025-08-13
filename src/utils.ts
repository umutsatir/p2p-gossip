import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";
import * as os from "os";

function getUUID() {
    return uuidv4();
}

function getPeerID(ip: string, port: number): string {
    const data = `${ip}:${port}`;
    return crypto.createHash("sha256").update(data).digest("hex");
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

export { getUUID, getPeerID, getLocalIPAddress };
