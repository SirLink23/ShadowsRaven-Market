const fs = require('fs');
const { Client, Collection, Intents } = require('discord.js');

const client = new Client({
	restRequestTimeout: 60000,
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_INVITES,
		Intents.FLAGS.GUILD_BANS,
		Intents.FLAGS.GUILD_INVITES,
		Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
		Intents.FLAGS.GUILD_VOICE_STATES,
		Intents.FLAGS.GUILD_PRESENCES
	], partials: [
		"MESSAGE",
		"CHANNEL",
		"GUILD_MEMBER"
	], disableEveryone: false
});
client.config = require('./config');
client.commands = new Collection();

["handlers", "events"].forEach(handler => {
	require(`./Handlers/${handler}`)(client);
});

/*process.on('unhandledRejection', (err) => {
	console.error(`Unhandled Rejection: ${err}`);
});

process.on('uncaughtException', (err) => {
	console.error(`Uncaught Exception: ${err}`);
});*/

client.login(client.config.TOKEN)