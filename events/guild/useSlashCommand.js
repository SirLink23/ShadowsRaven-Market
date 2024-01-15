const Discord = require('discord.js');

module.exports = async (client, interaction) => {

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.run(client, interaction);
	} catch (error) {
		console.error(error);
		return interaction.reply({ content: 'Une erreur s\'est produite pendant l\'exécution de la commande !', ephemeral: true });
	}

};