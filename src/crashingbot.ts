import { Client } from "discord.js"
import MemeBroadcaster from "./memebroadcaster"
import UptimeManager from "./uptimemanager"

export interface ClientFunction {
    handleClient(client : Client) : void
}

export class CrashingBot {

    private static clientHandlers : ClientFunction[] = [
        new MemeBroadcaster(),
        new UptimeManager()
    ]
    private client : Client

    constructor(client : Client) {
        this.client = client
        CrashingBot.clientHandlers.forEach(handler => handler.handleClient(this.client))
    }
}

export default CrashingBot