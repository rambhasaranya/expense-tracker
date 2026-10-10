
const express = require("express");
const Budget = require("../models/Budget");

const router = express.Router();

// Get all budgets for a selected month.
router.get("/", async (req, res) => {
  try {
    const { month } = req.query;

    if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return res.status(400).json({
        message: "A valid month in YYYY-MM format is required.",
      });
    }

    const budgets = await Budget.find({ month }).sort({ category: 1 });

    res.json(budgets);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch budgets.",
    });
  }
});

// Create a budget or update the existing category budget.
router.put("/", async (req, res) => {
  try {
    const { month, category, limit } = req.body;

    if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return res.status(400).json({
        message: "A valid month in YYYY-MM format is required.",
      });
    }

    if (typeof category !== "string" || !category.trim()) {
      return res.status(400).json({
        message: "Category is required.",
      });
    }

    if (
      limit === "" ||
      limit === null ||
      typeof limit === "boolean" ||
      !Number.isFinite(Number(limit)) ||
      Number(limit) <= 0
    ) {
      return res.status(400).json({
        message: "Budget limit must be greater than zero.",
      });
    }

    const budget = await Budget.findOneAndUpdate(
      { month, category: category.trim() },
      { $set: { limit: Number(limit) } },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json({
      message: "Budget saved successfully.",
      budget,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A budget for this category and month already exists. Try again.",
      });
    }

    res.status(500).json({
      message: "Failed to save budget.",
    });
  }
});

module.exports = router;
