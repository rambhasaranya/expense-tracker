
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const budgetRoutes = require("./routes/budgets");
const expenseRoutes = require("./routes/expenses");
require("./models/Expense");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Reuse the MongoDB connection between serverless invocations.
let connectionPromise;

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing");
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGODB_URI)
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }

  await connectionPromise;
}

async function ensureDatabase(req, res, next) {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error("Database connection failed:", error.message);
    res.status(500).json({
      message: "Database connection failed. Check server configuration.",
    });
  }
}

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Expense Tracker API is running",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

app.use("/api/expenses", ensureDatabase, expenseRoutes);
app.use("/api/budgets", ensureDatabase, budgetRoutes);

// Run a normal HTTP server locally, but export the app for Vercel.
if (require.main === module) {
  connectToDatabase()
    .then(() => {
      console.log("MongoDB connected successfully");

      app.listen(PORT, () => {
        console.log(`Backend running at http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.error("Database connection failed:", error.message);
      process.exit(1);
    });
}

module.exports = app;
