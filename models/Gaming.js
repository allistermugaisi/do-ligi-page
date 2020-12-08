const mongoose = require("mongoose");
const slugify = require("slugify");

const gamingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      maxlength: 50,
      required: true,
    },
    location: {
      type: String,
      maxlength: 50,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    fee: {
      type: Number,
      default: 0,
    },
    players: {
      type: Number,
      maxlength: 1000,
      default: 0,
    },
    consoles: {
      type: Number,
      maxlength: 10000,
      default: 0,
    },
  },
  { timestamps: true }
);

gamingSchema.pre("validate", function (next) {
  if (this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model("Gaming", gamingSchema);
