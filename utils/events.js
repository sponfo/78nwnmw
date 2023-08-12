const { readdirSync } = require("fs");
const path = require("path");
const Bot = require("../lib");

/**
 *
 * @param { Bot } client
 */
async function setupEvents(client) {
  const files = readdirSync(path.join(__dirname, "../", "events")).filter((f) =>
    f.endsWith(".js")
  );
  for (const file of files) {
    const event = require(path.join(__dirname, "../", "events", file));
    let eventName = file.split(".")[0];
    client.on(eventName, event.bind(null, client));
  }
}

module.exports = setupEvents;
