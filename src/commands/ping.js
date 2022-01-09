const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Shows bot latency"),
    async execute(interaction) {
        await interaction.reply(`:ping_pong: Pong! Ping is **${interaction.client.ws.ping}ms**`);
    },
};