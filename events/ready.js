const Bot = require("../lib");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const config = require("../config");
const colors = require("colors");

/**
 *
 * @param { Bot } client
 */
module.exports = async (client) => {
  client.message(
    `BOT`,
    `Initiated client instance ${client?.user?.tag}. [${colors.green(200)}]`
  );

  const rest = new REST({ version: "9" }).setToken(config.token);

  (async () => {
    try {
      await rest.put(Routes.applicationCommands(client.user.id), {
        body: client.commands.map((c) => c.data.toJSON()),
      });

      client.user.setPresence({
        status: "idle",
        activities: [{ type: 0, name: "client.crazyhost.cloud" }],
      });

      client.message(
        `COMMANDS`,
        `Deployed slash commands. [${colors.green(200)}]`
      );
    } catch (error) {
      client.error("ready.js", error?.message || "Undetermined");
    }
  })();
};
