const { readdirSync } = require("fs");
const path = require("path");
const Bot = require("../lib");

/**
 *
 * @param { Bot } client
 */
async function setupCommands(client) {
  let files = readdirSync(path.join(__dirname, "../", "commands")).filter(
    (file) => file.endsWith(".js")
  );

  if (!files || !files.length)
    return console.log(
      client.error(`[ERROR]: ${client.info("No")} commands found!`)
    );

  for (const file of files) {
    let command = require(path.join(__dirname, "../", "commands", file));
    client.commands.set(command.data.name, command);
  }
}

module.exports = setupCommands;