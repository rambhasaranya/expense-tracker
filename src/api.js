// Uses the local backend during development and the deployed 
// backend when VITE_API_URL is configured in Vercel.
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+\$/, '');

const API_URL = `${API_BASE_URL}/expenses`;
const BUDGETS_URL = `${API_BASE_URL}/budgets`;

export async function getExpenses() {
  const response = await fetch(API_URL);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch transactions.');
  }
  return data;
}

export async function addExpense(expense) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to add transaction.');
  }
  return data.expense;
}

export async function updateExpense(id, updates) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update transaction.');
  }
  return data.expense;
}

export async function deleteExpense(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete transaction.');
  }
  return data;
}

export async function getBudgets(month) {
  const response = await fetch(`${BUDGETS_URL}?month=${encodeURIComponent(month)}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to load budgets.');
  }
  return data;
}

export async function saveBudget(budget) {
  const response = await fetch(BUDGETS_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(budget),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to save budget.');
  }
  return data.budget;
}
