const form = document.querySelector("#transaction-form");
const titleInput = document.querySelector("#title");
const amountInput = document.querySelector("#amount");
const typeInput = document.querySelector("#type");
const categoryInput = document.querySelector("#category");
const dateInput = document.querySelector("#date");

const balanceElement = document.querySelector("#balance");
const incomeElement = document.querySelector("#income");
const expensesElement = document.querySelector("#expenses");
const transactionList = document.querySelector("#transaction-list");
const transactionCount = document.querySelector("#transaction-count");
const showingLabel = document.querySelector("#showing-label");
const searchInput = document.querySelector("#search");
const filterInput = document.querySelector("#filter");
const clearAllButton = document.querySelector("#clear-all");
const formMessage = document.querySelector("#form-message");
const todayLabel = document.querySelector("#today-label");

const STORAGE_KEY = "myWalletTransactions";

const BUDGET_KEY = "myWalletMonthlyBudget";

const expenseChart = document.querySelector("#expense-chart");
const budgetForm = document.querySelector("#budget-form");
const budgetInput = document.querySelector("#budget-limit");
const budgetSpent = document.querySelector("#budget-spent");
const budgetRemaining = document.querySelector("#budget-remaining");
const budgetProgress = document.querySelector("#budget-progress");
const budgetProgressFill = document.querySelector("#budget-progress-fill");
const budgetMessage = document.querySelector("#budget-message");

let monthlyBudget = loadBudget();

function loadBudget() {
  try {
    const saved = Number(localStorage.getItem(BUDGET_KEY));
    return Number.isFinite(saved) && saved > 0 ? saved : 0;
  } catch {
    return 0;
  }
}

let transactions = loadTransactions();

const categorySymbols = {
  Food: "🍜",
  Transport: "🚌",
  Shopping: "🛍️",
  Education: "📚",
  Bills: "🧾",
  Health: "💚",
  Salary: "💼",
  Freelance: "💻",
  Other: "✦"
};

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

dateInput.value = localDateString();
todayLabel.textContent = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short"
}).format(new Date());

function loadTransactions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) =>
      item &&
      typeof item.id === "string" &&
      typeof item.title === "string" &&
      Number.isFinite(item.amount) &&
      item.amount > 0 &&
      (item.type === "income" || item.type === "expense") &&
      typeof item.category === "string" &&
      typeof item.date === "string"
    );
  } catch (error) {
    console.error("Could not load saved transactions:", error);
    return [];
  }
}

function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    return true;
  } catch (error) {
    console.error("Could not save transactions:", error);
    formMessage.textContent = "Could not save data. Check browser storage settings.";
    return false;
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function formatDate(dateString) {
  const parts = dateString.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return dateString;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function updateSummary() {
  const income = transactions
    .filter((item) => item.type === "income")
    .reduce((total, item) => total + item.amount, 0);

  const expenses = transactions
    .filter((item) => item.type === "expense")
    .reduce((total, item) => total + item.amount, 0);

  balanceElement.textContent = formatCurrency(income - expenses);
  incomeElement.textContent = formatCurrency(income);
  expensesElement.textContent = formatCurrency(expenses);
}

function createTransactionElement(transaction) {
  const item = document.createElement("article");
  item.className = "transaction-item";

  const icon = document.createElement("div");
  icon.className = `category-icon ${transaction.type}`;
  icon.textContent = transaction.type === "income"
    ? "↙"
    : (categorySymbols[transaction.category] || "✦");
  icon.setAttribute("aria-hidden", "true");

  const info = document.createElement("div");
  info.className = "transaction-info";

  const title = document.createElement("div");
  title.className = "transaction-title";
  title.textContent = transaction.title;

  const meta = document.createElement("div");
  meta.className = "transaction-meta";
  meta.textContent = `${transaction.category} · ${formatDate(transaction.date)}`;

  info.append(title, meta);

  const right = document.createElement("div");
  right.className = "transaction-right";

  const amount = document.createElement("span");
  amount.className = `transaction-amount ${transaction.type}`;
  amount.textContent = `${transaction.type === "income" ? "+" : "−"}${formatCurrency(transaction.amount)}`;

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-button";
  deleteButton.textContent = "×";
  deleteButton.setAttribute("aria-label", `Delete ${transaction.title}`);
  deleteButton.title = "Delete transaction";
  deleteButton.addEventListener("click", () => deleteTransaction(transaction.id));

  right.append(amount, deleteButton);
  item.append(icon, info, right);
  return item;
}

function renderTransactions() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedType = filterInput.value;

  const filtered = transactions
    .filter((item) => selectedType === "all" || item.type === selectedType)
    .filter((item) =>
      item.title.toLowerCase().includes(searchTerm) ||
      item.category.toLowerCase().includes(searchTerm)
    )
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

  transactionList.replaceChildren();

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";

    const icon = document.createElement("div");
    icon.className = "empty-icon";
    icon.textContent = "↗";

    const heading = document.createElement("h3");
    heading.textContent = transactions.length === 0
      ? "No transactions yet"
      : "No matching transactions";

    const message = document.createElement("p");
    message.textContent = transactions.length === 0
      ? "Add your first transaction to see it here."
      : "Try another search term or filter.";

    empty.append(icon, heading, message);
    transactionList.append(empty);
  } else {
    filtered.forEach((transaction) => {
      transactionList.append(createTransactionElement(transaction));
    });
  }

  transactionCount.textContent = `${transactions.length} ${transactions.length === 1 ? "item" : "items"}`;
  showingLabel.textContent = `Showing ${filtered.length} of ${transactions.length} transactions`;
  clearAllButton.disabled = transactions.length === 0;
  clearAllButton.style.opacity = transactions.length === 0 ? "0.45" : "1";
}


