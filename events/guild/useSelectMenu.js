const Discord = require("discord.js");
const catalogue = require("../../util/catalogue.json");
const axios = require("axios");
const ee = require("../../embed.json");

module.exports = async (client, interaction) => {

	//await interaction.deferUpdate()

	const channelRecap = interaction.guild.channels.cache.get("1055933934774530118"); // Channel Commandes
	const vendeur = interaction.guild.roles.cache.get("1055933701634142218") // Grade Vendeur
	const channelSuivi = interaction.guild.channels.cache.get("1055933940633960598") // Channel Suivi
	const channelLogs = interaction.guild.channels.cache.get("1055934017167433859") // Channel Logs

	const filterAwaitMessages = msg => msg.author.id === interaction.user.id;
	const optionsAwaitMessages = { filterAwaitMessages, max: 1, time: 60000, errors: ['time'] }

	if (interaction.values[0].endsWith("-catalogue")) {
		const itemName = interaction.values[0].replace("-catalogue", "");
		let data;

		for (const category in catalogue) {
			const search = catalogue[category].items.find(item => item.name === itemName);
			if (search != undefined) data = search;
		};

		if (data.dispo === false) {
			interaction.reply({
				content: "Votre choix n'est pas disponible actuellement, merci de patienter une mise à jour ou de faire un autre choix.",
				ephemeral: true
			})
		} else {
			const log = new Discord.MessageEmbed()
				.setAuthor(interaction.guild.name)
				.setTitle('Processus de commande initialisé')
				.setDescription(`» **Pseudo :** \`${interaction.user.username}\`\n» **ID:** \`${interaction.user.id}\``)
				.setTimestamp()
				.setFooter(ee.footertext, ee.footericon)

			channelLogs.send({ embeds: [log] })

			interaction.guild.channels.create(`commande-${interaction.user.username}`, {
				type: "text",
				parent: interaction.guild.channels.cache.get("1055933826171408455").id, // Categorie Commandes
				permissionOverwrites: [
					{
						id: interaction.guild.id, // everyone
						deny: ['VIEW_CHANNEL']
					},
					{
						id: interaction.user.id, // acheteur
						allow: ['VIEW_CHANNEL']
					},
					{
						id: "1055933687885201498", // Responsable
						allow: ['VIEW_CHANNEL']
					},
					{
						id: "1055933693476225034", // Equipe Discord
						allow: ['VIEW_CHANNEL']
					}
				]
			}).then(async channel => {

				const row = new Discord.MessageActionRow()
					.addComponents([
						new Discord.MessageButton()
							.setLabel('Y aller')
							.setStyle('LINK')
							.setURL(`https://discord.com/channels/${interaction.guild.id}/${channel.id}`)
					]);

				await interaction.reply({ content: 'Votre ticket de commande a été créé !', ephemeral: true, components: [row] });

				let embedAchat = new Discord.MessageEmbed()
					.setColor(ee.color)
					.setTitle(`Commande de ${interaction.user.username}`)
					.setDescription(`**Item :** ${data.name} (${data.price}$ ${data.comptage})`)
					.setThumbnail("https://media.discordapp.net/attachments/785945849824935977/785969079142842428/srmarket.gif")
					.setFooter(`${interaction.user.tag} | ${interaction.user.id}`)

				let messageCommande = await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embedAchat] });

				pseudo(data);

				async function pseudo(item) {

					let embedChoixPseudo = new Discord.MessageEmbed()
						.setColor(ee.color)
						.setTitle('Pseudo')
						.setDescription(`Veuillez donner votre pseudo in-game.`);

					channel.send({ embeds: [embedChoixPseudo] }).then(message => {

						channel.awaitMessages(optionsAwaitMessages).then(async collected => {
							axios.get("https://api.mojang.com/users/profiles/minecraft/" + collected.first().content).then(response => {
								collected.first().delete();
								message.delete()

								if (response.data.id) {
									let embedAchat = new Discord.MessageEmbed()
										.setColor(ee.color)
										.setTitle(`Commande de ${interaction.user.username} (${response.data.name} in-game)`)
										.setDescription(`**Item :** ${data.name} (${data.price}$ ${data.comptage})`)
										.setThumbnail("https://media.discordapp.net/attachments/785945849824935977/785969079142842428/srmarket.gif")
										.setFooter(`${interaction.user.tag} | ${interaction.user.id}`)

									messageCommande.edit({ content: "‎", embeds: [embedAchat] });

									enchant(item, response.data.name);
								}
							})
						}).catch(err => {
							const embed_temps = new Discord.MessageEmbed()
								.setColor(ee.wrongcolor)
								.setDescription(
									`
Les 60 secondes sont écoulés.
Fermeture du ticket.
					  `
								)
							channel.send({ embeds: [embed_temps] });
							setTimeout(() => {
								channel.delete();
							}, 5000);
							return;
						});

					});
				};

				async function enchant(item, pseudo) {
					if (item.enchant.length > 0) {
						let embedChoixEnchant = new Discord.MessageEmbed()
							.setColor(ee.color)
							.setTitle('Choix des enchantements')
							.setDescription(`Veuillez choisir votre enchantements. Si vous n'en désirez pas, choisissez "aucun".`);

						const enchantList = [{
							label: "aucun",
							value: "aucunEnchantement"
						}];

						for (const enchant of item.enchant) {
							enchantList.push({
								label: enchant.name,
								emoji: "<:enchanted_book:824007016199880747>", //mettre id emoji livre magique
								description: "+" + enchant.price + " $",
								value: enchant.name + "-enchantement"
							});
						};

						const row = new Discord.MessageActionRow()
							.addComponents(
								new Discord.MessageSelectMenu()
									.setCustomId('selectEnchant')
									.setPlaceholder('Sélectionnez l\'enchantement')
									.setMinValues(1)
									.setMaxValues(1)
									.addOptions(enchantList)
							);

						channel.send({ embeds: [embedChoixEnchant], components: [row] }).then(async message => {

							const filter = i => {
								i.deferUpdate();
								return i.user.id === interaction.user.id;
							};

							message.awaitMessageComponent({ filter, componentType: 'SELECT_MENU', time: 60000 }).then(interaction => {
								if (interaction.values.includes('aucunEnchantement')) {
									message.delete();
									quantite(item, pseudo, { price: 0 });
								}
								else {
									let enchantsRecap = {};

									for (const enchant of interaction.values) {
										let enchantement;

										for (const e of item.enchant) {
											if (e.name == enchant.replace("-enchantement", "")) enchantement = e;
										};

										if (!enchantsRecap.names) enchantsRecap.names = enchantement.name
										else enchantsRecap.names = enchantsRecap.names + ", " + enchantement.name;

										if (!enchantsRecap.price) enchantsRecap.price = enchantement.price
										else enchantsRecap.price = enchantsRecap.price + enchantement.price;
									};

									let embedAchat = new Discord.MessageEmbed()
										.setColor(ee.color)
										.setTitle(`🛒 Commande de ${interaction.user.username} (${pseudo} in-game)`)
										.setDescription(`${messageCommande.embeds[0].description}\n**Enchantement(s) :** ${enchantsRecap.names} (+${enchantsRecap.price}$${item.comptage})`)
										.setThumbnail("https://media.discordapp.net/attachments/785945849824935977/785969079142842428/srmarket.gif")
										.setFooter(`${interaction.user.tag} | ${interaction.user.id}`)

									messageCommande.edit({ embeds: [embedAchat] });
									message.delete().then(() => quantite(item, pseudo, enchantsRecap))

								};
							}).catch(err => {
								const embed_temps = new Discord.MessageEmbed()
									.setColor(ee.wrongcolor)
									.setDescription(
										`
Les 60 secondes sont écoulés.
Fermeture du ticket.
						  `
									)
								channel.send({ embeds: [embed_temps] });

								setTimeout(() => {
									channel.delete();
								}, 5000);
								return;
							});

						});
					}
					else quantite(item, pseudo, { price: 0 });
				};

				async function quantite(item, pseudo, enchantsRecap) {
					let embedChoixQuantite = new Discord.MessageEmbed()
						.setColor(ee.color)
						.setTitle('Choix de la quantité')
						.setDescription(`Veuillez spécifier la quantité souhaitée.`);

					channel.send({ embeds: [embedChoixQuantite] }).then(message => {

						channel.awaitMessages(optionsAwaitMessages).then(async collected => {

							const prix = `${collected.first().content}`

							if (isNaN(collected.first().content)) {
								message.delete();
								collected.first().delete();
								channel.send("Votre réponse doit être un nombre !").then(msg => {
									setTimeout(() => {
										msg.delete();
									}, 5000);
								});
								quantite(item, pseudo, enchantsRecap);
							}
							else {
								if (collected.first().content >= item.limite) {
									message.delete();
									collected.first().delete();
									channel.send("Votre commande ne respecte pas les limites mises en place !").then(msg => {
										setTimeout(() => {
											msg.delete();
										}, 10000);
									});
									quantite(item, pseudo, enchantsRecap);
								} else {
									let embedAchat = new Discord.MessageEmbed()
										.setColor(ee.color)
										.setTitle(`Commande de ${interaction.user.username} (${pseudo} in-game)`)
										.setThumbnail("https://media.discordapp.net/attachments/785945849824935977/785969079142842428/srmarket.gif")
										.setFooter(`${interaction.user.tag} | ${interaction.user.id}`)

									if (enchantsRecap.names) embedAchat.setDescription(`${messageCommande.embeds[0].description}\n**Enchantement(s) :** ${enchantsRecap.names} (+${enchantsRecap.price}$${item.comptage})\n**Quantité :** ${collected.first()}`)

									else embedAchat.setDescription(`${messageCommande.embeds[0].description}\n**Quantité :** ${collected.first()}`)

									messageCommande.edit({ embeds: [embedAchat] });

									collected.first().delete()
									message.delete();



									fin(item, pseudo, enchantsRecap, parseInt(collected.first().content, 10), embedAchat);
								}
							};
						}).catch(err => {
							const embed_temps = new Discord.MessageEmbed()
								.setColor(ee.wrongcolor)
								.setDescription(
									`
Les 60 secondes sont écoulés.
Fermeture du ticket.
					  `
								)
							channel.send({ embeds: [embed_temps] });
							setTimeout(() => {
								channel.delete();
							}, 5000);
							return;
						});
					});

				};

				async function fin(item, pseudo, enchantsRecap, quantite, embedAchat) {

					if (interaction.member.roles.cache.some(r => r.id === "1055933769858678866") || interaction.member.roles.cache.some(r => r.id === "1055933768789151905") || interaction.member.roles.cache.some(r => r.id === "1055933735620587663")) {
						let embedAchat = new Discord.MessageEmbed()
							.setColor(ee.color)
							.setTitle(`Commande de ${interaction.user.username} (${pseudo} in-game)`)
							.setThumbnail("https://media.discordapp.net/attachments/785945849824935977/785969079142842428/srmarket.gif")
							.setFooter(`${interaction.user.tag} | ${interaction.user.id}`)

						let embedVendeur = new Discord.MessageEmbed()
							.setColor(ee.color)
							.setTitle(`Commande de ${interaction.user.username} (${pseudo} in-game)`)
							.setFooter(`${interaction.user.tag} | ${interaction.user.id}`)

						if (enchantsRecap.names) {
							embedVendeur.setDescription(`${messageCommande.embeds[0].description}\n**Enchantement(s) :** ${enchantsRecap.names} (+${enchantsRecap.price}$${item.comptage})\n**Quantité :** ${quantite}\n**Prix total ($) :** ${(item.price + enchantsRecap.price) * quantite * 0.95}$ (Réduction de 5% : Prix initial : ${(item.price + enchantsRecap.price) * quantite})`)
							embedAchat.setDescription(`${messageCommande.embeds[0].description}\n**Enchantement(s) :** ${enchantsRecap.names} (+${enchantsRecap.price}$${item.comptage})\n**Quantité :** ${quantite}\n**Prix total ($) :** ${(item.price + enchantsRecap.price) * quantite * 0.95}$ (Réduction de 5% : Prix initial : ${(item.price + enchantsRecap.price) * quantite})`)
						}
						else {
							embedVendeur.setDescription(`${messageCommande.embeds[0].description}\n**Quantité :** ${quantite}\n**Prix total ($) :** ${(item.price) * quantite * 0.95}$ (Réduction de 5% : Prix initial : ${(item.price) * quantite})`)
							embedAchat.setDescription(`${messageCommande.embeds[0].description}\n**Quantité :** ${quantite}\n**Prix total ($) :** ${(item.price) * quantite * 0.95}$ (Réduction de 5% : Prix initial : ${(item.price) * quantite})`)
						};

						const rowVendeurTemporary = new Discord.MessageActionRow()
							.addComponents([
								new Discord.MessageButton()
									.setURL(`https://discord.com/channels/${interaction.guild.id}/${channel.id}`)
									.setLabel('Voir le ticket')
									.setStyle('LINK'),

								new Discord.MessageButton()
									.setCustomId(`takeCommand-${channel.id}`)
									.setLabel('Prendre la commande')
									.setStyle('SUCCESS'),
							]);

						channelRecap.send({ content: `<@&${vendeur.id}>`, embeds: [embedVendeur], components: [rowVendeurTemporary] }).then(async msg => {
							const rowTicket = new Discord.MessageActionRow()
								.addComponents([
									new Discord.MessageButton()
										.setCustomId(`askForDeleteTicket-${msg.id}`)
										.setLabel('Annuler la commande')
										.setStyle('DANGER'),
									new Discord.MessageButton()
										.setCustomId(`askForCloseTicket-${msg.id}`)
										.setLabel('Livrer la commande')
										.setStyle("PRIMARY"),
								]);

							let msg2 = await messageCommande.edit({ embeds: [embedAchat], components: [rowTicket] });

							const rowVendeur = new Discord.MessageActionRow()
								.addComponents([
									new Discord.MessageButton()
										.setURL(`https://discord.com/channels/${interaction.guild.id}/${channel.id}`)
										.setLabel('Voir le ticket')
										.setStyle('LINK'),

									new Discord.MessageButton()
										.setCustomId(`takeCommand-${channel.id}-${msg2.id}`)
										.setLabel('Prendre la commande')
										.setStyle('SUCCESS'),
								]);

							msg.edit({ components: [rowVendeur] });

							const suivi = new Discord.MessageEmbed()
								.setColor(ee.color)
								.setTitle(`Suivi - Commande de ${interaction.user.username} (${pseudo})`)
								.setFooter(`${interaction.user.tag} | ${interaction.user.id}`)
								.setTimestamp()

							if (enchantsRecap.names) {
								suivi.setDescription(`${messageCommande.embeds[0].description}\n**Enchantement(s) :** ${enchantsRecap.names} (+${enchantsRecap.price}$${item.comptage})\n**Quantité :** ${quantite}\n**Prix total :** ${(item.price + enchantsRecap.price) * quantite}$ (Réduction de 5% : Prix initial : ${(item.price + enchantsRecap.price) * quantite}`)
							}
							else {
								suivi.setDescription(`${messageCommande.embeds[0].description}\n**Quantité :** ${quantite}\n**Prix total :** ${(item.price) * quantite}$ (Réduction de 5% : Prix initial : ${(item.price) * quantite})`)
							};

							channelSuivi.send({ embeds: [suivi] })

							const log = new Discord.MessageEmbed()
								.setAuthor(interaction.guild.name)
								.setTitle('Commande send')
								.setDescription(`» **Pseudo :** \`${interaction.user.username}\`\n» **ID:** \`${interaction.user.id}\``)
								.setTimestamp()
								.setFooter(ee.footertext, ee.footericon)

							channelLogs.send({ embeds: [log] })
						})
					} else if (interaction.member.roles.cache.some(r => r.id === "1055933766612308068") || interaction.member.roles.cache.some(r => r.id === "1055933737877123082")) {
						let embedAchat = new Discord.MessageEmbed()
							.setColor(ee.color)
							.setTitle(`Commande de ${interaction.user.username} (${pseudo} in-game)`)
							.setThumbnail("https://media.discordapp.net/attachments/785945849824935977/785969079142842428/srmarket.gif")
							.setFooter(`${interaction.user.tag} | ${interaction.user.id}`)

						let embedVendeur = new Discord.MessageEmbed()
							.setColor(ee.color)
							.setTitle(`Commande de ${interaction.user.username} (${pseudo} in-game)`)
							.setFooter(`${interaction.user.tag} | ${interaction.user.id}`)

						if (enchantsRecap.names) {
							embedVendeur.setDescription(`${messageCommande.embeds[0].description}\n**Enchantement(s) :** ${enchantsRecap.names} (+${enchantsRecap.price}$${item.comptage})\n**Quantité :** ${quantite}\n**Prix total :** ${(item.price + enchantsRecap.price) * quantite * 0.9}$ (Réduction de 10% : Prix initial : ${(item.price + enchantsRecap.price) * quantite})`)
							embedAchat.setDescription(`${messageCommande.embeds[0].description}\n**Enchantement(s) :** ${enchantsRecap.names} (+${enchantsRecap.price}$${item.comptage})\n**Quantité :** ${quantite}\n**Prix total :** ${(item.price + enchantsRecap.price) * quantite * 0.9}$ (Réduction de 10% : Prix initial : ${(item.price + enchantsRecap.price) * quantite})`)
						}
						else {
							embedVendeur.setDescription(`${messageCommande.embeds[0].description}\n**Quantité :** ${quantite}\n**Prix total :** ${(item.price) * quantite * 0.9}$ (Réduction de 10% : Prix initial : ${(item.price) * quantite})`)
							embedAchat.setDescription(`${messageCommande.embeds[0].description}\n**Quantité :** ${quantite}\n**Prix total :** ${(item.price) * quantite * 0.9}$ (Réduction de 10% : Prix initial : ${(item.price) * quantite})`)
						};

						const rowVendeurTemporary = new Discord.MessageActionRow()
							.addComponents([
								new Discord.MessageButton()
									.setURL(`https://discord.com/channels/${interaction.guild.id}/${channel.id}`)
									.setLabel('Voir le ticket')
									.setStyle('LINK'),

								new Discord.MessageButton()
									.setCustomId(`takeCommand-${channel.id}`)
									.setLabel('Prendre la commande')
									.setStyle('SUCCESS'),
							]);

						channelRecap.send({ content: `<@&${vendeur.id}>`, embeds: [embedVendeur], components: [rowVendeurTemporary] }).then(async msg => {
							const rowTicket = new Discord.MessageActionRow()
								.addComponents([
									new Discord.MessageButton()
										.setCustomId(`askForDeleteTicket-${msg.id}`)
										.setLabel('Annuler la commande')
										.setStyle('DANGER'),
								]);

							let msg2 = await messageCommande.edit({ embeds: [embedAchat], components: [rowTicket] });

							const rowVendeur = new Discord.MessageActionRow()
								.addComponents([
									new Discord.MessageButton()
										.setURL(`https://discord.com/channels/${interaction.guild.id}/${channel.id}`)
										.setLabel('Voir le ticket')
										.setStyle('LINK'),

									new Discord.MessageButton()
										.setCustomId(`takeCommand-${channel.id}-${msg2.id}`)
										.setLabel('Prendre la commande')
										.setStyle('SUCCESS'),
								]);

							msg.edit({ components: [rowVendeur] });

							const suivi = new Discord.MessageEmbed()
								.setColor(ee.color)
								.setTitle(`Suivi - Commande de ${interaction.user.username} (${pseudo})`)
								.setFooter(`${interaction.user.tag} | ${interaction.user.id}`)
								.setTimestamp()

							if (enchantsRecap.names) {
								suivi.setDescription(`${messageCommande.embeds[0].description}\n**Enchantement(s) :** ${enchantsRecap.names} (+${enchantsRecap.price}$${item.comptage})\n**Quantité :** ${quantite}\n**Prix total :** ${(item.price + enchantsRecap.price) * quantite}$ (Réduction de 10% : Prix initial : ${(item.price + enchantsRecap.price) * quantite})`)
							}
							else {
								suivi.setDescription(`${messageCommande.embeds[0].description}\n**Quantité :** ${quantite}\n**Prix total :** ${(item.price) * quantite}$ (Réduction de 10% : Prix initial : ${(item.price) * quantite})`)
							};

							channelSuivi.send({ embeds: [suivi] })

							const log = new Discord.MessageEmbed()
								.setAuthor(interaction.guild.name)
								.setTitle('Commande send')
								.setDescription(`» **Pseudo :** \`${interaction.user.username}\`\n» **ID:** \`${interaction.user.id}\``)
								.setTimestamp()
								.setFooter(ee.footertext, ee.footericon)

							channelLogs.send({ embeds: [log] })
						})
					} else if (interaction.member.roles.cache.some(r => r.id === "1055933767820263524") || interaction.member.roles.cache.some(r => r.id === "1055933687885201498") || interaction.member.roles.cache.some(r => r.id === "1055933685842587738")) {
						let embedAchat = new Discord.MessageEmbed()
							.setColor(ee.color)
							.setTitle(`Commande de ${interaction.user.username} (${pseudo} in-game)`)
							.setThumbnail("https://media.discordapp.net/attachments/785945849824935977/785969079142842428/srmarket.gif")
							.setFooter(`${interaction.user.tag} | ${interaction.user.id}`)

						let embedVendeur = new Discord.MessageEmbed()
							.setColor(ee.color)
							.setTitle(`Commande de ${interaction.user.username} (${pseudo} in-game)`)
							.setFooter(`${interaction.user.tag} | ${interaction.user.id}`)

						if (enchantsRecap.names) {
							embedVendeur.setDescription(`${messageCommande.embeds[0].description}\n**Enchantement(s) :** ${enchantsRecap.names} (+${enchantsRecap.price}$${item.comptage})\n**Quantité :** ${quantite}\n**Prix total ($) :** ${(item.price + enchantsRecap.price) * quantite * 0.85}$ (Réduction de 15% : Prix initial : ${(item.price + enchantsRecap.price) * quantite})`)
							embedAchat.setDescription(`${messageCommande.embeds[0].description}\n**Enchantement(s) :** ${enchantsRecap.names} (+${enchantsRecap.price}$${item.comptage})\n**Quantité :** ${quantite}\n**Prix total ($) :** ${(item.price + enchantsRecap.price) * quantite * 0.85}$ (Réduction de 15% : Prix initial : ${(item.price + enchantsRecap.price) * quantite})`)
						}
						else {
							embedVendeur.setDescription(`${messageCommande.embeds[0].description}\n**Quantité :** ${quantite}\n**Prix total ($) :** ${(item.price) * quantite * 0.85}$ (Réduction de 15% : Prix initial : ${(item.price) * quantite})`)
							embedAchat.setDescription(`${messageCommande.embeds[0].description}\n**Quantité :** ${quantite}\n**Prix total ($) :** ${(item.price) * quantite * 0.85}$ (Réduction de 15% : Prix initial : ${(item.price) * quantite})`)
						};

						const rowVendeurTemporary = new Discord.MessageActionRow()
							.addComponents([
								new Discord.MessageButton()
									.setURL(`https://discord.com/channels/${interaction.guild.id}/${channel.id}`)
									.setLabel('Voir le ticket')
									.setStyle('LINK'),

								new Discord.MessageButton()
									.setCustomId(`takeCommand-${channel.id}`)
									.setLabel('Prendre la commande')
									.setStyle('SUCCESS'),
							]);

						channelRecap.send({ content: `<@&${vendeur.id}>`, embeds: [embedVendeur], components: [rowVendeurTemporary] }).then(async msg => {
							const rowTicket = new Discord.MessageActionRow()
								.addComponents([
									new Discord.MessageButton()
										.setCustomId(`askForDeleteTicket-${msg.id}`)
										.setLabel('Annuler la commande')
										.setStyle('DANGER'),
								]);

							let msg2 = await messageCommande.edit({ embeds: [embedAchat], components: [rowTicket] });

							const rowVendeur = new Discord.MessageActionRow()
								.addComponents([
									new Discord.MessageButton()
										.setURL(`https://discord.com/channels/${interaction.guild.id}/${channel.id}`)
										.setLabel('Voir le ticket')
										.setStyle('LINK'),

									new Discord.MessageButton()
										.setCustomId(`takeCommand-${channel.id}-${msg2.id}`)
										.setLabel('Prendre la commande')
										.setStyle('SUCCESS'),
								]);

							msg.edit({ components: [rowVendeur] });

							const suivi = new Discord.MessageEmbed()
								.setColor(ee.color)
								.setTitle(`Suivi - Commande de ${interaction.user.username} (${pseudo})`)
								.setFooter(`${interaction.user.tag} | ${interaction.user.id}`)
								.setTimestamp()

							if (enchantsRecap.names) {
								suivi.setDescription(`${messageCommande.embeds[0].description}\n**Enchantement(s) :** ${enchantsRecap.names} (+${enchantsRecap.price}$ ${item.comptage})\n**Quantité :** ${quantite}\n**Prix total ($) :** ${(item.price + enchantsRecap.price) * quantite}$ (Réduction de 15% : Prix initial : ${(item.price + enchantsRecap.price) * quantite})`)
								suivi.setDescription(`${messageCommande.embeds[0].description}\n**Enchantement(s) :** ${enchantsRecap.names} (+${enchantsRecap.price}$ ${item.comptage})\n**Quantité :** ${quantite}\n**Prix total ($) :** ${(item.price + enchantsRecap.price) * quantite}$ (Réduction de 15% : Prix initial : ${(item.price + enchantsRecap.price) * quantite})`)
							}
							else {
								suivi.setDescription(`${messageCommande.embeds[0].description}\n**Quantité :** ${quantite}\n**Prix total ($) :** ${(item.price) * quantite}$ (Réduction de 15% : Prix initial : ${(item.price) * quantite})`)
								suivi.setDescription(`${messageCommande.embeds[0].description}\n**Quantité :** ${quantite}\n**Prix total ($) :** ${(item.price) * quantite}$ (Réduction de 15% : Prix initial : ${(item.price) * quantite})`)
							};

							channelSuivi.send({ embeds: [suivi] })

							const log = new Discord.MessageEmbed()
								.setAuthor(interaction.guild.name)
								.setTitle('Commande send')
								.setDescription(`» **Pseudo :** \`${interaction.user.username}\`\n» **ID:** \`${interaction.user.id}\``)
								.setTimestamp()
								.setFooter(ee.footertext, ee.footericon)

							channelLogs.send({ embeds: [log] })
						})
					} else {
						let embedAchat = new Discord.MessageEmbed()
							.setColor(ee.color)
							.setTitle(`Commande de ${interaction.user.username} (${pseudo} in-game)`)
							.setThumbnail("https://media.discordapp.net/attachments/785945849824935977/785969079142842428/srmarket.gif")
							.setFooter(`${interaction.user.tag} | ${interaction.user.id}`)

						let embedVendeur = new Discord.MessageEmbed()
							.setColor(ee.color)
							.setTitle(`Commande de ${interaction.user.username} (${pseudo} in-game)`)
							.setFooter(`${interaction.user.tag} | ${interaction.user.id}`)

						if (enchantsRecap.names) {
							embedVendeur.setDescription(`${messageCommande.embeds[0].description}\n**Enchantement(s) :** ${enchantsRecap.names} (+${enchantsRecap.price}$${item.comptage})\n**Quantité :** ${quantite}\n**Prix total ($) :** ${(item.price + enchantsRecap.price) * quantite}$`)
							embedAchat.setDescription(`${messageCommande.embeds[0].description}\n**Enchantement(s) :** ${enchantsRecap.names} (+${enchantsRecap.price}$${item.comptage})\n**Quantité :** ${quantite}\n**Prix total ($) :** ${(item.price + enchantsRecap.price) * quantite}$`)
						}
						else {
							embedVendeur.setDescription(`${messageCommande.embeds[0].description}\n**Quantité :** ${quantite}\n**Prix total ($) :** ${(item.price) * quantite}$`)
							embedAchat.setDescription(`${messageCommande.embeds[0].description}\n**Quantité :** ${quantite}\n**Prix total ($) :** ${(item.price) * quantite}$`)
						};

						const rowVendeurTemporary = new Discord.MessageActionRow()
							.addComponents([
								new Discord.MessageButton()
									.setURL(`https://discord.com/channels/${interaction.guild.id}/${channel.id}`)
									.setLabel('Voir le ticket')
									.setStyle('LINK'),

								new Discord.MessageButton()
									.setCustomId(`takeCommand-${channel.id}`)
									.setLabel('Prendre la commande')
									.setStyle('SUCCESS'),
							]);

						channelRecap.send({ content: `<@&${vendeur.id}>`, embeds: [embedVendeur], components: [rowVendeurTemporary] }).then(async msg => {
							const rowTicket = new Discord.MessageActionRow()
								.addComponents([
									new Discord.MessageButton()
										.setCustomId(`askForDeleteTicket-${msg.id}`)
										.setLabel('Annuler la commande')
										.setStyle('DANGER'),
								]);

							let msg2 = await messageCommande.edit({ embeds: [embedAchat], components: [rowTicket] });

							const rowVendeur = new Discord.MessageActionRow()
								.addComponents([
									new Discord.MessageButton()
										.setURL(`https://discord.com/channels/${interaction.guild.id}/${channel.id}`)
										.setLabel('Voir le ticket')
										.setStyle('LINK'),

									new Discord.MessageButton()
										.setCustomId(`takeCommand-${channel.id}-${msg2.id}`)
										.setLabel('Prendre la commande')
										.setStyle('SUCCESS'),
								]);

							msg.edit({ components: [rowVendeur] });

							const suivi = new Discord.MessageEmbed()
								.setColor(ee.color)
								.setTitle(`Suivi - Commande de ${interaction.user.username} (${pseudo})`)
								.setFooter(`${interaction.user.tag} | ${interaction.user.id}`)
								.setTimestamp()

							if (enchantsRecap.names) {
								suivi.setDescription(`${messageCommande.embeds[0].description}\n**Enchantement(s) :** ${enchantsRecap.names} (+${enchantsRecap.price}$ ${item.comptage})\n**Quantité :** ${quantite}\n**Prix total :** ${(item.price + enchantsRecap.price) * quantite}$`)
							}
							else {
								suivi.setDescription(`${messageCommande.embeds[0].description}\n**Quantité :** ${quantite}\n**Prix total :** ${(item.price) * quantite}$`)
							};

							channelSuivi.send({ embeds: [suivi] })

							const log = new Discord.MessageEmbed()
								.setAuthor(interaction.guild.name)
								.setTitle('Commande send')
								.setDescription(`» **Pseudo :** \`${interaction.user.username}\`\n» **ID:** \`${interaction.user.id}\``)
								.setTimestamp()
								.setFooter(ee.footertext, ee.footericon)

							channelLogs.send({ embeds: [log] })
						})
					}
				};
			});
		}
	}

	if (interaction.values[0].endsWith("-info")) {
		const itemName = interaction.values[0].replace("-info", "");
		let data;

		for (const category in catalogue) {
			const search = catalogue[category].items.find(item => item.name === itemName);
			if (search != undefined) data = search;
		};

		const embedInfo = new Discord.MessageEmbed()
			.setColor(ee.color)
			.setTitle("Information sur le catalogue")
			.setDescription(`**Item :** ${data.emoji} ${data.name}\n**Prix :** ${data.price} $${data.comptage}`)
			.setThumbnail("https://cdn.discordapp.com/attachments/903758313878061066/904351543065718865/SR_Logo_3_3.png")
			.setFooter(ee.footertext, ee.footericon);
		interaction.reply({
			embeds: [embedInfo]
		})
	}
};