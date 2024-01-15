const { readdirSync } = require('fs');
module.exports = async(client) => {
    readdirSync("./commands/").map(async dir => {
        const commands = readdirSync(`./Commands/${dir}/`).map(async cmd=> {
            let pull = require(`../Commands/${dir}/${cmd}`)
		    console.log('[Commands] Loaded ' + pull.name)
            client.commands.set(pull.name, pull)
            if (pull.aliases) {
                pull.aliases.map(p => client.aliases.set(p, pull))
            }
        })
    })
}