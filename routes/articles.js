const express = require("express");
const Article = require("./../models/Articles");
const { ensureAdminAuthenticated } = require("../middleware/auth");
const router = express.Router();

router.get("/", async (req, res) => {
  const articles = await Article.find().sort({ createdAt: "desc" });
  res.render("articles/index", { articles: articles });
});

router.get("/new", ensureAdminAuthenticated, (req, res) => {
  if (req.user.isAdmin) {
    res.render("articles/new", { article: new Article() });
  } else {
    req.flash("error_msg", "You are not admin and can't perform that action!");
    res.redirect("/admin/login");
  }
});

router.get("/edit/:id", ensureAdminAuthenticated, async (req, res) => {
  if (req.user.isAdmin) {
    const article = await Article.findById(req.params.id);
    res.render("articles/edit", { article: article });
  } else {
    req.flash("error_msg", "You are not admin and can't perform that action!");
    res.redirect("/admin/login");
  }
});

router.get("/:slug", async (req, res) => {
  const article = await Article.findOne({ slug: req.params.slug });
  if (article == null) res.redirect("/");
  res.render("articles/show", { article: article });
});

router.post(
  "/",
  async (req, res, next) => {
    req.article = new Article();
    next();
  },
  saveArticleAndRedirect("new")
);

router.put(
  "/:id",
  async (req, res, next) => {
    req.article = await Article.findById(req.params.id);
    next();
  },
  saveArticleAndRedirect("edit")
);

router.delete("/:id", ensureAdminAuthenticated, async (req, res) => {
  if (req.user.isAdmin) {
    await Article.findByIdAndDelete(req.params.id);
    res.redirect("/");
  } else {
    req.flash("error_msg", "You are not admin and can't perform that action!");
    res.redirect("/admin/login");
  }
});

function saveArticleAndRedirect(path) {
  return async (req, res) => {
    let article = req.article;
    article.title = req.body.title;
    article.description = req.body.description;
    article.markdown = req.body.markdown;
    (article.author.id = req.user._id),
      (article.author.username = req.user.username);
    try {
      article = await article.save();
      res.redirect(`/articles/${article.slug}`);
    } catch (e) {
      res.render(`articles/${path}`, { article: article });
    }
  };
}

module.exports = router;
