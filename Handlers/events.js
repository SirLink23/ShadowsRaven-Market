const { readdirSync } = require("fs");
module.exports = (client) => {
  const load = dirs => {
    const events = readdirSync(`./Events/${dirs}/`).filter(d => d.endsWith("js") );
    for (let file of events) {
      let evt = require(`../Events/${dirs}/${file}`);
      let eName = file.split('.')[0];
      client.on(eName, evt.bind(null,client));
      console.log('[Events] Loaded ' + eName);
    }
  };
  ["client", "guild"].forEach((x) => load(x));
};