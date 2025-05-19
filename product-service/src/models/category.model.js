// product-service/src/models/category.model.js

const mongoose = require("mongoose");
const slugify = require("slugify");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    ancestors: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
        },
        name: String,
        slug: String,
      },
    ],
    level: {
      type: Number,
      default: 0,
      min: 0,
    },
    image: {
      type: String,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    seo: {
      title: String,
      description: String,
      keywords: [String],
    },
    filters: [
      {
        name: String,
        values: [String],
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Middleware to create/update slug before saving
categorySchema.pre("save", function (next) {
  if (this.isModified("name") || !this.slug) {
    this.slug = slugify(this.name, { lower: true });
  }
  next();
});

// Virtual for products in this category
categorySchema.virtual("products", {
  ref: "Product",
  localField: "_id",
  foreignField: "category",
});

// Method to update ancestors array
categorySchema.methods.updateAncestors = async function () {
  if (!this.parent) {
    this.ancestors = [];
    this.level = 0;
    return;
  }

  const parent = await this.constructor.findById(this.parent);
  if (!parent) throw new Error("Parent category not found");

  this.ancestors = [
    ...parent.ancestors,
    {
      _id: parent._id,
      name: parent.name,
      slug: parent.slug,
    },
  ];

  this.level = parent.level + 1;
};

// Middleware to update ancestors when parent changes
categorySchema.pre("save", async function (next) {
  if (this.isModified("parent")) {
    await this.updateAncestors();
  }
  next();
});

// Indexes
categorySchema.index({ name: 1 });
categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ parent: 1 });
categorySchema.index({ "ancestors._id": 1 });
categorySchema.index({ level: 1 });
categorySchema.index({ order: 1 });
categorySchema.index({ isActive: 1, isVisible: 1 });
categorySchema.index({ isFeatured: 1 });

// Text index for search
categorySchema.index({
  name: "text",
  description: "text",
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
