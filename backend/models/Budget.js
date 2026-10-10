
const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    month: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    limit: {
      type: Number,
      required: true,
      min: 0.01,
    },
  },
  { timestamps: true }
);

// One budget per category for each month.
budgetSchema.index(
  { month: 1, category: 1 },
  { unique: true }
);

module.exports = mongoose.model("Budget", budgetSchema);
