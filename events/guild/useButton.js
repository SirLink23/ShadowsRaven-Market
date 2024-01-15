const Discord = require("discord.js")
const fs = require("fs")
const ee = require("../../embed.json")

module.exports = async (client, interaction) => {

	if (interaction.customId.startsWith("askForDeleteTicket")) {

		let RecapChannel = interaction.guild.channels.cache.get("946929432017395722"); // id channel recap commande (modifié)

		const RecapMessage = await RecapChannel.messages.fetch(interaction.customId.split('-').pop()).catch(err => { return });

		const filter = i => {
			i.deferUpdate();
			return i.user.id === interaction.user.id;
		};

		const row1 = new Discord.MessageActionRow()
			.addComponents([
				new Discord.MessageButton()
					.setCustomId('askForDeleteTicketUnactive')
					.setLabel('Supprimer')
					.setStyle('DANGER')
					.setDisabled(true),
			]);

		interaction.message.edit({ components: [row1] })

		const rowConfirmation = new Discord.MessageActionRow()
			.addComponents([
				new Discord.MessageButton()
					.setCustomId('ConfirmDelete')
					.setLabel('Confirmer')
					.setStyle('SUCCESS'),

				new Discord.MessageButton()
					.setCustomId('AnulDelete')
					.setLabel('Annuler')
					.setStyle('DANGER'),
			]);

		let message = await interaction.reply({ content: "Êtes vous sûr de vouloir supprimer ce ticket ?", components: [rowConfirmation], fetchReply: true });

		message.awaitMessageComponent({ filter, componentType: 'BUTTON', time: 60000 }).then(inter => {
			if (inter.customId === "ConfirmDelete") {
				interaction.channel.delete();
				RecapMessage.delete().catch(err => { });
			}

			if (inter.customId === "AnulDelete") {
				const rowTicket = new Discord.MessageActionRow()
					.addComponents([
						new Discord.MessageButton()
							.setCustomId('askForDeleteTicket')
							.setLabel('Supprimer')
							.setStyle('DANGER'),
					]);

				interaction.message.edit({ components: [rowTicket] });
				interaction.deleteReply();
			};
		}).catch(err => {
			const rowTicket = new Discord.MessageActionRow()
				.addComponents([
					new Discord.MessageButton()
						.setCustomId('askForDeleteTicket')
						.setLabel('Supprimer')
						.setStyle('DANGER'),
				]);

			interaction.message.edit({ components: [rowTicket] });
			interaction.deleteReply();
			return;
		});
	};

	if (interaction.customId.startsWith("takeCommand")) {

		let TicketChannel = interaction.guild.channels.cache.get(interaction.customId.split('-')[1]);

		console.log(TicketChannel)

		const RecapMessage = await TicketChannel.messages.fetch(interaction.customId.split('-')[2]);

		if (RecapMessage.embeds[0]) {
			if (RecapMessage.embeds[0].title.startsWith("Commande de ")) {
				if (interaction.member.roles.cache.some(r => r.id === "1055933701634142218")) { // ID Equipe de Vente
					interaction.message.delete();

					let userID = RecapMessage.embeds[0].footer.text.split('| ').pop();

					const Take = new Discord.MessageEmbed()
						.setColor(ee.color)
						.setTitle(`Notification de commande`)
						.setDescription(`<@${userID}>, votre commande a été prise par le vendeur <@${interaction.user.id}>. Il vous informera lorsqu'elle sera prête.`)
						.setFooter(`${interaction.user.tag} | ${interaction.user.id}`)
						.setTimestamp()

					const action = new Discord.MessageActionRow()
						.addComponents([
							new Discord.MessageButton()
								.setLabel("Commande livrée")
								.setStyle("SUCCESS")
								.setCustomId(`deliverCommand-${TicketChannel.id}-${RecapMessage.id}`)
						])

					TicketChannel.send({
						content: `<@${userID}>`,
						embeds: [Take],
						components: [action]
					});

					const TakeLog = new Discord.MessageEmbed()
						.setAuthor(interaction.guild.name)
						.setTitle('Commande prise')
						.setDescription(`» **Vendeur :** \`${interaction.user.username}\`\n» **Client :** <@${userID}>\n» **ID du ticket :** \`${interaction.channel.id}\``)
						.setTimestamp()
						.setFooter(ee.footertext, ee.footericon)

					client.channels.cache.get("1055934017167433859").send({ embeds: [TakeLog] }) // Channel Log

					//TicketChannel.setName(`vendeur-${interaction.user.username}`);

					const row = new Discord.MessageActionRow()
						.addComponents([
							new Discord.MessageButton()
								.setLabel('Y aller')
								.setStyle('LINK')
								.setURL(`https://discord.com/channels/${interaction.guild.id}/${TicketChannel.id}`)
						]);

					TicketChannel.permissionOverwrites.edit(interaction.user.id, {
						'VIEW_CHANNEL': true,
					})

					interaction.reply({ content: "La commande vous a été attribuée !", ephemeral: true, components: [row] });
				} else {
					interaction.reply({ content: "Tu n'es pas vendeur, s'il s'agit d'une erreur, contacte un administrateur.", ephemeral: true })
				}

			};
		};
	};

	if (interaction.customId.startsWith("deliverCommand")) {
		let TicketChannel = interaction.guild.channels.cache.get(interaction.customId.split('-')[1]);

		const RecapMessage = await TicketChannel.messages.fetch(interaction.customId.split('-')[2]);

		if (RecapMessage.embeds) {
			if (RecapMessage.embeds[0].title.startsWith("Commande de ")) {
				let acheteurID = RecapMessage.embeds[0].footer.text.split('| ').pop();
				let details = RecapMessage.embeds[0].description.substr(0, RecapMessage.embeds[0].description.indexOf('\n**Prix total ($) :** ')).replaceAll("**", "");
				let price = parseInt(RecapMessage.embeds[0].description.split('**Prix total ($) :** ').pop().replace("$", ""), 10)
				const Embed = RecapMessage.embeds[0]

				const moment = require("moment");
				let db = JSON.parse(fs.readFileSync("./util/historiqueVentes.json", "utf8"));
				let momentTime = moment().format("DDMMYYYY")

				if (!db[momentTime]) db[momentTime] = [];
				//var lastOrder = require("../../util/historiqueVentes.json");
				//tempID = findId(lastOrder)

				db[momentTime].push({
					//id: tempID,
					vendeur: interaction.user.id,
					acheteur: acheteurID,
					commande: details,
					prix: price
				})

				fs.writeFile("./util/historiqueVentes.json", JSON.stringify(db), (x) => {
					if (x) console.error(x)
				});

				interaction.reply({ content: "Votre vente a été prise en compte. Ce channel va être supprimé.", ephemeral: true }).then(() => {
					setTimeout(() => {
						interaction.channel.delete();
					}, 5000);
				})
				await client.channels.cache.get("1055933939291783239").send({ embeds: [Embed]})

				const DeliverLog = new Discord.MessageEmbed()
					.setAuthor(interaction.guild.name)
					.setTitle('Commande livrée')
					.setDescription(`» **Vendeur :** \`${interaction.user.username}\`\n» **Client :** <@${acheteurID}>\n» **ID du ticket :** \`${interaction.channel.id}\``)
					.setTimestamp()
					.setFooter(ee.footertext, ee.footericon)

				client.channels.cache.get("1055934017167433859").send({ embeds: [DeliverLog] }) // Channel Log

				const acheteur = interaction.guild.members.fetch(acheteurID);
			}
			else interaction.channel.send({ content: "Une erreur est survenue, les informations nécessaires à la bonne gestion de la commande sont introuvables, contacte un Développeur.", ephemeral: true });
		}
		else interaction.channel.send({ content: "Une erreur est survenue, les informations nécessaires à la bonne gestion de la commande sont introuvables, contacte un Développeur.", ephemeral: true });
	}

	function findId(lastOrder) {
		id = lastOrder.order.length
		lastOrder.order.forEach(element => {
			if (element.id >= id) {
				id = element.id + 1
			}
		})
		return id
	}
};