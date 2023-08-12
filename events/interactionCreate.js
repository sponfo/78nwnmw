const {
  CommandInteraction,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalBuilder,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  EmbedBuilder,
} = require("discord.js");
const config = require("../config");
const Bot = require("../lib");
const approval = require("../database/approval");

/**
 *
 * @param { Bot } client
 * @param { CommandInteraction } interaction
 */
module.exports = async (client, interaction) => {
  if (interaction.isModalSubmit() && interaction.customId === "mail") {
    try {
      await interaction.deferReply({});
      /**
       * @type { ModalSubmitInteraction }
       */

      let modelInteraction = interaction;

      let mail = modelInteraction?.fields?.getField("input", 4)?.value;

      let data = client.interactions.get(modelInteraction.message.id);
      if (!data)
        return await modelInteraction.editReply({
          content: "Unable to find any data related with this interaction.",
        });

      await modelInteraction.message.edit({
        content: "",
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: "Confirmation",
              iconURL: modelInteraction.user.avatarURL(),
            })
            .setColor("Blurple")
            .setDescription(`Mail entered: **${mail}**`)
            .addFields(
              { name: `Plan selected`, value: data.plan },
              { name: `Worth`, value: data.format }
            ),
        ],
        components: [],
      });

      if (data.format !== "FREE") {
        let charge = await client.payments.charge(
          modelInteraction.user?.tag,
          modelInteraction?.user?.id,
          data.plan,
          config?.plans[data.plan],
          modelInteraction.channel.id,
          mail
        );

        return await modelInteraction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `Hey there ${modelInteraction?.user?.toString()}, please pay to purchase **${
                  data.plan
                }** plan. [Worth: **${data.format}**]`
              )
              .addFields(
                {
                  name: `Litecoin address`,
                  value: `\`\`\`${charge.ltc}\`\`\``,
                },
                {
                  name: `Other coins`,
                  value: `[Click here](${charge.url})`,
                }
              )
              .setColor("Blue")
              .setAuthor({
                name: `Payment`,
              }),
          ],
        });
      } else {
        let appr = await approval.create({
          user: modelInteraction.user.id,
          plan: data.plan,
          channel: interaction.channel.id,
        });

        await client.webhooks.payments.send({
          content: appr._id.toString(),
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `Free plan request by ${modelInteraction.user.toString()} (\`${
                  modelInteraction.user.id
                }\`).`
              )
              .addFields({ name: "Mail", value: mail })
              .setFooter({
                text: client.user.username,
                iconURL: client.user.avatarURL({
                  dynamic: true,
                }),
              })
              .setColor("Blurple"),
          ],
        });

        await modelInteraction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `Hey there ${modelInteraction?.user?.toString()}, request have been submitted. Please wait for admins for furthur assistance.`
              )
              .setColor("Blue")
              .setAuthor({
                name: `Free plan`,
              }),
          ],
        });
      }
    } catch (err) {
      client.error("interactionCreate", err);
    }
  } else if (
    interaction.isStringSelectMenu() &&
    interaction?.customId === "plans"
  ) {
    try {
      /**
       * @type { StringSelectMenuInteraction }
       */
      let selectInteraction = interaction;

      let pricing = config?.plans[selectInteraction?.values?.toString()];
      if (pricing) pricing = `${pricing}$ or ${pricing * config.inr}rs`;
      if (pricing === 0) pricing = `FREE`;

      if (!pricing)
        return selectInteraction.editReply({
          content: `Unable to find **${selectInteraction?.values?.toString()}** plan.`,
        });

      const modal = new ModalBuilder().setCustomId("mail").setTitle("Mail");

      const input = new TextInputBuilder()
        .setCustomId("input")
        .setLabel("Enter your mail please.")
        .setStyle(TextInputStyle.Short);

      const firstActionRow = new ActionRowBuilder().addComponents(input);

      modal.addComponents(firstActionRow);

      client.interactions.set(selectInteraction.message.id, {
        plan: selectInteraction?.values?.toString(),
        price: config?.plans[selectInteraction?.values?.toString()],
        format: pricing,
      });

      return await selectInteraction.showModal(modal);
    } catch (err) {
      client.error("interactionCreate", err?.message);
    }
  } else if (interaction?.isCommand()) {
    let command = client.commands.get(interaction.commandName);
    if (!command) return;
    if (!command?.ownerOnly)
      await command
        .run(client, interaction, interaction.options)
        .catch(async (err) => {
          await client.log(config.webhook.errors, {
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `We've detected fault in our system at **${interaction.commandName}** command.`
                )
                .addFields(
                  { name: `Error`, value: err?.message },
                  {
                    name: `Stack`,
                    value: `\`\`\`${err?.stack || "None"}\`\`\``,
                  }
                )
                .setFooter({
                  text: client.user.username,
                  iconURL: client.user.avatarURL({
                    dynamic: true,
                  }),
                })
                .setColor([255, 0, 0])
                .setAuthor({
                  name: `Command: ${interaction?.commandName}`,
                })?.data,
            ],
          });
          client.error(`[${interaction.commandName}]`, err?.message);
        });
    else if (command?.ownerOnly && config.owners.includes(interaction.user.id))
      await command
        .run(client, interaction, interaction.options)
        .catch(async (err) => {
          await client.log(config.webhook.errors, {
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `We've detected fault in our system at **${interaction.commandName}** command.`
                )
                .addFields(
                  { name: `Error`, value: err?.message },
                  {
                    name: `Stack`,
                    value: `\`\`\`${err?.stack || "None"}\`\`\``,
                  }
                )
                .setFooter({
                  text: client.user.username,
                  iconURL: client.user.avatarURL({
                    dynamic: true,
                  }),
                })
                .setColor([255, 0, 0])
                .setAuthor({
                  name: `Command: ${interaction?.commandName}`,
                })?.data,
            ],
          });
          client.error(`[${interaction.commandName}]`, err?.message);
        });
    else
      await interaction
        .reply({
          content: `**[ERROR]**: You cannot use this command.`,
        })
        .catch(() => {});
  }
};
