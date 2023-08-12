const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  CommandInteraction,
  CommandInteractionOptionResolver,
  EmbedBuilder,
} = require("discord.js");
const Bot = require("../lib");
const user = require("../database/user");
const approval = require("../database/approval");
const ms = require("ms");
const config = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("approve")
    .setDescription("approve command.")
    .addStringOption((option) =>
      option
        .setName("approval-id")
        .setDescription("Approval id")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("hosting-id")
        .setDescription("Hosting id")
        .setRequired(true)
    ),
  /**
   * @param { Bot } client
   * @param { CommandInteraction } interaction
   * @param { CommandInteractionOptionResolver } options
   */
  async run(client, interaction, options) {
    await interaction.deferReply({ ephemeral: false }).catch(() => {});

    let hosting = options.getString("hosting-id");
    let approve = options.getString("approval-id");

    let appData = await approval.findById(approve);
    if (!appData?.user)
      return await interaction.editReply({
        content: `Unable to find data integrated with this id.`,
      });

    let plan = appData?.plan;

    let userData = await user.findById(appData?.user);

    if (!userData) {
      await user.create({
        _id: appData?.user,
        plans: [
          {
            plan: appData?.plan,
            due: Date.now() + ms("28d"),
            registered: Date.now(),
            hosting_id: hosting,
          },
        ],
      });
    } else {
      userData.plans = [
        ...userData.plans,
        {
          plan: appData?.plan,
          due: Date.now() + ms("28d"),
          registered: Date.now(),
          hosting_id: hosting,
        },
      ];

      await userData.save();
    }

    let channel = await client.channels.fetch(appData.channel).catch(() => {});
    if (channel)
      await channel.send({
        content: `<@${appData?.user}>`,
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `Your request for **${appData?.plan}** plan has been approved.`
            )
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

    await approval.findByIdAndDelete(approve);

    return await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(`Approved successfully.`)
          .setFooter({
            text: client.user.username,
            iconURL: client.user.avatarURL({ dynamic: true }),
          })
          .addFields(
            { name: "Approval id", value: `**${approve}**` },
            { name: "Hosting id", value: `**${hosting}**` },
            { name: "Plan", value: `**${plan}** [${config.plans[plan]}$]` },
            {
              name: "Ends on",
              value: `<t:${Math.round((Date.now() + ms("28d")) / 1000)}:R>`,
            }
          )
          .setColor("Blurple")
          .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.avatarURL({ dynamic: true }),
          }),
      ],
    });
  },
  ownerOnly: true,
};
