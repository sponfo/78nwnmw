const { Client, Collection, WebhookClient } = require("discord.js");
const config = require("../config");
const setupEvents = require("../utils/events");
const setupCommands = require("../utils/commands");
const fetch = require("node-fetch");
const { default: mongoose } = require("mongoose");
const colors = require("colors");
const { Payments } = require("./payments");

class Bot extends Client {
  constructor(props) {
    super(props);
    this.init();
  }

  async log(url, payload) {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.log(err);
    });

    return true;
  }

  error(file, message) {
    console.log(
      `${colors.bgRed("[ERROR]")} | ${colors.cyan(file)} | ${colors.yellow(
        message
      )}`
    );
  }

  info(file, message) {
    console.log(
      `${colors.bgCyan("[INFO]")} | ${colors.cyan(file)} | ${colors.yellow(
        message
      )}`
    );
  }

  message(file, message) {
    console.log(
      `${colors.bgGreen("[MESSAGE]")} | ${colors.cyan(file)} | ${colors.yellow(
        message
      )}`
    );
  }

  async init() {
    /**
     * Webhooks
     */
    this.webhooks = {
      /**
       * @type { WebhookClient }
       */
      payments: new WebhookClient({ url: config?.webhook?.payments }),

      /**
       * @type { WebhookClient }
       */
      errors: new WebhookClient({ url: config?.webhook?.errors }),
    };

    this.commands = new Collection();
    this.interactions = new Collection();
    this.cooldowns = new Collection();
    this.payments = new Payments(this);

    setupEvents(this);
    setupCommands(this);

    this.login(config.token).catch((err) =>
      console.log(`[DISCONNECTED]: Failed to login:`, err.message)
    );

    await mongoose
      .connect(config.mongo, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(() =>
        this.message(
          `DATABASE`,
          `Initiated database tunnel. [${colors.green(200)}]`
        )
      )
      .catch((err) =>
        console.log(`[ERROR]: Failed to connect database`, err?.message)
      );
  }
}

module.exports = Bot;
