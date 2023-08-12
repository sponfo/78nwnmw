const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  CommandInteraction,
  CommandInteractionOptionResolver,
  EmbedBuilder,
} = require("discord.js");
const Bot = require("../lib");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("ping command."),
  /**
   * @param { Bot } client
   * @param { CommandInteraction } interaction
   * @param { CommandInteractionOptionResolver } options
   */
  async run(client, interaction, options) {
    await interaction.deferReply({ ephemeral: false }).catch(() => {});

    return await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(`Ping: ${client.ws.ping} ms.`)
          .setFooter({
            text: client.user.username,
            iconURL: client.user.avatarURL({ dynamic: true }),
          })
          .setColor("Blurple")
          .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.avatarURL({ dynamic: true }),
          }),
      ],
    });
  },
  ownerOnly: false,
};
