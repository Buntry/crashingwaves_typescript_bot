import { config } from 'dotenv'
config()

import { Client, Intents } from 'discord.js'
import CrashingBot from './crashingbot'

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] })

client.once('ready', () => {
	console.log('Ready!')
    new CrashingBot(client)
})

client.login(process.env.BOT_TOKEN)

