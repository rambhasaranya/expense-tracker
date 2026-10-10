
const express = require("express");
const mongoose = require("mongoose");
const Expense = require("../models/Expense");

const router = express.Router();

// Validate incoming expense data.
function validateExpense(data, partial = false) {
  const allowedFields = [
    "title",
    "amount",
    "type",
    "category",
    "date",
    "description",
  ];

  const unknownFields = Object.keys(data).filter(
    (key) => !allowedFields.includes(key)
  );

  if (unknownFields.length > 0) {
    return "Unknown field: " + unknownFields.join(", ");
  }

  if (!partial || data.title !== undefined) {
    if (
      typeof data.title !== "string" ||
      !data.title.trim()
    ) {
      return "Title is required";
    }
  }

  if (!partial || data.amount !== undefined) {
    if (
      typeof data.amount !== "number" ||
      !Number.isFinite(data.amount) ||
      data.amount < 0.01
    ) {
      return "Amount must be a number greater than 0";
    }
  }

  if (!partial || data.type !== undefined) {
    if (!["income", "expense"].includes(data.type)) {
      return "Type must be income or expense";
    }
  }

  if (!partial || data.category !== undefined) {
    if (
      typeof data.category !== "string" ||
      !data.category.trim()
    ) {
      return "Category is required";
    }
  }

  if (data.description !== undefined &&
      typeof data.description !== "string") {
    return "Description must be text";
  }

  if (data.date !== undefined &&
      (typeof data.date !== "string" ||
       data.date.trim() === "" ||
       Number.isNaN(Date.parse(data.date)))) {
    return "Date must be a valid date string";
  }

  return null;
}

// CREATE: Add a new expense or income.
router.post("/", async (req, res) => {
  try {
    const error = validateExpense(req.body);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const expense = await Expense.create(req.body);

    res.status(201).json({
      message: "Transaction created successfully",
      expense,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create transaction" });
  }
});

// READ: Get all transactions.
router.get("/", async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });

    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

// UPDATE: Edit a transaction by its MongoDB ID.
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    const error = validateExpense(req.body, true);

    if (error) {
      return res.status(400).json({ message: error });
    }

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Provide a field to update" });
    }

    const expense = await Expense.findByIdAndUpdate(
      id,
      { $set: req.body },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!expense) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({
      message: "Transaction updated successfully",
      expense,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update transaction" });
  }
});

// DELETE: Remove a transaction by its MongoDB ID.
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    const expense = await Expense.findByIdAndDelete(id);

    if (!expense) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({
      message: "Transaction deleted successfully",
      expense,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete transaction" });
  }
});

module.exports = router;
