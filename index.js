const express = require("express");
const app = express();
const path = require("path");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

mongoose
  .connect("mongodb://localhost:27017", {
    dbName: "backend",
  })
  .then(() => {
    console.log("database connect");
  })
  .catch((e) => {
    console.log(e);
  });

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const user = mongoose.model("user", userSchema);

// setting up middleware for define static files directory

app.use(express.static(path.join(__dirname, "public")));

// ye middle ware ko use krke hum form mein se data access kr sakte hai
app.use(express.urlencoded({ extended: true }));

// cookieParser middlware for authentication
app.use(cookieParser());

// view engine setting
app.set("view engine", "ejs");

const isAuthentication = async (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    const decodedData = jwt.verify(token, "mohitb123");
    req.newUser = await user.findById(decodedData._id)
    next();
  } else {
    res.redirect("/login")
  }
};

app.get("/", isAuthentication, (req, res) => {
    // console.log(req.newUser)
  res.render("logout",{name:req.newUser.name});
});

app.get("/login", (req,res)=>{
    res.render("login.ejs")
})

app.get("/register", (req, res) => {
  res.render("register.ejs")
});

app.post("/login", async (req,res)=>{
    const {email, password} = req.body;
    let newUser = await user.findOne({email});

    if(!newUser) return res.redirect("/register");
    const isMatch =newUser.password === password;
if (!isMatch) return res.render("login", {email, message: "Incorrect Password" });

    const token = jwt.sign({_id: newUser._id},"mohitb123");
    res.cookie("token", token,{
        httpOnly: true,
        expires: new Date(Date.now()+60*1000)
    });
 res.redirect("/")
})

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

let newUser = await user.findOne({email})
if(newUser){
      return res.redirect("/login")
}
   newUser = await user.create({
    name,
    email,
    password
  });

  const token = jwt.sign({ _id: newUser._id }, "mohitb123");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});
app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/");
});

app.listen(5000, () => {
  console.log("Server has been started");
});
