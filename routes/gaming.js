const express = require("express");
const multer = require("multer");
const path = require("path");
const Gaming = require("../models/Gaming");
const router = express.Router();

router.get("/", async (req, res) => {
  const arena = await Gaming.find().sort({ createdAt: "desc" });
  res.render("gaming/index", { zones: arena });
});

router.get("/details", async (req, res) => {
  res.send("Gaming details");
});

router.get("/new", async (req, res) => {
  res.render("gaming/new", { arena: new Gaming() });
});

router.get("/edit/:id", async (req, res) => {
  const arena = await Gaming.findById(req.params.id);
  res.render("gaming/edit", { arena: arena });
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
    console.log(obj);
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
    console.log(req.arena);
    next();
  },

  saveArenaAndRedirect("edit")
);

router.delete("/delete/:id", async (req, res) => {
  await Gaming.findByIdAndDelete(req.params.id);
  res.redirect("/gaming");
});

function saveArenaAndRedirect(path) {
  return async (req, res) => {
    let arena = req.arena;
    arena.name = req.body.name;
    arena.location = req.body.location;
    arena.fee = req.body.fee;
    arena.players = req.body.players;
    arena.consoles = req.body.consoles;
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
module.exports = router;