function renderExpenseChart() {
  expenseChart.replaceChildren();

  const now = new Date();
  const months = [];

  // Build the current month and the previous five months.
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

    months.push({
      key: `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("en-IN", {
        month: "short"
      }).format(date),
      total: 0
    });
  }

  transactions.forEach((transaction) => {
    if (transaction.type !== "expense") return;

    const monthKey = transaction.date.slice(0, 7);
    const month = months.find((item) => item.key === monthKey);

    if (month) month.total += transaction.amount;
  });

  const maxExpense = Math.max(...months.map((m) => m.total), 1);

  months.forEach((month) => {
    const column = document.createElement("div");
    column.className = "chart-column";

    const value = document.createElement("span");
    value.className = "chart-value";
    value.textContent = month.total === 0
      ? "₹0"
      : `₹${Number(month.total.toFixed(0)).toLocaleString("en-IN")}`;

    const track = document.createElement("div");
    track.className = "chart-bar-track";

    const bar = document.createElement("div");
    bar.className = "chart-bar";

    const height = month.total === 0
      ? 0
      : Math.max((month.total / maxExpense) * 100, 4);

    bar.style.height = `${height}%`;
    bar.title = `${month.label}: ${formatCurrency(month.total)}`;

    track.append(bar);

    const label = document.createElement("span");
    label.className = "chart-month";
    label.textContent = month.label;

    column.append(value, track, label);
    expenseChart.append(column);
  });
}

function renderBudget() {
  const now = new Date();
  const currentMonth = localDateString().slice(0, 7);

  const spent = transactions
    .filter((item) =>
      item.type === "expense" &&
      item.date.slice(0, 7) === currentMonth
    )
    .reduce((total, item) => total + item.amount, 0);

  budgetSpent.textContent = formatCurrency(spent);

  if (monthlyBudget <= 0) {
    budgetRemaining.textContent = "Not set";
    budgetProgressFill.style.width = "0%";
    budgetProgressFill.classList.remove("over-budget");
    budgetProgress.setAttribute("aria-valuenow", "0");
    budgetMessage.textContent = "Set a budget to start tracking.";
    return;
  }

  const remaining = monthlyBudget - spent;
  const percentage = (spent / monthlyBudget) * 100;
  const barPercentage = Math.min(percentage, 100);

  budgetRemaining.textContent = formatCurrency(remaining);
  budgetProgressFill.style.width = `${barPercentage}%`;
  budgetProgressFill.classList.toggle(
    "over-budget",
    percentage > 100
  );

  budgetProgress.setAttribute(
    "aria-valuenow",
    String(Math.round(barPercentage))
  );

  if (percentage > 100) {
    budgetMessage.textContent =
      `You've exceeded your budget by ${formatCurrency(spent - monthlyBudget)}.`;
  } else if (percentage >= 80) {
    budgetMessage.textContent =
      `You've used ${percentage.toFixed(0)}% of your budget. Keep an eye on spending.`;
  } else {
    budgetMessage.textContent =
      `You've used ${percentage.toFixed(0)}% of your monthly budget.`;
  }
}

budgetForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const amount = Number(budgetInput.value);

  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) {
    budgetMessage.textContent = "Enter a valid budget greater than ₹0.";
    return;
  }

  monthlyBudget = amount;

  try {
    localStorage.setItem(BUDGET_KEY, String(monthlyBudget));
    budgetMessage.textContent = "Your monthly budget has been saved.";
    renderBudget();
  } catch (error) {
    budgetMessage.textContent =
      "Could not save your budget in browser storage.";
  }
});

