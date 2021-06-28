//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
//const encrypt = require("mongoose-encryption");
//const md5 = require("md5");
//const bcrypt = require("bcrypt");
//const saltRounds= 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app =  express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended:true
}));

app.use(session({
  secret:"Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema ({
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);

// const secret = "Thisisourlittlesecret."; - dotenv
//userSchema.plugin(encrypt,{secret:process.env.SECRET, encryptedFields:["password"]}); // encrypt before creating new users - EncryptedFields makes only the password being encrypted, email can be researched.

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req,res){
  res.render("home");
});

app.get("/login", function(req,res){
  res.render("login");
});

app.get("/register", function(req,res){
  res.render("register");
});

app.get("/secrets", function(req,res){
  if (req.isAuthenticated()){ //passport.js
    res.render("secrets");
  } else {
    res.redirect("login");
  }
});

app.get("/logout", function(req,res){
  req.logout(); //passport documentation
  res.redirect("/");
})

app.post("/register", function(req,res){ //if the user is registered he can have access to the secrets page.

  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err){
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req,res, function(){
        res.redirect("/secrets");
      });
    }
  });

  //bcrypt.hash(req.body.password, saltRounds, function(err,hash){ //bcrypt, hashes req.body.password and passes it to the database with the saltRounds;
    //const newUser = new User({
      //email: req.body.username,
      //password: hash
      //password: md5(req.body.password) //md5 hash function
    //})

    //newUser.save(function(err){
      //if(err){
        //console.log(err);
      //} else {
        //res.render("secrets"); //we don't render secrets because we only want that if the user is registered.
      //}
    //});
  });

app.post("/login", function(req,res){

  const user = new User({
    username:req.body.username,
    password:req.body.password
  });

  req.login(user, function(err){
    if (err){
      console.log(err);
    } else {
      passport.authenticate("local")(req,res, function(){
        res.redirect("secrets");
      });
    }
  });


  // const username = req.body.username;
  // const password = req.body.password;
  //
  // User.findOne({email:username}, function(err, foundUser){
  //   if (err){
  //     console.log(err);
  //   } else {
  //     if (foundUser){
  //       //if (foundUser.password === password){ // if the login password = password dB, it acess
  //         bcrypt.compare(password, foundUser.password, function(err, result) { //tem de ser diferente de res
  //           if (result === true){
  //             res.render("secrets");
  //           }
  //         });
  //       }
  //     }
  // });
});

app.listen(3000, function(){
  console.log("Server started on port 3000.");
});
