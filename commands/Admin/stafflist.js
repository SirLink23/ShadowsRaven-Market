const Discord = require('discord.js');
const ee = require("../../embed.json")

module.exports = {
    name: 'stafflist',
    description: '',
    permission: "",
    run: async (client, message, args) => {
        message.delete()

        const admin = message.guild.roles.cache.get("1009122825887547463").members.map(m => `<@${m.user.id}>`).join(", ")
        const resp = message.guild.roles.cache.get("825489457478107176").members.map(m => `<@${m.user.id}>`).join(", ")
        const discord = message.guild.roles.cache.get("838506839145840791").members.map(m => `<@${m.user.id}>`).join(", ")
        const dev = message.guild.roles.cache.get("838507691122229248").members.map(m => `<@${m.user.id}>`).join(", ")
        const vendeurs = message.guild.roles.cache.get("838509130556768307").members.map(m => `<@${m.user.id}>`).join(", ")
        const anim = message.guild.roles.cache.get("838509511936442369").members.map(m => `<@${m.user.id}>`).join(", ")
        const crea = message.guild.roles.cache.get("838511094946594826").members.map(m => `<@${m.user.id}>`).join(", ")
        const staff = message.guild.roles.cache.get("906322087701020703").members.size
        const nadmin = message.guild.roles.cache.get("1009122825887547463").members.size
        const nresp = message.guild.roles.cache.get("825489457478107176").members.size
        const ndiscord = message.guild.roles.cache.get("838506839145840791").members.size
        const ndev = message.guild.roles.cache.get("838507691122229248").members.size
        const nvendeurs = message.guild.roles.cache.get("838509130556768307").members.size
        const nanim = message.guild.roles.cache.get("838509511936442369").members.size
        const ncrea = message.guild.roles.cache.get("838511094946594826").members.size
        
        const embed = new Discord.MessageEmbed()
            .setColor(ee.color)
            .setTitle("Effectif du Shadow's Raven Market :")
            //.setAuthor({ name: 'Effectif - Shadow\'s Raven Market', iconURL: ee.footericon})
            .setTimestamp()
            .setFooter(ee.footertext, ee.footericon)
            .addFields(
                { name: `Administration (${nadmin})`, value: `${admin}`},
                { name: `Responsable (${nresp})`, value: `${resp}`},
                { name: `Équipe Discord (${ndiscord})`, value: `${discord}`},
                { name: `Équipe de Développement (${ndev})`, value: `${dev}`},
                { name: `Équipe d'Animation (${nanim})`, value: `${anim}`},
                { name: `Équipe de Création (${ncrea})`, value: `${crea}`},
                { name: `Équipe de Vente (${nvendeurs})`, value: `${vendeurs}`},
                { name: `Nombre de staff`, value: `${staff}`}
            )
        message.channel.send({ embeds: [embed] })
    },
};