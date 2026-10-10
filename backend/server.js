
require("dotenv").config();
const budgetRoutes = require("./routes/budgets");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const expenseRoutes = require("./routes/expenses");
require("./models/Expense");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/expenses", expenseRoutes);
app.use("/api/budgets", budgetRoutes);
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

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
