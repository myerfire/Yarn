const { Client, Intents } = require("discord.js");
const { Pool } = require("pg");
const { keys } = require("../config.json");

const client = new Client({ intents: new Intents(32767) }); // 32767 is all intents
client.db = new Pool({
    user: "postgres",
    database: "yarn",
    password: keys.postgres,
});

client.login(keys.token);