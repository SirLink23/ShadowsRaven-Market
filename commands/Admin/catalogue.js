const Discord = require('discord.js');
const catalogue = require("../../util/catalogue.json");
const ee = require("../../embed.json")

module.exports = {
    name: 'updatecatalogue',
    description: 'Mets à jour le catalogue',
    permission: "MANAGE_GUILD",
    run: async (client, message) => {
        message.delete()

        for (const categorie in catalogue) {
            const embed = new Discord.MessageEmbed()
                .setAuthor("Choisissez l'item à commander\nUn ticket sera ouvert pour finaliser votre commande.")
                .setColor(ee.color);

            let cataliste = [];

            let itemsList = [];

            for (const item of catalogue[categorie].items) {
                cataliste.push(item)
                itemsList.push({
                    label: item.name,
                    emoji: item.emoji,
                    value: item.name + "-catalogue",
                    description: `${item.price}${item.comptage} $`
                });
            };
            console.log(cataliste)
            const dropdown = new Discord.MessageSelectMenu()
                .setCustomId('itemSelector')
                .setPlaceholder('Choisissez votre item.')
                .addOptions(itemsList);

            const row = new Discord.MessageActionRow()
                .addComponents(dropdown);

            let title = new Discord.MessageEmbed()
                .setTitle("**__Catalogue__**")
                .setDescription(
                    `La **Shadow's Raven** est honnête, sérieuse et organisée.\nCommercer avec elle est synonyme d'échange de confiance.\nC'est pourquoi si tu commandes un des items ci-dessous, tu devras en faire de même.\nDans les cas contraires, vous serez **blacklist** et **banni** de notre market.`
                )
                .setFooter(ee.footertext)
                .setColor(ee.color)
                .setThumbnail(client.user.displayAvatarURL())
                .setTimestamp();

            /*for (let i = 0; i < cataliste.length; i++) {
                
                client.channels.cache.get(catalogue[categorie].channel).send(cataliste[i]);
                console.log(cataliste[i])
            }*/

            let Embed = new Discord.MessageEmbed()
                .setColor(ee.color)
                .setDescription(
                    `${catalogue[categorie].emoji} ***__${catalogue[categorie].name
                    }__***\n\n ${cataliste
                        .map(
                            (i) =>
                                `${i.emoji} **${i.name
                                }** à __${i.price}$${i.comptage}__ ${i.dispo == true ? "<a:Yes:788101652553007124>" : "<a:No:788101695921455195>"} (limite de ${i.limite} par commande)`
                        )
                        .join(`\n`)}`
                )
            client.channels.cache.get(catalogue[categorie].channel).send({ embeds: [title] });
            client.channels.cache.get(catalogue[categorie].channel).send({ embeds: [Embed] });
            client.channels.cache.get(catalogue[categorie].channel).send({ embeds: [embed], components: [row] });

        }

        await message.channel.send("Le catalogue a été actualisé !");
    },
};