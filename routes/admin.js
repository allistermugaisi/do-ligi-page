const express = require("express");
const User = require("../models/Users");
const brcypt = require("bcryptjs");
const passport = require("passport");
const router = express.Router();
const { ensureAdminAuthenticated } = require("../middleware/auth");

router.get("/", ensureAdminAuthenticated, async (req, res) => {
  if (req.user.isAdmin) {
    res.render("admin/index");
  } else {
    req.flash("error_msg", "You are not admin and can't view that resource!");
    res.redirect("/admin/login");
  }
});

router.get("/login", async (req, res) => {
  res.render("admin/login");
});

router.get("/register", async (req, res) => {
  res.render("admin/register");
});

// Regiter
router.post("/register", async (req, res) => {
  const obj = JSON.parse(JSON.stringify(req.body)); // req.body = [Object: null prototype] { title: 'product' }
  const { username, email, admincode, password, password2 } = obj;

  let errors = [];
  // Check required fields
  if (!username || !email || !admincode || !password || !password2) {
    errors.push({ msg: "Please fill in all fields!" });
  }

  // Check if user is admin
  if (admincode !== "secretcode@123") {
    errors.push({ msg: "Invalid admin secret code!" });
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
    res.render("admin/register", {
      errors,
      username,
      admincode,
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
      res.render("admin/register", {
        errors,
        username,
        admincode,
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

      if (admincode === "secretcode@123") {
        user.isAdmin = true;
      }

      try {
        const savedUser = await user.save();

        req.flash("success_msg", "Successfully registered as an admin!");
        res.redirect("/admin/login");
      } catch (err) {
        res.status(400).send(err);
      }
    }
  }
});

// Login
router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/admin",
    successFlash: "Welcome to admin dashboard of Ligipage!",
    failureRedirect: "/admin/login",
    failureFlash: true,
  })(req, res, next);
});

// Logout
router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success_msg", "You are logged out!");
  res.redirect("/admin/login");
});

module.exports = router;
