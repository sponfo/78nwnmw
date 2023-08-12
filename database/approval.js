const mongoose = require("mongoose");

const approval = new mongoose.Schema({
  user: String,
  plan: String,
  channel: String,
});

module.exports =
  mongoose.models.approval || mongoose.model("approval", approval);
