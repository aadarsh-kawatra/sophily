const mongoose = require("mongoose");

mongoose
  .connect("mongodb://localhost:27017/sophily")
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch(() => {
    console.error("MongoDB connection failed");
  });

const userSchema = mongoose.Schema({
  username: { type: String, required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  profile_pic: {
    type: String,
    default: "default_avatar-male.jpg",
  },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
});

module.exports = mongoose.model("user", userSchema);
