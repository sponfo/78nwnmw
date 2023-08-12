const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  CommandInteraction,
  CommandInteractionOptionResolver,
  EmbedBuilder,
} = require("discord.js");
const Bot = require("../lib");
const user = require("../database/user");
const approval = require("../database/approval");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("test")
    .setDescription("Test command."),
  /**
   * @param { Bot } client
   * @param { CommandInteraction } interaction
   * @param { CommandInteractionOptionResolver } options
   */
  async run(client, interaction, options) {
    await interaction.deferReply({ ephemeral: false }).catch(() => {});

    // let stuff = await approval.create({
    //   user: interaction.user.id,
    //   plan: "basic",
    //   channel: interaction.channel.id,
    // });

    return await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(`Approval id: \`${stuff?._id?.toString()}\`.`)
          .setFooter({
            text: client.user.username,
            iconURL: client.user.avatarURL({ dynamic: true }),
          })
          .setColor([255, 0, 0])
          .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.avatarURL({ dynamic: true }),
          }),
      ],
    });
  },
  ownerOnly: true,
};
