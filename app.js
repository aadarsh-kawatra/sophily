const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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

// middlewares
function isLoggedin(req, res, next) {
  if (!req.cookies.token) return res.send("You need to be logged in");

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
    return res.send("User Logged In");
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

  const existingUser = await userModel.findOne({ _id: user_id });
  if (!existingUser) {
    res.cookie("token", "");
    return res.send("Invalid Session");
  }

  return res.send({
    name: existingUser.name,
    email: existingUser.email,
    username: existingUser.username,
    age: existingUser.age,
  });
});

app.listen(port, () => {
  console.log("Server started at port:", port);
});
