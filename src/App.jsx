import { useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getBudgets,
  saveBudget,
} from "./api";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentMonth() {
  return getToday().slice(0, 7);
}

function getDateInputValue(value) {
  if (!value) return getToday();
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return getToday();
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function App() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Add transaction form.
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(getToday());
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [formMessage, setFormMessage] = useState("");

  // Search, filter and sorting.
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Edit transaction form.
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    amount: "",
    type: "expense",
    category: "",
    date: getToday(),
    description: "",
  });
  const [editMessage, setEditMessage] = useState("");
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Budget management.
  const [budgetMonth, setBudgetMonth] = useState(getCurrentMonth());
  const [budgets, setBudgets] = useState([]);
  const [budgetCategory, setBudgetCategory] = useState("Food");
  const [budgetLimit, setBudgetLimit] = useState("");
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [budgetError, setBudgetError] = useState("");
  const [budgetNotice, setBudgetNotice] = useState("");

  // Date-wise report filters.
  const [reportStartDate, setReportStartDate] = useState(
    `${getCurrentMonth()}-01`
  );
  const [reportEndDate, setReportEndDate] = useState(getToday());
  const [reportError, setReportError] = useState("");

  async function loadExpenses() {
    try {
      setLoading(true);
      setError("");
      const data = await getExpenses();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExpenses();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadMonthBudgets() {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(budgetMonth)) {
        setBudgetError("Choose a valid month.");
        setBudgets([]);
        return;
      }
      try {
        setBudgetLoading(true);
        setBudgetError("");
        const data = await getBudgets(budgetMonth);
        if (!cancelled) setBudgets(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          setBudgets([]);
          setBudgetError(
            `${err.message || "Failed to load budgets."} Check that Step 9.1 backend routes are installed and the server is running.`
          );
        }
      } finally {
        if (!cancelled) setBudgetLoading(false);
      }
    }
    loadMonthBudgets();
    return () => {
      cancelled = true;
    };
  }, [budgetMonth]);

  const totalIncome = expenses
    .filter((item) => item.type === "income")
    .reduce((total, item) => total + (Number(item.amount) || 0), 0);
  const totalExpenses = expenses
    .filter((item) => item.type === "expense")
    .reduce((total, item) => total + (Number(item.amount) || 0), 0);
  const balance = totalIncome - totalExpenses;

  const categories = [
    ...new Set(expenses.map((item) => item.category).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));

  const filteredExpenses = expenses
    .filter((item) => {
      const search = searchTerm.trim().toLowerCase();
      const matchesSearch =
        (item.title || "").toLowerCase().includes(search) ||
        (item.category || "").toLowerCase().includes(search) ||
        (item.description || "").toLowerCase().includes(search);
      const matchesType = typeFilter === "all" || item.type === typeFilter;
      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;
      return matchesSearch && matchesType && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "oldest") return new Date(a.date) - new Date(b.date);
      if (sortBy === "amount-high") return Number(b.amount) - Number(a.amount);
      if (sortBy === "amount-low") return Number(a.amount) - Number(b.amount);
      return new Date(b.date) - new Date(a.date);
    });

  const chartColors = [
    "#22684f",
    "#73a98a",
    "#e9b872",
    "#7c8bd1",
    "#d98273",
    "#8d79b5",
    "#59a9b2",
    "#a5a9a3",
  ];

  const categoryData = Object.values(
    expenses
      .filter((item) => item.type === "expense")
      .reduce((groups, item) => {
        const name = item.category || "Uncategorized";
        if (!groups[name]) groups[name] = { name, value: 0 };
        groups[name].value += Number(item.amount) || 0;
        return groups;
      }, {})
  ).sort((a, b) => b.value - a.value);

  const monthlyData = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(
      new Date().getFullYear(),
      new Date().getMonth() - 5 + index,
      1
    );
    const monthTransactions = expenses.filter((item) => {
      if (!item.date) return false;
      const transactionDate = new Date(item.date);
      return (
        !Number.isNaN(transactionDate.getTime()) &&
        transactionDate.getFullYear() === monthDate.getFullYear() &&
        transactionDate.getMonth() === monthDate.getMonth()
      );
    });
    return {
      month: monthDate.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      }),
      income: monthTransactions
        .filter((item) => item.type === "income")
        .reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
      expenses: monthTransactions
        .filter((item) => item.type === "expense")
        .reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    };
  });

  const largestExpenseCategory = categoryData[0] || null;
  const savingsRate =
    totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : null;

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
  }

  function formatDate(value) {
    if (!value) return "";
    const dateText = getDateInputValue(value);
    const parsedDate = new Date(`${dateText}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) return "";
    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormMessage("");
    setNotice("");
    setError("");
    if (!title.trim() || !category.trim()) {
      setFormMessage("Please enter a title and category.");
      return;
    }
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFormMessage("Please enter an amount greater than zero.");
      return;
    }
    try {
      setSaving(true);
      const newExpense = await addExpense({
        title: title.trim(),
        amount: numericAmount,
        type,
        category: category.trim(),
        date,
        description: description.trim(),
      });
      setExpenses((previous) => [newExpense, ...previous]);
      setTitle("");
      setAmount("");
      setType("expense");
      setCategory("Food");
      setDate(getToday());
      setDescription("");
      setShowForm(false);
      setNotice("Transaction added successfully!");
    } catch (err) {
      setFormMessage(err.message || "Could not save the transaction.");
    } finally {
      setSaving(false);
    }
  }

  function openAddForm() {
    setNotice("");
    setFormMessage("");
    setShowForm(true);
    setEditingId(null);
  }

  function startEditing(expense) {
    setNotice("");
    setShowForm(false);
    setEditingId(expense._id);
    setEditMessage("");
    setEditForm({
      title: expense.title || "",
      amount: String(expense.amount ?? ""),
      type: expense.type || "expense",
      category: expense.category || "",
      date: getDateInputValue(expense.date),
      description: expense.description || "",
    });
  }

  function handleEditChange(event) {
    const { name, value } = event.target;
    setEditForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleUpdate(event) {
    event.preventDefault();
    setEditMessage("");
    setNotice("");
    if (!editForm.title.trim() || !editForm.category.trim()) {
      setEditMessage("Title and category are required.");
      return;
    }
    const numericAmount = Number(editForm.amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setEditMessage("Enter an amount greater than zero.");
      return;
    }
    try {
      setUpdating(true);
      const updatedExpense = await updateExpense(editingId, {
        title: editForm.title.trim(),
        amount: numericAmount,
        type: editForm.type,
        category: editForm.category.trim(),
        date: editForm.date,
        description: editForm.description.trim(),
      });
      setExpenses((previous) =>
        previous.map((item) => (item._id === editingId ? updatedExpense : item))
      );
      setEditingId(null);
      setNotice("Transaction updated successfully!");
    } catch (err) {
      setEditMessage(err.message || "Failed to update transaction.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }
    setNotice("");
    setError("");
    setDeletingId(id);
    try {
      await deleteExpense(id);
      setExpenses((previous) => previous.filter((item) => item._id !== id));
      if (editingId === id) setEditingId(null);
      setNotice("Transaction deleted successfully!");
    } catch (err) {
      setError(err.message || "Failed to delete transaction.");
    } finally {
      setDeletingId(null);
    }
  }

  // Monthly spending totals for the selected budget month.
  const monthlyExpenseItems = expenses.filter((item) => {
    if (item.type !== "expense" || !item.date) return false;
    return getDateInputValue(item.date).slice(0, 7) === budgetMonth;
  });

  const budgetSpending = monthlyExpenseItems.reduce((groups, item) => {
    const name = item.category || "Uncategorized";
    groups[name] = (groups[name] || 0) + (Number(item.amount) || 0);
    return groups;
  }, {});

  async function handleSaveBudget(event) {
    event.preventDefault();
    setBudgetError("");
    setBudgetNotice("");
    const trimmedCategory = budgetCategory.trim();
    const numericLimit = Number(budgetLimit);
    if (!trimmedCategory) {
      setBudgetError("Enter a category for this budget.");
      return;
    }
    if (!Number.isFinite(numericLimit) || numericLimit <= 0) {
      setBudgetError("Budget limit must be greater than zero.");
      return;
    }
    try {
      setBudgetSaving(true);
      const savedBudget = await saveBudget({
        month: budgetMonth,
        category: trimmedCategory,
        limit: numericLimit,
      });
      setBudgets((previous) => {
        const exists = previous.some(
          (item) =>
            item.month === savedBudget.month &&
            item.category.toLowerCase() === savedBudget.category.toLowerCase()
        );
        return exists
          ? previous.map((item) =>
              item.month === savedBudget.month &&
              item.category.toLowerCase() === savedBudget.category.toLowerCase()
                ? savedBudget
                : item
            )
          : [...previous, savedBudget].sort((a, b) =>
              a.category.localeCompare(b.category)
            );
      });
      setBudgetLimit("");
      setBudgetCategory("Food");
      setBudgetNotice("Budget saved successfully.");
    } catch (err) {
      setBudgetError(
        `${err.message || "Failed to save budget."} Check that Step 9.1 backend routes are installed.`
      );
    } finally {
      setBudgetSaving(false);
    }
  }

  function startEditingBudget(budget) {
    setBudgetCategory(budget.category);
    setBudgetLimit(String(budget.limit));
    setBudgetNotice(`Editing ${budget.category} budget. Change the limit and save.`);
    setBudgetError("");
  }

  // Date-wise report calculations. Dates are ISO YYYY-MM-DD strings.
  const validReportRange =
    Boolean(reportStartDate) &&
    Boolean(reportEndDate) &&
    reportStartDate <= reportEndDate;

  const reportTransactions = useMemo(() => {
    if (!validReportRange) return [];
    return expenses.filter((item) => {
      if (!item.date) return false;
      const transactionDate = getDateInputValue(item.date);
      return transactionDate >= reportStartDate && transactionDate <= reportEndDate;
    });
  }, [expenses, reportStartDate, reportEndDate, validReportRange]);

  const reportIncome = reportTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const reportExpenses = reportTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const reportBalance = reportIncome - reportExpenses;

  function resetReportDates() {
    setReportStartDate(`${getCurrentMonth()}-01`);
    setReportEndDate(getToday());
    setReportError("");
  }

  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="eyebrow">YOUR PERSONAL FINANCE SPACE</p>
          <h1>Expense Tracker</h1>
          <p className="subtitle">
            Understand your spending. Take control of your money.
          </p>
        </div>
        <span className="avatar">S</span>
      </header>

      <section className="summary">
        <article className="card balance-card">
          <p>Total Balance</p>
          <h2>{formatCurrency(balance)}</h2>
          <span>Income minus expenses</span>
        </article>
        <article className="card">
          <p>Total Income</p>
          <h2>{formatCurrency(totalIncome)}</h2>
          <span>All recorded income</span>
        </article>
        <article className="card">
          <p>Total Expenses</p>
          <h2>{formatCurrency(totalExpenses)}</h2>
          <span>All recorded expenses</span>
        </article>
      </section>

      <section className="analytics">
        <div className="analytics-heading">
          <h2>Financial Analytics</h2>
          <p>Understand your spending patterns.</p>
        </div>
        <div className="analytics-grid">
          <article className="card chart-card">
            <h3>Expenses by Category</h3>
            <p className="chart-description">How your expenses are distributed.</p>
            {categoryData.length === 0 ? (
              <p className="chart-empty">Add an expense to see category analytics.</p>
            ) : (
              <>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                      >
                        {categoryData.map((item, index) => (
                          <Cell
                            key={item.name}
                            fill={chartColors[index % chartColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="category-breakdown">
                  {categoryData.map((item, index) => (
                    <div className="category-row" key={item.name}>
                      <span className="category-name">
                        <span
                          className="category-dot"
                          style={{
                            backgroundColor: chartColors[index % chartColors.length],
                          }}
                        />
                        {item.name}
                      </span>
                      <strong>{formatCurrency(item.value)}</strong>
                    </div>
                  ))}
                </div>
              </>
            )}
          </article>

          <article className="card chart-card">
            <h3>Monthly Overview</h3>
            <p className="chart-description">
              Income compared with expenses over six months.
            </p>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis
                    width={65}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) =>
                      value >= 1000 ? `₹${(value / 1000).toFixed(1)}k` : `₹${value}`
                    }
                  />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#388466" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#d98273" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </div>
        <div className="insight-grid">
          <article className="card insight-card">
            <p>Largest Expense Category</p>
            <h3>{largestExpenseCategory ? largestExpenseCategory.name : "No expenses yet"}</h3>
            <strong>{formatCurrency(largestExpenseCategory?.value || 0)}</strong>
          </article>
          <article className="card insight-card">
            <p>Income Remaining After Expenses</p>
            <h3>{savingsRate === null ? "Not available yet" : `${savingsRate.toFixed(1)}%`}</h3>
            <span>
              {savingsRate === null
                ? "Record income to calculate this percentage."
                : "Calculated from all recorded income and expenses."}
            </span>
          </article>
        </div>
      </section>

      {/* Step 9: Monthly budgets */}
      <section className="feature-section">
        <div className="section-heading">
          <div>
            <h2>Monthly Budgets</h2>
            <p>Set spending limits by category and track your progress.</p>
          </div>
        </div>
        <article className="card">
          <div className="budget-month-control">
            <label htmlFor="budget-month">Budget month</label>
            <input
              id="budget-month"
              type="month"
              value={budgetMonth}
              onChange={(event) => {
                setBudgetMonth(event.target.value);
                setBudgetNotice("");
                setBudgetError("");
              }}
              required
            />
          </div>
          <form className="budget-form" onSubmit={handleSaveBudget}>
            <div>
              <label htmlFor="budget-category">Category</label>
              <input
                id="budget-category"
                list="budget-categories"
                value={budgetCategory}
                onChange={(event) => setBudgetCategory(event.target.value)}
                placeholder="e.g. Food, Travel, Shopping"
                required
              />
              <datalist id="budget-categories">
                {categories.map((item) => (
                  <option key={item} value={item} />
                ))}
                <option value="Food" />
                <option value="Travel" />
                <option value="Shopping" />
                <option value="Bills" />
                <option value="Rent" />
                <option value="Entertainment" />
              </datalist>
            </div>
            <div>
              <label htmlFor="budget-limit">Monthly limit (₹)</label>
              <input
                id="budget-limit"
                type="number"
                min="0.01"
                step="0.01"
                value={budgetLimit}
                onChange={(event) => setBudgetLimit(event.target.value)}
                placeholder="e.g. 3000"
                required
              />
            </div>
            <button type="submit" disabled={budgetSaving || budgetLoading}>
              {budgetSaving ? "Saving..." : "Save Budget"}
            </button>
          </form>
          {budgetError && <p className="message error-message" role="alert">{budgetError}</p>}
          {budgetNotice && <p className="message success-message" role="status">{budgetNotice}</p>}
          {budgetLoading ? (
            <p className="muted">Loading budgets...</p>
          ) : budgets.length === 0 ? (
            <div className="empty-state compact-empty">
              <h3>No budgets for this month yet</h3>
              <p>Enter a category and monthly limit above to create your first budget.</p>
            </div>
          ) : (
            <div className="budget-list">
              {budgets.map((budget) => {
                const spent = budgetSpending[budget.category] || 0;
                const limit = Number(budget.limit) || 0;
                const percent = limit > 0 ? (spent / limit) * 100 : 0;
                const overBudget = spent > limit;
                const progressWidth = Math.min(percent, 100);
                return (
                  <article className="budget-item" key={`${budget.month}-${budget.category}`}>
                    <div className="budget-item-top">
                      <div>
                        <h3>{budget.category}</h3>
                        <p>{formatCurrency(spent)} spent of {formatCurrency(limit)}</p>
                      </div>
                      <button type="button" className="secondary-button" onClick={() => startEditingBudget(budget)}>
                        Edit limit
                      </button>
                    </div>
                    <div
                      className={`progress-track ${overBudget ? "progress-over" : ""}`}
                      role="progressbar"
                      aria-label={`${budget.category} budget used`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.min(Math.round(percent), 100)}
                    >
                      <div className="progress-fill" style={{ width: `${progressWidth}%` }} />
                    </div>
                    <div className="budget-item-bottom">
                      <span>{percent.toFixed(1)}% used</span>
                      <strong className={overBudget ? "over-budget-text" : ""}>
                        {overBudget
                          ? `${formatCurrency(spent - limit)} over budget`
                          : `${formatCurrency(limit - spent)} remaining`}
                      </strong>
                    </div>
                    {overBudget && (
                      <p className="budget-warning" role="status">
                        You've exceeded this category's monthly budget.
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </article>
      </section>

      {/* Step 10: Date-wise reports */}
      <section className="feature-section">
        <div className="section-heading">
          <div>
            <h2>Date-wise Reports</h2>
            <p>Choose a date range to summarize the transactions recorded in that period.</p>
          </div>
        </div>
        <article className="card">
          <div className="report-filters">
            <div>
              <label htmlFor="report-start">Start date</label>
              <input
                id="report-start"
                type="date"
                value={reportStartDate}
                max={reportEndDate || undefined}
                onChange={(event) => {
                  setReportStartDate(event.target.value);
                  setReportError("");
                }}
              />
            </div>
            <div>
              <label htmlFor="report-end">End date</label>
              <input
                id="report-end"
                type="date"
                value={reportEndDate}
                min={reportStartDate || undefined}
                max={getToday()}
                onChange={(event) => {
                  setReportEndDate(event.target.value);
                  setReportError("");
                }}
              />
            </div>
            <button type="button" className="secondary-button report-reset" onClick={resetReportDates}>
              This month
            </button>
          </div>
          {!validReportRange && (
            <p className="message error-message" role="alert">
              Start date must be on or before the end date.
            </p>
          )}
          {validReportRange && (
            <>
              <div className="report-summary">
                <article className="report-stat">
                  <span>Income in period</span>
                  <strong>{formatCurrency(reportIncome)}</strong>
                </article>
                <article className="report-stat">
                  <span>Expenses in period</span>
                  <strong>{formatCurrency(reportExpenses)}</strong>
                </article>
                <article className="report-stat">
                  <span>Net balance in period</span>
                  <strong className={reportBalance < 0 ? "over-budget-text" : ""}>
                    {formatCurrency(reportBalance)}
                  </strong>
                </article>
              </div>
              <div className="report-transactions-heading">
                <h3>Transactions in selected period</h3>
                <span>{reportTransactions.length} record(s)</span>
              </div>
              {reportTransactions.length === 0 ? (
                <div className="empty-state compact-empty">
                  <h3>No transactions in this date range</h3>
                  <p>Try another date range or add a transaction for this period.</p>
                </div>
              ) : (
                <div className="report-table-wrap">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Type</th>
                        <th className="amount-cell">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...reportTransactions]
                        .sort((a, b) => getDateInputValue(b.date).localeCompare(getDateInputValue(a.date)))
                        .map((item) => (
                          <tr key={item._id}>
                            <td>{formatDate(item.date)}</td>
                            <td>{item.title}</td>
                            <td>{item.category}</td>
                            <td>
                              <span className={`type-pill ${item.type === "income" ? "income-pill" : "expense-pill"}`}>
                                {item.type}
                              </span>
                            </td>
                            <td className="amount-cell">
                              {item.type === "income" ? "+" : "-"}{formatCurrency(item.amount)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </article>
      </section>

      {/* Add transaction form */}
      {showForm && (
        <section className="card add-transaction-form" id="add-transaction-form">
          <h2>Add a Transaction</h2>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="title">Title</label>
              <input id="title" type="text" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Lunch" required />
            </div>
            <div>
              <label htmlFor="amount">Amount (₹)</label>
              <input id="amount" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="e.g. 150" required />
            </div>
            <div>
              <label htmlFor="type">Type</label>
              <select id="type" value={type} onChange={(event) => setType(event.target.value)}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div>
              <label htmlFor="category">Category</label>
              <input id="category" type="text" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="e.g. Food, Travel, Salary" required />
            </div>
            <div>
              <label htmlFor="date">Date</label>
              <input id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
            </div>
            <div>
              <label htmlFor="description">Description (optional)</label>
              <input id="description" type="text" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add a note" />
            </div>
            <div className="form-actions">
              <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Transaction"}</button>
              <button type="button" className="secondary-button" onClick={() => { setShowForm(false); setFormMessage(""); }} disabled={saving}>Cancel</button>
            </div>
            {formMessage && <p className="message error-message" role="alert">{formMessage}</p>}
          </form>
        </section>
      )}

      {/* Transaction history */}
      <section className="transactions">
        <div className="section-heading">
          <div>
            <h2>Recent Transactions</h2>
            <p>Your latest spending activity.</p>
          </div>
          <button type="button" onClick={openAddForm}>+ Add Transaction</button>
        </div>

        <div className="transaction-tools">
          <input
            type="search"
            aria-label="Search transactions"
            placeholder="Search by title, category, or description..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <select aria-label="Filter by transaction type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="all">All types</option>
            <option value="income">Income only</option>
            <option value="expense">Expenses only</option>
          </select>
          <select aria-label="Filter by category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">All categories</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select aria-label="Sort transactions" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="amount-high">Amount: high to low</option>
            <option value="amount-low">Amount: low to high</option>
          </select>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setSearchTerm("");
              setTypeFilter("all");
              setCategoryFilter("all");
              setSortBy("newest");
            }}
          >
            Reset filters
          </button>
        </div>

        <p className="results-count">Showing {filteredExpenses.length} of {expenses.length} transactions</p>
        {notice && <p className="message success-message" role="status">{notice}</p>}
        {error && (
          <div className="message error-message" role="alert">
            <p>Error: {error}</p>
            <button type="button" className="secondary-button" onClick={loadExpenses}>Try Again</button>
          </div>
        )}
        {loading && <p className="muted">Loading transactions...</p>}
        {!loading && !error && expenses.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">₹</div>
            <h3>No transactions found</h3>
            <p>Your saved transactions will appear here.</p>
            <button type="button" onClick={openAddForm}>Add Your First Transaction</button>
          </div>
        )}
        {!loading && !error && expenses.length > 0 && filteredExpenses.length === 0 && (
          <div className="empty-state">
            <h3>No matching transactions</h3>
            <p>Try another search term or reset your filters.</p>
            <button type="button" onClick={() => {
              setSearchTerm("");
              setTypeFilter("all");
              setCategoryFilter("all");
              setSortBy("newest");
            }}>Clear Filters</button>
          </div>
        )}
        {!loading && !error && filteredExpenses.length > 0 && (
          <div className="transaction-list">
            {filteredExpenses.map((expense) => (
              <article className="card transaction-card" key={expense._id}>
                {editingId === expense._id ? (
                  <form className="edit-form" onSubmit={handleUpdate}>
                    <h3>Edit Transaction</h3>
                    <div className="edit-grid">
                      <div>
                        <label htmlFor={`edit-title-${expense._id}`}>Title</label>
                        <input id={`edit-title-${expense._id}`} name="title" value={editForm.title} onChange={handleEditChange} required />
                      </div>
                      <div>
                        <label htmlFor={`edit-amount-${expense._id}`}>Amount (₹)</label>
                        <input id={`edit-amount-${expense._id}`} name="amount" type="number" min="0.01" step="0.01" value={editForm.amount} onChange={handleEditChange} required />
                      </div>
                      <div>
                        <label htmlFor={`edit-type-${expense._id}`}>Type</label>
                        <select id={`edit-type-${expense._id}`} name="type" value={editForm.type} onChange={handleEditChange}>
                          <option value="expense">Expense</option>
                          <option value="income">Income</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor={`edit-category-${expense._id}`}>Category</label>
                        <input id={`edit-category-${expense._id}`} name="category" value={editForm.category} onChange={handleEditChange} required />
                      </div>
                      <div>
                        <label htmlFor={`edit-date-${expense._id}`}>Date</label>
                        <input id={`edit-date-${expense._id}`} name="date" type="date" value={editForm.date} onChange={handleEditChange} required />
                      </div>
                      <div>
                        <label htmlFor={`edit-description-${expense._id}`}>Description</label>
                        <input id={`edit-description-${expense._id}`} name="description" value={editForm.description} onChange={handleEditChange} />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button type="submit" disabled={updating}>{updating ? "Saving..." : "Save Changes"}</button>
                      <button type="button" className="secondary-button" onClick={() => { setEditingId(null); setEditMessage(""); }} disabled={updating}>Cancel</button>
                    </div>
                    {editMessage && <p className="message error-message" role="alert">{editMessage}</p>}
                  </form>
                ) : (
                  <>
                    <div className="transaction-main">
                      <h3>{expense.title}</h3>
                      <p>{expense.category}</p>
                      {expense.date && <small>{formatDate(expense.date)}</small>}
                      {expense.description && <p>{expense.description}</p>}
                    </div>
                    <div className="transaction-side">
                      <strong className={expense.type === "income" ? "income-amount" : "expense-amount"}>
                        {expense.type === "income" ? "+" : "-"}{formatCurrency(Number(expense.amount))}
                      </strong>
                      <p>{expense.type}</p>
                      <button type="button" className="secondary-button" onClick={() => startEditing(expense)} disabled={deletingId === expense._id}>Edit</button>
                      <button type="button" className="danger-button" onClick={() => handleDelete(expense._id)} disabled={deletingId === expense._id}>
                        {deletingId === expense._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <footer>Expense Tracker · Learning project</footer>
    </main>
  );
}

export default App;
