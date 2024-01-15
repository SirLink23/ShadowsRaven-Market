const Discord = require("discord.js")
const fs = require("fs")

module.exports = {
	name: 'livrer',
	description: "Permet de fermer la commande (si livrée)",
	permission: "CHANGE_NICKNAME",
	run: async (client, message, args) => {
		if (message.channel.name.startsWith("commande-")) {
			const RecapMessage = await message.channel.messages.fetch(args[0]).catch(err => {});
	
			if (RecapMessage.embeds) {
				if (RecapMessage.embeds[0].title.startsWith("Commande de ")) {
					let acheteurID = RecapMessage.embeds[0].footer.text.split('| ').pop();
					let details = RecapMessage.embeds[0].description.substr(0, RecapMessage.embeds[0].description.indexOf('\n**Prix total ($) :** ')).replaceAll("**", ""); 
					let price = parseInt(RecapMessage.embeds[0].description.split('**Prix total ($) :** ').pop().replace("$", ""), 10)
	
					const moment = require("moment");
					let db = JSON.parse(fs.readFileSync("./util/historiqueVentes.json", "utf8"));
					let momentTime = moment().format("DDMMYYYY")
	
					if (!db[momentTime]) db[momentTime] = [];
	
					db[momentTime].push({
						vendeur: message.member.id,
						acheteur: acheteurID,
						commande: details,
						prix: price
					})
					
					fs.writeFile("./util/historiqueVentes.json", JSON.stringify(db), (x) => {
						if (x) console.error(x)
					});
	
					message.channel.send({ content: "Votre vente a été prise en compte. Ce channel va être supprimé.", ephemeral: true }).then(() => {
						setTimeout(() => {
							message.channel.delete();
						}, 5000);

						const acheteur = message.guild.members.fetch(acheteurID)
						console.log(acheteur)
						acheteur.send("Test")
					});
				}
				else message.channel.send({ content: "Une erreur est survenue, l'identifiant du message est sûrement incorrect.", ephemeral: true });
			}
			else message.channel.send({ content: "Une erreur est survenue, l'identifiant du message est sûrement incorrect.", ephemeral: true });
		}
		else message.channel.send({ content: "Ce channel n'est pas un ticket ou n'a pas été pris par un vendeur, impossible de marquer la commande comme effectuée.", ephemeral: true });
	}
}