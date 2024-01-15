const chalk = require("chalk");

module.exports = async client => {
    console.log(chalk.blue.bold(chalk.blue.bgBlue(" ") + ` Le bot est connecté  ${client.user.tag}`));
  
    setInterval(() => {

        let statuts = ["adopter un panda", "miner du Paladium", "cache cache avec des corbeaux"];
      
        let statut = statuts[Math.floor(Math.random() * statuts.length)];
  
        client.user.setPresence({
            activity: { 
                name: statut,
                type: 'LISTENING'
            },
            status: 'dnd'
        });
    }, 5000);
};