const Bot = require("./lib");
new Bot({ intents: 32767 });
const colors = require("colors");

if (!process.argv?.includes("--run"))
  console.log(`Don't forget don't do payments in this session.`.bgRed);
