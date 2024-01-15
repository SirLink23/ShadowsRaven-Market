const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js");
const fs = require('fs');
const { millify } = require('millify');
const moment = require("moment");
const ee = require("../../embed.json")

module.exports = {
    name: 'ventes',
    description: "Affiche un historique des commandes.",
    permission: "MANAGE_GUILD",
    run: async (client, message, args) => {
        const db = JSON.parse(fs.readFileSync("./util/historiqueVentes.json", "utf8"));

        if (args[0]) {
            if (isNaN(args[0])) {
                console.log("patate")
                let momentTime = args[1];

                if (!db[momentTime]) return message.channel.send({ content: "Il n'y a eu aucune commande le jour donné.", ephemeral: true });

                let recettes = 0;

                for (const vente of db[momentTime]) {
                    recettes = recettes + parseInt(vente.prix, 10);
                };

                const embed = new Discord.MessageEmbed()
                    .setColor(ee.color)
                    .setTitle(`📜 Récapitulatif des commandes du ${momentTime.substring(2, 0)}/${momentTime.substring(4, 2)}/${momentTime.substring(8, 4)}`)
                    .addField("Nombre de commandes", db[momentTime].length.toString(), true)
                    .addField("Recettes", `${millify(recettes, { precision: 15, decimalSeparator: ',' })}$`, true)

                message.channel.send({ embeds: [embed] });
            } else {
                return message.channel.send({ content: "La valeur doit être un nombre.", ephemeral: true })
            }
        } else {
            let momentTime = moment().format("DDMMYYYY");

            if (!db[momentTime]) return message.channel.send("Il n'y a eu aucune commande aujourd'hui.");

            let recettes = 0;

            for (const vente of db[momentTime]) {
                recettes = recettes + parseInt(vente.prix, 10);
            };

            const embed = new Discord.MessageEmbed()
                .setColor(ee.color)
                .setTitle(`📜 Récapitulatif des commandes du ${momentTime.substring(2, 0)}/${momentTime.substring(4, 2)}/${momentTime.substring(8, 4)}`)
                .addField("Nombre de commandes", db[momentTime].length.toString(), true)
                .addField("Recettes", `${millify(recettes, { precision: 15, decimalSeparator: ',' })}$`, true)

            message.channel.send({ embeds: [embed] });
        }


    }
}