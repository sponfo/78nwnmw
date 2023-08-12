const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  CommandInteraction,
  CommandInteractionOptionResolver,
  EmbedBuilder,
} = require("discord.js");
const Bot = require("../lib");
const user = require("../database/user");
const config = require("../config");
const {
  pagination,
  ButtonTypes,
  ButtonStyles,
} = require("@devraelfreeze/discordjs-pagination");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("profile command.")
    .addUserOption((option) => option.setName("user").setDescription("User")),
  /**
   * @param { Bot } client
   * @param { CommandInteraction } interaction
   * @param { CommandInteractionOptionResolver } options
   */
  async run(client, interaction, options) {
    await interaction.deferReply({ ephemeral: false }).catch(() => {});
    let member = options?.getUser("user") || interaction.user;

    let data = await user.findById(member.id);

    if (!data || !data?.plans?.length) {
      data = {
        _id: member.id,
        plans: [
          {
            plan: "N/A",
            due: "N/A",
            registered: "N/A",
            hosting_id: "N/A",
          },
        ],
      };
    }

    let embeds = [];

    for (let i = 0; i < data?.plans?.length; i++) {
      let temp = data?.plans[i];

      let status = "Inactive";

      if (Date.now() > temp.due) status = "Inactive";
      else status = "Active";

      embeds.push(
        new EmbedBuilder()
          .setAuthor({
            name: member.username + " profile.",
            iconURL: member.avatarURL({ dynamic: true }),
          })
          .setColor("Blurple")
          .setThumbnail(member.displayAvatarURL({ dynamic: true }))
          .addFields(
            {
              name: "Plan",
              value: `**${temp?.plan}**`,
            },
            {
              name: "Price",
              value: isNaN(config.plans[temp?.plan])
                ? "N/A"
                : `**${config.plans[temp?.plan]}$**`,
            },
            { name: "Status", value: isNaN(temp.due) ? "N/A" : `${status}` },
            {
              name: "Registered Date",
              value: isNaN(temp.registered)
                ? "N/A"
                : `${new Date(temp.registered)}`,
            },
            {
              name: "Next due",
              value: isNaN(temp?.due)
                ? "N/A"
                : `<t:${Math.round(temp.due / 1000)}:R>`,
            },
            {
              name: "Hosting ID",
              value: `**${temp.hosting_id}**`,
            }
          )
          .setFooter({
            text: client.user.username,
            iconURL: client.user.avatarURL(),
          })
      );
    }

    return await pagination({
      interaction: interaction,
      embeds: embeds,
      author: interaction.member.user,
      time: 40000,
      fastSkip: false,
      disableButtons: true,
      pageTravel: false,
      customFilter: (interaction) => {
        return interaction.member.user.id === interaction.member.id;
      },
      buttons: [
        {
          type: ButtonTypes.previous,
          label: "Previous",
          style: ButtonStyles.Success,
          emoji: "⏮",
        },
        {
          type: ButtonTypes.next,
          label: "Next",
          style: ButtonStyles.Success,
          emoji: "⏭",
        },
      ],
    }).catch(() => {});
  },
  ownerOnly: false,
};
