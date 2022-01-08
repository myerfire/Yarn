const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

async function np(interaction) {
    let username;
    if (!interaction.options.getString("username")) {
        const data = await interaction.client.db.query("SELECT * FROM users WHERE id = $1", [BigInt(interaction.member.id)]);
        if (!data.rows[0] || !data.rows[0].lastfm) {
            return await interaction.reply("You must provide a Last.FM username or set your username with `/fm set <username>`");
        }
        username = data.rows[0].lastfm;
    } else {
        username = interaction.options.getString("username");
    }

    let mostRecentTrack;
    let trackInfo;
    try {
        mostRecentTrack = await interaction.client.lastfm.userGetRecentTracks({ username: username, limit: 1 });
        trackInfo = await interaction.client.lastfm.trackGetInfo({ track: mostRecentTrack["recenttracks"]["track"][0]["name"], artist: mostRecentTrack["recenttracks"]["track"][0]["artist"]["#text"], username: username });
    } catch {
        return await interaction.reply(`Last.FM user \`${username}\`does not exist.`);
    }
    /* if the track doesn't have @attr, it is not being played
    you must accept this fact. this is lastfm. nothing makes sense. */
    if (!("@attr" in mostRecentTrack["recenttracks"]["track"][0])) {
        return await interaction.reply("No song currently being played!");
    }

    const embed = new MessageEmbed()
        .setTitle(`${mostRecentTrack["recenttracks"]["track"][0]["artist"]["#text"]} - ${mostRecentTrack["recenttracks"]["track"][0]["name"]}`)
        .setAuthor({ name: interaction.member.user.username, url: `https://last.fm/user/${username}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true }) })
        .setThumbnail(mostRecentTrack["recenttracks"]["track"][0]["image"].slice("-1")[0]["#text"])
        .setDescription(`${trackInfo["track"]["userplaycount"]} plays`);
    await interaction.reply({ embeds: [embed] });
}

async function set(interaction) {
    const username = interaction.options.getString("username");
    try {
        await interaction.client.lastfm.userGetInfo({ user: username });
    } catch (e) {
        console.log(e);
        return await interaction.reply(`Last.FM user \`${username}\` does not exist.`);
    }
    await interaction.client.db.query("INSERT INTO users(id, lastfm) VALUES($1, $2) ON CONFLICT (id) DO UPDATE SET lastfm = $2", [BigInt(interaction.member.id), username]);
    await interaction.reply(`Set your Last.FM username to \`${username}\``);
}

const subcommands = new Map();
subcommands.set("np", np);
subcommands.set("set", set);

module.exports = {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName("fm")
        .setDescription("Last.FM API commands")
        .addSubcommand(subcommand =>
            subcommand
                .setName("np")
                .setDescription("Get your currently playing song from Last.FM")
                .addStringOption(option =>
                    option
                        .setName("username")
                        .setDescription("Username to look up on Last.FM. Defaults to your username if you set your Last.FM username")))
        .addSubcommand(subcommand =>
            subcommand
                .setName("set")
                .setDescription("Save your Last.FM username to Yarn")
                .addStringOption(option =>
                    option
                        .setName("username")
                        .setDescription("Username to save")
                        .setRequired(true))),
    async execute(interaction) {
        const subcommand = subcommands.get(interaction.options.getSubcommand());
        if (!subcommand) return;
        await subcommand(interaction);
    },
};