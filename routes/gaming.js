const express = require("express");
const multer = require("multer");
const path = require("path");
const Gaming = require("../models/Gaming");
const { ensureAdminAuthenticated } = require("../middleware/auth");
const router = express.Router();

router.get("/", async (req, res) => {
  let noMatch = null;
  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), "gi");
    // Get all gaming arena's from DB
    Gaming.find({ name: regex }, function (err, arena) {
      if (err) {
        console.log(err);
      } else {
        if (arena.length < 1) {
          noMatch = "Gaming arena not found, please try again.";
        }
        res.render("gaming/index", { zones: arena, noMatch: noMatch });
      }
    });
  } else {
    const arena = await Gaming.find().sort({ createdAt: "desc" });
    res.render("gaming/index", { zones: arena, noMatch: noMatch });
  }
});

router.get("/details", async (req, res) => {
  res.send("Gaming details");
});

router.get("/new", ensureAdminAuthenticated, async (req, res) => {
  if (req.user.isAdmin) {
    res.render("gaming/new", { arena: new Gaming() });
  } else {
    req.flash("error_msg", "You are not admin and can't perform that action!");
    res.redirect("/admin/login");
  }
});

router.get("/edit/:id", ensureAdminAuthenticated, async (req, res) => {
  if (req.user.isAdmin) {
    const arena = await Gaming.findById(req.params.id);
    res.render("gaming/edit", { arena: arena });
  } else {
    req.flash("error_msg", "You are not admin and can't perform that action!");
    res.redirect("/admin/login");
  }
});

router.get("/:slug", async (req, res) => {
  const arena = await Gaming.findOne({ slug: req.params.slug });
  if (arena == null) res.redirect("/");
  res.render("gaming/show", { arena: arena });
});

router.get("/upload", async (req, res) => {
  res.render("gaming/upload");
});
// Set Storage Engine
const storage = multer.diskStorage({
  destination: "./public/uploads",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

// Init Upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("myImage");

// Check file type
function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mine
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Only jpg, png, jpeg are allowed!");
  }
}

router.post("/upload", async (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      res.render("gaming/upload", {
        msg: err,
      });
    } else {
      if (req.file == undefined) {
        res.render("gaming/upload", {
          msg: "Error: No File Selected!",
        });
      } else {
        res.render("gaming/upload", {
          msg: "File successfully Uploaded!",
          file: `${req.file.filename}`,
        });
      }
    }
  });
});

router.post(
  "/new",
  async (req, res, next) => {
    const obj = JSON.parse(JSON.stringify(req.body)); // req.body = [Object: null prototype] { title: 'product' }
    const { name, location, fee, consoles, players } = obj;
    let errors = [];
    // console.log(obj);
    // Check required fields
    if (!name || !location || !fee || !consoles || !players) {
      errors.push({ msg: "Please fill in all fields!" });
    }

    if (errors.length > 0) {
      res.render("gaming/new", {
        errors,
        fee,
        name,
        location,
        consoles,
        players,
      });
    } else {
      // Validation pass
      const arenaExist = await Gaming.findOne({ name: req.body.name });
      // Check if Gaming Arena already exists
      if (arenaExist) {
        errors.push({ msg: "Gaming Arena already exists!" });
        res.render("gaming/new", {
          errors,
          fee,
          name,
          location,
          consoles,
          players,
        });
      }
    }
    req.arena = new Gaming();
    next();
  },

  saveArenaAndRedirect("new")
);

router.put(
  "/edit/:id",
  async (req, res, next) => {
    const obj = JSON.parse(JSON.stringify(req.body)); // req.body = [Object: null prototype] { title: 'product' }
    const { name, location, fee, consoles, players } = obj;
    let errors = [];
    // Check required fields
    if (!name || !location || !fee || !consoles || !players) {
      errors.push({ msg: "Please fill in all fields!" });
    }

    if (errors.length > 0) {
      res.render("gaming/edit", {
        errors,
        fee,
        name,
        location,
        consoles,
        players,
      });
    }
    req.arena = await Gaming.findById(req.params.id);
    next();
  },

  saveArenaAndRedirect("edit")
);

router.delete("/delete/:id", ensureAdminAuthenticated, async (req, res) => {
  if (req.user.isAdmin) {
    await Gaming.findByIdAndDelete(req.params.id);
    res.redirect("/gaming");
  } else {
    req.flash("error_msg", "You are not admin and can't perform that action!");
    res.redirect("/admin/login");
  }
});

function saveArenaAndRedirect(path) {
  return async (req, res) => {
    let arena = req.arena;
    arena.name = req.body.name;
    arena.location = req.body.location;
    arena.fee = req.body.fee;
    arena.players = req.body.players;
    arena.consoles = req.body.consoles;
    (arena.creator.id = req.user._id),
      (arena.creator.username = req.user.username);
    // console.log(arena);
    try {
      arena = await arena.save();
      req.flash("success_msg", "Gaming Arena successfully registered!");
      res.redirect(`/gaming/${arena.slug}`);
    } catch (e) {
      res.render(`gaming/${path}`, { arena: arena });
    }
  };
}

// Define escapeRegex function for search feature
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
module.exports = router;
