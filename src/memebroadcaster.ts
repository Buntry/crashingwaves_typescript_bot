import { Client, BaseGuildTextChannel, Message, Snowflake, Collection } from "discord.js"
import { ClientFunction } from "./crashingbot"
import { DateTime, Duration } from "luxon"
import DefaultMap from "./utils/DefaultMap"

// What channels to get memes from and what channels to post them in
interface MemeChannel { server : string, channel : string}
const SOURCE_CHANNELS : MemeChannel[] = [
    {"server": "599834886546653184", "channel": "708424796391604264"}
    //{"server": "932539452482547814", "channel": "932539453308809218"}
]
const BROADCAST_CHANNELS : MemeChannel[] = [
    {"server": "782423463393755138", "channel": "829230702822031362"}
    //{"server": "932539452482547814", "channel": "932539531381587988"}
]

// Time between every meme load
const MEME_TIMER = Duration.fromObject({ minutes: 30 }).toMillis()

export default class MemeBroadcaster implements ClientFunction {

    private timestamps : DefaultMap<MemeChannel, DateTime> = new DefaultMap(DateTime.now)
    private snowflakes : Map<MemeChannel, Snowflake> = new Map()

    handleClient(client : Client<boolean>): void {
        SOURCE_CHANNELS.forEach(memeChannel => {
            setInterval(() => this.listenToMemeChannel(client, memeChannel), MEME_TIMER)
        })
    }

    async getMemeChannel(client : Client<boolean>, memeChannel : MemeChannel) : Promise<BaseGuildTextChannel> {
        return client.guilds.fetch(memeChannel.server)
            .then(guild => guild.channels.fetch(memeChannel.channel))
            .then(channel => channel as BaseGuildTextChannel)
    } 

    listenToMemeChannel(client : Client<boolean>, memeChannel : MemeChannel) : void {
        this.getMemeChannel(client, memeChannel)
            .then(channel => this.postLatestMemesFromChannel(client, channel, memeChannel))
    }

    postLatestMemesFromChannel(client : Client<boolean>, channel : BaseGuildTextChannel, memeChannel : MemeChannel) : void {
        channel.messages.fetch({ after: this.snowflakes.get(memeChannel) })
            .then(messages => this.postMessages(client, messages, memeChannel))
    }

    postMessages(client : Client<boolean>, messages : Collection<Snowflake, Message>, memeChannel : MemeChannel) : void {
        messages.filter((message, ) => this.isMeme(message, memeChannel))
        .forEach((message, snowflake) => {
            // set the latest message datetime so we don't repost memes
            const messageDateTime = DateTime.fromMillis(message.createdTimestamp)
            if (messageDateTime > (this.timestamps.get(memeChannel) || 0)) {
                this.timestamps.set(memeChannel, messageDateTime)
                this.snowflakes.set(memeChannel, snowflake)
            }

            BROADCAST_CHANNELS.forEach(memeChannel => {
                this.getMemeChannel(client, memeChannel)
                    .then(channel => this.uploadMeme(channel, message))
            })
        })
    }

    uploadMeme(channel : BaseGuildTextChannel, message : Message) : void {
        if (message.attachments.size > 0) {
            message.attachments.each((attachment,) => channel.send({ files: [`${attachment.url}`] }))
        } else {
            channel.send(message.content)
        }
    }

    isMeme(message : Message, memeChannel : MemeChannel) : boolean {
        // is later than the last meme we posted
        const messageDateTime = DateTime.fromMillis(message.createdTimestamp)
        if (messageDateTime < this.timestamps.get(memeChannel)) return false

        // if the message is not from a bot
        if (message.author.bot) return false
        
        // is a meme
        return message.attachments.size > 0 || this.isValidURL(message.content)
    }
    
    // Checks if a string is a url
    // src: https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url
    isValidURL(str : string) : boolean {
        const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
          '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
          '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
          '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
          '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
          '(\\#[-a-z\\d_]*)?$','i') // fragment locator
        return !!pattern.test(str)
    }
}