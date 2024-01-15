const Timeout = new Set();
const Discord = require("discord.js")
const { MessageEmbed } = require('discord.js')
const humanizeDuration = require("humanize-duration");
const ee = require("../../embed.json")

module.exports = async (client, message) => {
    if (message.author.bot) return;
    if (!message.member) message.member = await message.guild.members.fetch(message.member.id);
    if (!message.guild) return;

    const prefix = ".";

    if (message.content.includes(client.user.id)) {
        message.channel.send(`👋 Mon prefix est : \`${prefix}\``)
    }


    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();
    if (cmd.length === 0) return;
    const command = client.commands.get(cmd) || client.commands.find((x) => x.aliases && x.aliases.includes(cmd));
    if (command) {
        if (command.permission && !message.member.permissions.has(command.permission)) {
            const errorPerm = new Discord.MessageEmbed()
                .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
                .setDescription(`Vous n'avez pas la permissions suivante : \`${command.permission}\``)
                .setColor(ee.wrongcolor)
                .setFooter(`${ee.footertext}`, ee.footericon)
            return message.channel.send({ embeds: [errorPerm] })
        }

        if (command.timeout) {
            if (Timeout.has(`${message.author.id}${command.name}`)) {
                const embed = new MessageEmbed()
                    .setTitle('Vous êtes en coodown !')
                    .setDescription(`:x: Vous devez attendre **${humanizeDuration(command.timeout, { round: true })}** pour utiliser à nouveau cette commande`)
                    .setColor('#ff0000')
                return message.channel.send({ embeds: [embed] })
            } else {
                command.run(client, message, args);
                Timeout.add(`${message.author.id}${command.name}`)
                setTimeout(() => {
                    Timeout.delete(`${message.author.id}${command.name}`)
                }, command.timeout);
            }
        } else {
            command.run(client, message, args)
        }
    }
}