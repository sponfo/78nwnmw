const coinbase = require("coinbase-commerce-node");
const config = require("../config");
const express = require("express");
const bodyParser = require("body-parser");
const Bot = require(".");
const { EmbedBuilder } = require("discord.js");
const colors = require("colors");
const approval = require("../database/approval");

class Payments {
  constructor(client) {
    this.key = config.coinbase.apikey;
    /**
     * @type { Bot }
     */
    this.discordClient = client;
    this.webhookKey = config.coinbase.webhookKey;
    this.app = express();
    this.app.use(bodyParser.json());
    this.routes();
    this.start();

    /**
     * @type {CoinBaseCommerce.Client}
     */
    this.client = coinbase.Client.init(this.key);
  }

  start() {
    this.app.listen(config.port, () => {
      this.discordClient.message(
        `PAYMENTS`,
        `Initiated blockchain tunnel. [PORT: ${colors.green(config.port)}]`
      );
    });
  }

  routes() {
    // this.app.get("/", async (req, res, next) => {
    //   res.status(200).json({ message: "hello world!" });
    // });

    this.app.post("/", async (req, res) => {
      if (!req?.body || !req?.body?.event) return;

      const event = req.body?.event;
      const signature = req.headers["x-cc-webhook-signature"];

      try {
        coinbase.Webhook.verifyEventBody(
          JSON.stringify(req.body),
          signature,
          this.webhookKey
        );

        this.discordClient.info(
          event.type,
          `Metadata: ${JSON.stringify(event?.data?.metadata)}`
        );

        switch (event.type) {
          case "charge:created":
            //console.log("Charge created", event.data);
            break;
          case "charge:pending":
            if (event?.data?.metadata?.id) {
              await this.discordClient.webhooks.payments.send({
                embeds: [
                  new EmbedBuilder()
                    .setDescription(
                      `Detected pending charge [<@${event.data.metadata.id}> from <#${event.data.metadata.channel_id}>].`
                    )
                    .addFields(
                      {
                        name: "From",
                        value: this.discordClient.users.cache.get(
                          event?.data.metadata?.id
                        )?.tag
                          ? this.discordClient.users.cache.get(
                              event?.data.metadata?.id
                            )?.tag
                          : "Unknown#0000",
                      },
                      {
                        name: "Amount",
                        value: `**${event?.data?.timeline[1]?.payment?.value?.amount}** LTC`,
                      }
                    )
                    .setFooter({
                      text: this.discordClient.user.username,
                      iconURL: this.discordClient.user.avatarURL({
                        dynamic: true,
                      }),
                    })
                    .setColor("Blurple")
                    .setAuthor({
                      name: `Event: ${event.type}`,
                    }),
                ],
                // files: [
                //   new AttachmentBuilder(Buffer.from(JSON.stringify(event)), {
                //     name: "charge_pending.txt",
                //   }),
                // ],
              });
            }
            break;
          case "charge:confirmed":
            if (event.data.metadata?.id) {
              await this.discordClient.channels.cache
                .get(event.data.metadata?.channel_id)
                ?.send({
                  content: `Your payment have been confirmed, please wait for staff for assistance.`,
                  embeds: [
                    new EmbedBuilder()
                      .setDescription(`Payment confirmed.`)
                      .addFields({
                        name: "Amount",
                        value: `**${event?.data?.timeline[1]?.payment?.value?.amount}** LTC`,
                      })
                      .setFooter({
                        text: this.discordClient.user.username,
                        iconURL: this.discordClient.user.avatarURL({
                          dynamic: true,
                        }),
                      })
                      .setColor("Blurple")
                      .setAuthor({
                        name: `Payment confirmed.`,
                      }),
                  ],
                })
                .catch(() => {});

              let appr = await approval.create({
                user: event.data.metadata.id,
                plan: event.data.metadata.plan,
                channel: event.data.metadata.channel_id,
              });

              await this.discordClient.webhooks.payments.send({
                content: appr._id.toString(),
                embeds: [
                  new EmbedBuilder()
                    .setDescription(
                      `Payment confirmed [<@${event.data.metadata.id}> from <#${event.data.metadata.channel_id}>].`
                    )
                    .addFields(
                      { name: "Mail", value: event.data.metadata.mail },
                      {
                        name: "From",
                        value: this.discordClient.users.cache.get(
                          event?.data.metadata?.id
                        )?.tag
                          ? this.discordClient.users.cache.get(
                              event?.data.metadata?.id
                            )?.tag
                          : "Unknown#0000",
                      },
                      {
                        name: "Amount",
                        value: `**${event?.data?.timeline[1]?.payment?.value?.amount}** LTC`,
                      }
                    )
                    .setFooter({
                      text: this.discordClient.user.username,
                      iconURL: this.discordClient.user.avatarURL({
                        dynamic: true,
                      }),
                    })
                    .setColor("Blurple")
                    .setAuthor({
                      name: `Event: ${event.type}`,
                    }),
                ],
              });
            } else {
            }
            break;
          case "charge:failed":
            break;
          default:
            this.discordClient.error(
              event.type,
              `Unhandled payment event trigged.`
            );
            break;
        }

        return res.sendStatus(200);
      } catch (error) {
        await this.discordClient.webhooks.payments.send({
          content: `${config.owners.map((c) => `<@${c}>`)?.join(", ")}`,
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `We've detected fault in our system at **${event?.type} ** part..`
              )
              .addFields(
                { name: `Error`, value: error?.message },
                {
                  name: `Stack`,
                  value: `\`\`\`${error?.stack || "None"}\`\`\``,
                }
              )
              .setFooter({
                text: this.discordClient.user?.username,
                iconURL: this.discordClient.user.avatarURL({
                  dynamic: true,
                }),
              })
              .setColor([255, 0, 0])
              .setAuthor({
                name: `Event: ${event.type}`,
              })?.data,
          ],
        });

        this.discordClient.error("Invalid webhook signature", error?.message);
        res.sendStatus(400);
      }
    });
  }

  usdToLtc(ltcRate, usdAmount) {
    const ltcAmount = usdAmount / ltcRate;
    return parseFloat(ltcAmount.toFixed(6));
  }

  async value() {
    let response = await fetch(
      "https://api.coinbase.com/v2/prices/LTC-USD/spot"
    );

    let json = await response?.json();

    if (!json || !json?.data || !json?.data?.amount) return null;
    return json?.data?.amount;
  }

  async charge(name, id, plan, price, channel_id, mail) {
    try {
      const chargeData = {
        name: `${plan || "Product"} plan`,
        description: "Powered by crazy host.",
        pricing_type: "fixed_price",
        local_price: {
          amount: price,
          currency: "USD",
        },
        metadata: {
          id,
          channel_id,
          name,
          price,
          mail,
          plan,
        },
      };

      let response = await coinbase.resources.Charge.create(chargeData);

      return { ltc: response.addresses.litecoin, url: response.hosted_url };
    } catch (err) {
      console.log(
        `[ERROR]: An error occurred while creating a charge. \n${err?.message}`
      );
    }
  }
}

module.exports = { Payments };
