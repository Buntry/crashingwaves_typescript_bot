import { Duration } from "luxon"
import { Client } from "discord.js"
import { ClientFunction } from "./crashingbot"

export default class UptimeManager implements ClientFunction {
    handleClient(client: Client<boolean>): void {
        client.on("messageCreate", message => {
            if (message.content === ",cwuptime") {
                message.reply(Duration.fromMillis(client.uptime || 0).toHuman())
            }
        })
    }
}