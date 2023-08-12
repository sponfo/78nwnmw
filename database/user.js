const mongoose = require("mongoose");

const user = new mongoose.Schema({
  _id: String,
  plans: [
    {
      plan: String,
      due: Number,
      registered: Number,
      hosting_id: String,
    },
  ],
});

module.exports = mongoose.models.user || mongoose.model("user", user);
