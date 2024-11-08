const mongoose = require("mongoose");

mongoose
  .connect("mongodb://localhost:27017/sophily")
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch(() => {
    console.error("MongoDB connection failed");
  });

const postSchema = mongoose.Schema({
  content: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("post", postSchema);
