const Bot = require("../lib");
const config = require("../config");
const colors = require("colors");
const {
  EmbedBuilder,
  TextChannel,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
} = require("discord.js");

/**
 *
 * @param { Bot } client
 * @param { TextChannel } channel
 */
module.exports = async (client, channel) => {
  try {
    if (!config?.category?.includes(channel?.parentId)) return;

    let titles = [];
    let form = [];

    for (let i = 0; i < Object.keys(config.plans)?.length; i++) {
      let plans = Object.keys(config.plans);
      let prices = Object.values(config.plans);
      if (prices[i] > 0)
        prices[i] = `${prices[i]}$ [${prices[i] * config.inr}rs]`;
      else prices[i] = "Free";

      form.push(
        new StringSelectMenuOptionBuilder()
          .setLabel(plans[i]?.charAt(0).toUpperCase() + plans[i].slice(1))
          .setDescription(`${plans[i]} plan | Worth: ${prices[i]}`)
          .setValue(plans[i])
          .setEmoji({ id: config.emojis[plans[i]].id })
      );

      titles.push({
        name: plans[i].charAt(0).toUpperCase() + plans[i].slice(1),
        value: prices[i],
        inline: true,
      });
    }

    const select = new StringSelectMenuBuilder()
      .setCustomId("plans")
      .setPlaceholder("Make a selection!")
      .addOptions(...form);

    const row = new ActionRowBuilder().addComponents(select);

    await channel.send({
      content: `**Choose your plan**`,
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `NOTE: Before proceeding please create account on our [website](${config.website}).`
          )
          .setThumbnail(channel.guild.iconURL({ dynamic: true }))
          .setImage(
            "https://media.discordapp.net/attachments/1134821823167610910/1134831719703384074/standard_5.gif"
          )
          .addFields(...titles)
          .setColor([255, 0, 0])
          .setAuthor({
            name: `Plans`,
          })?.data,
      ],
      components: [row],
    });
  } catch (err) {
    await client.webhooks.errors
      .send({
        content: `${config.owners.map((c) => `<@${c}>`)?.join(", ")}`,
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(
              `We've detected fault in our system at **channelCreate** event.`
            )
            .addFields({ name: `Error`, value: err?.message }),
        ],
      })
      .catch((err) =>
        client?.error("channelCreate.js", err?.message || "Undetermined")
      );
  }
};
