const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');
const catalogue = require("../../util/catalogue.json");

module.exports.run = async (client, interaction) => {

	for (const categorie in catalogue) {
		const embed = new Discord.MessageEmbed()
			.setAuthor("Choisissez l'item à commander")
			.setColor("#490014");

		let itemsList = [];

		for (const item of catalogue[categorie].items) {
			itemsList.push({
				label: item.name,
				//emoji: item.emoji,
				value: item.name + "-catalogue",
				description: item.price + " " + item.comptage
			});
		};

		const dropdown = new Discord.MessageSelectMenu()
			.setCustomId('itemSelector')
			.setPlaceholder('Choisissez votre item.')
			.addOptions(itemsList);

		const row = new Discord.MessageActionRow()
			.addComponents(dropdown);

		client.channels.cache.get(catalogue[categorie].channel).send({ embeds: [embed], components: [row] });
	}

	await interaction.reply("Le catalogue a été actualisé !");

};

module.exports.data = new SlashCommandBuilder()
.setName('updatecatalogue')
.setDescription('Met à jour le catalogue.')
.setDefaultPermission(false)

module.exports.perms = ["670725919039815680", "855494763356880907"]; // rôles autorisés.