if (monthlyBudget > 0) {
  budgetInput.value = monthlyBudget;
}



function renderApp() {
  updateSummary();
  renderTransactions();
  renderExpenseChart();
  renderBudget();
}


function deleteTransaction(id) {
  const transaction = transactions.find((item) => item.id === id);
  if (!transaction) return;

  transactions = transactions.filter((item) => item.id !== id);
  saveTransactions();
  renderApp();
  formMessage.textContent = "Transaction deleted.";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const amount = Number(amountInput.value);
  const type = typeInput.value;
  const category = categoryInput.value;
  const date = dateInput.value;

  if (!title) {
    formMessage.textContent = "Please enter a transaction name.";
    titleInput.focus();
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) {
    formMessage.textContent = "Enter an amount greater than ₹0 and within the allowed limit.";
    amountInput.focus();
    return;
  }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    formMessage.textContent = "Please choose a valid date.";
    dateInput.focus();
    return;
  }

  const transaction = {
    id: (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    amount,
    type,
    category,
    date,
    createdAt: Date.now()
  };

  transactions.push(transaction);
  saveTransactions();
  renderApp();

  form.reset();
  dateInput.value = localDateString();
  typeInput.value = "expense";
  formMessage.textContent = "Transaction added successfully!";
  titleInput.focus();
});

searchInput.addEventListener("input", renderTransactions);
filterInput.addEventListener("change", renderTransactions);

clearAllButton.addEventListener("click", () => {
  if (transactions.length === 0) return;

  const confirmed = window.confirm(
    "Delete all transactions? This cannot be undone."
  );

  if (!confirmed) return;

  transactions = [];
  saveTransactions();
  renderApp();
  formMessage.textContent = "All transactions cleared.";
});

renderApp();

document.querySelector("#export-csv").addEventListener("click", () => {
  if (transactions.length === 0) {
    alert("There are no transactions to export.");
    return;
  }

  const headers = ["Name", "Amount", "Type", "Category", "Date"];

  // Escape special characters so names containing commas work in CSV.
  const escapeCSV = (value) =>
    `"${String(value).replace(/"/g, '""')}"`;

  const rows = transactions.map((item) => [
    item.title,
    item.amount.toFixed(2),
    item.type,
    item.category,
    item.date
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCSV).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "my-wallet-transactions.csv";
  link.click();

  URL.revokeObjectURL(url);
});

const themeToggle = document.querySelector("#theme-toggle");

function applyTheme(isDark) {
  document.body.classList.toggle("dark-theme", isDark);
  themeToggle.textContent = isDark ? "☀ Light mode" : "☾ Dark mode";
  themeToggle.setAttribute("aria-pressed", String(isDark));
}

let darkMode = localStorage.getItem("myWalletTheme") === "dark";
applyTheme(darkMode);

themeToggle.addEventListener("click", () => {
  darkMode = !darkMode;
  applyTheme(darkMode);

  try {
    localStorage.setItem("myWalletTheme", darkMode ? "dark" : "light");
  } catch (error) {
    console.error("Could not save theme preference:", error);
  }
});
