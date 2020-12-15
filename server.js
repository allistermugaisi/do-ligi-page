const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const articleRouter = require("./routes/articles");
const gamingRouter = require("./routes/gaming");
const adminRouter = require("./routes/admin");
const userRouter = require("./routes/auth");
const methodOverride = require("method-override");
const flash = require("connect-flash");
const session = require("express-session");
const app = express();

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// Passport Config
require("./config/passport")(passport);

// On development server use DB_CONNECT || On production server use DB_SERVER_CONNECT
mongoose
  .connect(process.env.DB_SERVER_CONNECT, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => console.log("MongoDB connected successfully!"))
  .catch((err) => console.log(err));

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"));
app.use(express.static("public"));

// Express Session
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global vars
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

app.get("/", async (req, res) => {
  res.render("index");
});

// Routes middleware
app.use("/user", userRouter);
app.use("/articles", articleRouter);
app.use("/gaming", gamingRouter);
app.use("/admin", adminRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, console.log(`Server is running on port ${PORT}`));
