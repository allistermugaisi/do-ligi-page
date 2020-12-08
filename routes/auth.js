const express = require("express");
const User = require("../models/Users");
const brcypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const router = express.Router();

router.get("/register", (req, res) => {
  res.render("register");
});

router.get("/login", (req, res) => {
  res.render("login");
});
// Regiter
router.post("/register", async (req, res) => {
  const obj = JSON.parse(JSON.stringify(req.body)); // req.body = [Object: null prototype] { title: 'product' }
  const { username, email, password, password2 } = obj;
  let errors = [];
  // Check required fields
  if (!username || !email || !password || !password2) {
    errors.push({ msg: "Please fill in all fields!" });
  }

  // Check if passwords match
  if (password !== password2) {
    errors.push({ msg: "Passwords do match!" });
  }

  // Check pass length
  if (password.length < 6) {
    errors.push({ msg: "Password should be atleast 6 characters!" });
  }

  if (errors.length > 0) {
    res.render("register", {
      errors,
      username,
      email,
      password,
      password2,
    });
  } else {
    // Validation pass
    const emailExist = await User.findOne({ email: req.body.email });
    // Check if the user already exists
    if (emailExist) {
      errors.push({ msg: "Email is already registered!" });
      res.render("register", {
        errors,
        username,
        email,
        password,
        password2,
      });
    } else {
      // Hash password
      const salt = await brcypt.genSalt(10);
      const hashedPassword = await brcypt.hash(req.body.password, salt);
      const hashedPassword2 = await brcypt.hash(req.body.password2, salt);

      // Create a new user
      const user = new User({
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
        password2: hashedPassword2,
      });
      // console.log(user);
      try {
        const savedUser = await user.save();
        // res.send({ user: user._id });
        req.flash("success_msg", "You are now registered and can login!");
        res.redirect("/api/user/login");
      } catch (err) {
        res.status(400).send(err);
      }
    }
  }

  // console.log(errors);
});

// Login
router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/api/user/login",
    failureFlash: true,
  })(req, res, next);
});

// Logout
router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success_msg", "You are logged out!");
  res.redirect("/api/user/login");
});

module.exports = router;
