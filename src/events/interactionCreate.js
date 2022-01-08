module.exports = {
	name: "interactionCreate",
    active: true,
	execute(interaction) {
		console.log(`[events/interactionCreate.js] [DEBUG] ${interaction.user.tag} in #${interaction.channel.name} of ${interaction.guild.name} triggered an interaction.`);
	},
};