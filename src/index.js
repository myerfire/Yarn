const fs = require("fs");
const moment = require("moment");
const { keys } = require("../config.json");
const { Client, Intents, Collection } = require("discord.js");
const LastFm = require("lastfm-node-client");
const { Pool } = require("pg");

const client = new Client({ intents: new Intents(32767) }); // 32767 is all intents
/* LOAD COMMANDS */
client.commands = new Collection();
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
console.log("[index.js] [COMMANDS] Loading commands..");
for (const commandFile of commandFiles) {
    const command = require(`./commands/${commandFile}`);
    if (command.disabled) continue;
    if (command.isGroup) command.init(command); // handle subcommand initialization in command file
    client.commands.set(command.data.name, command);
    console.log(`[index.js] [COMMANDS] Command /${command.data.name} loaded.`);
}
/* REGISTER EVENTS */
const eventFiles = fs.readdirSync("./events").filter(file => file.endsWith(".js"));
console.log("[index.js] [EVENTS] Registering events..");
for (const eventFile of eventFiles) {
    const event = require(`./events/${eventFile}`);
    if (!event.active) continue;
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
        console.log(`[index.js] [EVENTS] One time event ${event.name} registered.`);
    } else {
        client.on(event.name, (...args) => event.execute(...args));
        console.log(`[index.js] [EVENTS] Persistent event ${event.name} registered.`);
    }
}
/* COMMAND EXECUTION */
client.on("interactionCreate", async interaction => {
    if (!interaction.isCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`[index.js] [COMMAND ERROR] [/${command.name}] [${moment().format("M/D/Y - h:m:s A")}] ${error}`);
        if (!interaction.replied) await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
    }
});
/* DATABASE */
client.db = new Pool({
    user: "postgres",
    database: "yarn",
    password: keys.postgres,
});
/* LAST.FM */
client.lastfm = new LastFm(keys.lastfm);
/* START BOT */
client.login(keys.token);