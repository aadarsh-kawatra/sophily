const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");

// models
const userModel = require("./models/user.js");
const postModel = require("./models/post.js");

const app = express();
const port = 8000;
const jwt_secret = "sophily_jwt_secret";

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// middlewares
const upload = require("./config/multer.js");
function isLoggedin(req, res, next) {
  if (!req.cookies.token) return res.redirect("/login");

  const data = jwt.verify(req.cookies.token, jwt_secret);
  req._user = data;
  next();
}

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/register", async (req, res) => {
  const { username, name, email, age, password } = req.body;

  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) return res.status(409).send("user already exists");

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newUser = await userModel.create({
      username,
      name,
      email,
      age,
      password: hash,
    });

    const token = jwt.sign({ email, user_id: newUser._id }, jwt_secret, {
      expiresIn: "1d",
    });
    res.cookie("token", token);
    return res.send("User Registered");
  } catch (err) {
    console.error(err);
    return res.status(500).send("User Registration Failed");
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await userModel.findOne({ email });
    if (!existingUser) return res.status(404).send("Invalid Credentials");

    const validCredentials = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!validCredentials) return res.status(404).send("Invalid Credentials");

    const token = jwt.sign({ email, user_id: existingUser._id }, jwt_secret, {
      expiresIn: "1d",
    });
    res.cookie("token", token);
    return res.redirect("/profile");
  } catch (err) {
    console.error(err);
    return res.status(500).send("User Login Failed");
  }
});

app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/login");
});

app.get("/profile", isLoggedin, async (req, res) => {
  const { user_id } = req._user;

  const user = await userModel.findOne({ _id: user_id });
  if (!user) {
    res.cookie("token", "");
    return res.send("Invalid Session");
  }

  await user.populate("posts");
  return res.render("profile", { user });
});

app.get("/profile/upload", isLoggedin, async (req, res) => {
  return res.render("profile_upload");
});

app.post(
  "/profile_pic_upload",
  isLoggedin,
  upload.single("profile_pic"),
  async (req, res) => {
    const profile_pic = req.file.filename;

    try {
      await userModel.findOneAndUpdate(
        { _id: req._user.user_id },
        { profile_pic }
      );
      return res.redirect("/profile");
    } catch (err) {
      console.error(err);
      return res.status(500).send("Profile Pic Upload Failed");
    }
  }
);

app.post("/post", isLoggedin, async (req, res) => {
  const { user_id } = req._user;
  const { content } = req.body;

  try {
    const user = await userModel.findOne({ _id: user_id });
    if (!user) {
      res.cookie("token", "");
      return res.send("Invalid Session");
    }

    const newPost = await postModel.create({
      content,
      user: user_id,
    });
    user.posts.push(newPost._id);
    await user.save();

    return res.send("post created");
  } catch (error) {
    return res.status(500).send("Post Creation Failed");
  }
});

app.get("/like/:id", isLoggedin, async (req, res) => {
  const { user_id } = req._user;
  const { id: post_id } = req.params;

  const post = await postModel.findOne({ _id: post_id });
  if (post.likes.indexOf(user_id) === -1) {
    post.likes.push(user_id);
  } else {
    post.likes = post.likes.filter((ele) => ele.toString() !== user_id);
  }
  await post.save();

  return res.redirect("/profile");
});

app.get("/edit/:id", isLoggedin, async (req, res) => {
  const { user_id } = req._user;
  const { id: post_id } = req.params;

  const post = await postModel.findOne({ _id: post_id });
  if (post.user.toString() !== user_id) return res.redirect("/profile");

  return res.render("edit", { post });
});

app.post("/edit/:id", isLoggedin, async (req, res) => {
  const { user_id } = req._user;
  const { id: post_id } = req.params;
  const { content } = req.body;

  const post = await postModel.findOne({ _id: post_id });
  if (post.user.toString() !== user_id) {
    return res.status(403).send("Unauthorized User");
  }

  post.content = content;
  await post.save();
  return res.redirect("/profile");
});

app.listen(port, () => {
  console.log("Server started at port:", port);
});
