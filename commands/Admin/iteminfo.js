const Discord = require('discord.js');
const catalogue = require("../../util/catalogue.json");

module.exports = {
    name: 'iteminfo',
    description: 'Donne des informations sur un item',
    permission: "",
    run: async (client, message, args) => {
        message.delete()

        const embed = new Discord.MessageEmbed()
            .setAuthor("Choisissez l'item dont vous souhaitez avoir des informations")
            .setColor("#490014");

        let itemsList = [];

        for (const categorie in catalogue) {

            for (const item of catalogue[categorie].items) {
                console.log(item.name)
                itemsList.push({
                    label: item.name,
                    emoji: item.emoji,
                    value: item.name + "-info"
                });
            };

        }

        const dropdown = new Discord.MessageSelectMenu()
            .setCustomId('itemInfoSelector')
            .setPlaceholder('Choisissez votre item.')
            .addOptions(itemsList);

        const row = new Discord.MessageActionRow()
            .addComponents(dropdown);

        message.channel.send({ embeds: [embed], components: [row] });
    },
};