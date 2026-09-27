const app = document.getElementById("app");
const toastEl = document.getElementById("toast");

const seedTransactions = [
  { id: 1, name: "Monthly Salary", category: "Income", date: "2026-09-01", amount: 35000, type: "income", status: "Completed", note: "September salary" },
  { id: 2, name: "Rent", category: "Housing", date: "2026-09-02", amount: -8500, type: "expense", status: "Completed", note: "Monthly rent" },
  { id: 3, name: "Groceries", category: "Food", date: "2026-09-05", amount: -2450, type: "expense", status: "Completed", note: "Weekly groceries" },
  { id: 4, name: "Internet Bill", category: "Bills", date: "2026-09-07", amount: -1699, type: "expense", status: "Completed", note: "Home internet" },
  { id: 5, name: "Freelance Project", category: "Income", date: "2026-09-10", amount: 6000, type: "income", status: "Completed", note: "Web design project" },
  { id: 6, name: "Transportation", category: "Transport", date: "2026-09-12", amount: -980, type: "expense", status: "Completed", note: "Commute" },
  { id: 7, name: "Coffee & Snacks", category: "Food", date: "2026-09-15", amount: -720, type: "expense", status: "Completed", note: "Coffee and snacks" },
  { id: 8, name: "Streaming", category: "Entertainment", date: "2026-09-18", amount: -599, type: "expense", status: "Completed", note: "Subscription" },
  { id: 9, name: "Electricity", category: "Bills", date: "2026-09-20", amount: -2240, type: "expense", status: "Pending", note: "Electricity bill" }
];

const seedBudgets = [
  { id: 1, name: "Food & Dining", category: "Food", limit: 8000 },
  { id: 2, name: "Transportation", category: "Transport", limit: 4000 },
  { id: 3, name: "Bills & Utilities", category: "Bills", limit: 7000 },
  { id: 4, name: "Entertainment", category: "Entertainment", limit: 3000 },
  { id: 5, name: "Shopping", category: "Shopping", limit: 5000 },
  { id: 6, name: "Personal", category: "Personal", limit: 3000 },
  { id: 7, name: "Housing", category: "Housing", limit: 12000 }
];

function getData(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch { return fallback; }
}
function saveData(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

let transactions = getData("zewealth_transactions", seedTransactions);
let budgets = getData("zewealth_budgets", seedBudgets);

function budgetCategory(name) {
  const map = {
    "Food & Dining": "Food",
    "Transportation": "Transport",
    "Bills & Utilities": "Bills",
    "Entertainment": "Entertainment",
    "Shopping": "Shopping",
    "Personal": "Personal",
    "Housing": "Housing"
  };
  return map[name] || name;
}

// Migrate budgets created by the first version of the frontend.
budgets = budgets.map(b => ({ ...b, category: b.category || budgetCategory(b.name) }));
let charts = {};

function money(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 }).format(Math.abs(Number(value) || 0));
}
function dateText(date) {
  if (!date) return "—";
  return new Date(date + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}
function initials(name = "CD") { return name.trim().split(/\s+/).map(x => x[0]).join("").slice(0, 2).toUpperCase(); }
function showToast(message) {
  toastEl.textContent = message; toastEl.classList.add("show"); clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toastEl.classList.remove("show"), 2200);
}
function route() { return location.hash.replace("#/", "") || "landing"; }
function go(page) { location.hash = `/${page}`; }
function clearCharts() { Object.values(charts).forEach(c => c?.destroy()); charts = {}; }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c])); }
function escapeAttr(value) { return escapeHtml(value); }
function svgIcon(name) {
  return { dashboard:"▣", transactions:"▤", budget:"▥", reports:"◧", profile:"♙", logout:"↪", menu:"☰", bell:"♢", edit:"✎", trash:"×" }[name] || "•";
}

// Every expense is recalculated from the transaction list.
// This keeps Dashboard -> Transactions -> Budgets synchronized automatically.
function syncBudgets() {
  budgets = budgets.map(b => ({
    ...b,
    spent: transactions.filter(t => t.type === "expense" && t.category === b.category).reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
  }));
  saveData("zewealth_budgets", budgets);
}

function getTotals() {
  const income = transactions.filter(t => t.type === "income").reduce((s,t)=>s+Math.abs(Number(t.amount)),0);
  const expenses = transactions.filter(t => t.type === "expense").reduce((s,t)=>s+Math.abs(Number(t.amount)),0);
  return { income, expenses, balance: income - expenses, savingsRate: income ? ((income-expenses)/income)*100 : 0 };
}

function landingPage() {
  return `<div class="landing">
    <nav class="landing-nav"><div class="logo">Ze<span>Wealth</span></div><div class="nav-actions"><button class="btn btn-ghost" onclick="go('login')">Sign in</button><button class="btn btn-outline" onclick="go('register')">Get started</button></div></nav>
    <section class="hero"><div class="hero-inner"><div class="eyebrow">MASTER YOUR MONEY MOVES</div><h1>Mo' Money<br><em>Less Problem.</em></h1><p>Track, manage, and achieve your financial goals with confidence because money management doesn't have to be boring.</p><div class="hero-buttons"><button class="btn btn-primary" onclick="go('register')">Argent</button><button class="btn btn-outline" onclick="go('login')">Log In</button></div></div></section>
    <section class="feature-section"><div class="container"><div class="section-heading"><h2>A Dashboard Aged to Perfection.</h2><p>Every financial instrument elegantly organized inside a secure, high-fidelity experience modeled after the finest assets.</p></div><div class="features">
      ${[["↗","Expense Tracking","Track flow elegantly with categorized and predictive spending guides."],["▥","Budget Planning","Establish reserves for high-value acquisitions and structural equity."],["◔","Analytic Dashboard","Observe matrices and liquidity changes mapped on charts."],["✓","Stay organized","Keep your transactions categorized and easy to find."]].map(x=>`<div class="feature-card"><div class="feature-icon">${x[0]}</div><h3>${x[1]}</h3><p>${x[2]}</p></div>`).join("")}
    </div></div></section><section class="quote-section"><blockquote><i>“Wealth, like fine wine, requires patience, precise curation, and the proper environment to mature.”</i></blockquote><cite>THE ZEWEALTH PHILOSOPHY</cite></section></div>`;
}

function authPage(type) {
  const login = type === "login";
  return `<div class="auth-shell"><div class="auth-card"><div class="logo">Ze<span>Wealth</span></div><h1>${login?"Welcome back.":"Create your account."}</h1><p class="sub">${login?"Sign in to continue to your financial dashboard.":"Start organizing your money in one simple place."}</p>
    ${!login?`<div class="form-group"><label>FULL NAME</label><input id="authName" class="form-control" placeholder="Your full name"></div>`:""}
    <div class="form-group"><label>EMAIL ADDRESS</label><input id="authEmail" class="form-control" type="email" placeholder="you@example.com"></div>
    <div class="form-group"><label>PASSWORD</label><input id="authPassword" class="form-control" type="password" placeholder="••••••••"></div>
    ${!login?`<div class="form-group"><label>CONFIRM PASSWORD</label><input id="authConfirm" class="form-control" type="password" placeholder="••••••••"></div>`:""}
    <button class="btn btn-primary" onclick="submitAuth('${type}')">${login?"Sign in":"Create account"}</button>
    <div class="auth-footer">${login?`Don't have an account? <a href="#/register">Create one</a>`:`Already have an account? <a href="#/login">Sign in</a>`}</div><div class="auth-footer"><a href="#/">← Back to ZeWealth</a></div>
  </div></div>`;
}

function submitAuth(type) {
  const email = document.getElementById("authEmail")?.value.trim().toLowerCase();
  const password = document.getElementById("authPassword")?.value;
  if (!email || !password) return showToast("Please fill in your email and password.");
  if (type === "register") {
    const name = document.getElementById("authName")?.value.trim();
    const confirm = document.getElementById("authConfirm")?.value;
    if (!name) return showToast("Please enter your name.");
    if (password.length < 6) return showToast("Password must be at least 6 characters.");
    if (password !== confirm) return showToast("Passwords do not match.");
    saveData("zewealth_user", { name, email, password });
    showToast("Account created.");
  } else {
    const user = getData("zewealth_user", null);
    if (user && user.email !== email) return showToast("Email does not match the registered account.");
    if (user?.password && user.password !== password) return showToast("Incorrect password.");
    saveData("zewealth_user", { name:user?.name||"Czeckiah Dollizon", email, password:user?.password||password });
    showToast("Welcome back.");
  }
  setTimeout(()=>go("dashboard"), 350);
}

function shell(page, content) {
  syncBudgets();
  const labels={dashboard:"Dashboard",transactions:"Transactions",add:"Add Transaction",edit:"Edit Transaction",budget:"Budgets",reports:"Reports",profile:"Profile & Settings"};
  const user=getData("zewealth_user",{name:"Czeckiah Dollizon",email:"czeckiah@example.com"});
  return `<div class="app-shell"><aside class="sidebar" id="sidebar"><div class="logo">Ze<span>Wealth</span></div><div class="sidebar-section-title">Overview</div>
    <button class="nav-item ${page==="dashboard"?"active":""}" onclick="go('dashboard')"><span class="nav-icon">${svgIcon("dashboard")}</span>Dashboard</button>
    <button class="nav-item ${["transactions","add","edit"].includes(page)?"active":""}" onclick="go('transactions')"><span class="nav-icon">${svgIcon("transactions")}</span>Transactions</button>
    <button class="nav-item ${page==="budget"?"active":""}" onclick="go('budget')"><span class="nav-icon">${svgIcon("budget")}</span>Budgets</button>
    <button class="nav-item ${page==="reports"?"active":""}" onclick="go('reports')"><span class="nav-icon">${svgIcon("reports")}</span>Reports</button>
    <div class="sidebar-section-title">Account</div><button class="nav-item ${page==="profile"?"active":""}" onclick="go('profile')"><span class="nav-icon">${svgIcon("profile")}</span>Profile & Settings</button>
    <div class="sidebar-bottom"><button class="nav-item" onclick="logout()"><span class="nav-icon">${svgIcon("logout")}</span>Sign out</button><div class="user-mini"><div class="avatar">${initials(user.name)}</div><div><strong>${escapeHtml(user.name)}</strong><small>${escapeHtml(user.email)}</small></div></div></div>
  </aside><main class="main"><header class="topbar"><div style="display:flex;align-items:center;gap:10px"><button class="icon-btn mobile-menu" onclick="document.getElementById('sidebar').classList.toggle('open')">${svgIcon("menu")}</button><div><h1 class="page-title">${labels[page]}</h1><p class="page-subtitle">${page==="dashboard"?`Your premium portfolio is performing optimally.`:`Review and manage your ZeWealth records.`}</p></div></div><div class="top-actions"><input class="form-control top-search" placeholder="Search ledger..." oninput="globalSearch(this.value)"><button class="icon-btn hide-mobile" onclick="showToast('No new notifications.')">${svgIcon("bell")}</button><div class="avatar top-avatar">${initials(user.name)}</div>${page!="add"&&page!="edit"?`<button class="btn btn-primary hide-mobile" onclick="go('add')">+ Add Transaction</button>`:""}</div></header><section class="content">${content}</section></main></div>`;
}

function globalSearch(value){
  if(route()!=="transactions" || !document.getElementById("txSearch")) return;
  document.getElementById("txSearch").value=value; renderTransactionRows();
}

function dashboardPage(){
  const t=getTotals(); syncBudgets();
  const recent=transactions.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);
  return shell("dashboard", `<div class="welcome-row"><div><h2>Good Day, ${escapeHtml((getData("zewealth_user",{name:"Czeckiah"}).name||"Czeckiah").split(" ")[0])}.</h2><p>Your premium portfolio is performing optimally.</p></div></div>
    <div class="grid-kpi"><div class="card kpi"><div class="kpi-label">Current balance</div><div class="kpi-value">${money(t.balance)}</div><div class="kpi-foot positive">${t.income?((t.balance/t.income)*100).toFixed(1):0}% retained</div></div><div class="card kpi"><div class="kpi-label">Monthly income</div><div class="kpi-value">${money(t.income)}</div><div class="kpi-foot positive">${transactions.filter(x=>x.type==="income").length} income entries</div></div><div class="card kpi"><div class="kpi-label">Monthly expenses</div><div class="kpi-value">${money(t.expenses)}</div><div class="kpi-foot">${transactions.filter(x=>x.type==="expense").length} expense entries</div></div><div class="card kpi"><div class="kpi-label">Savings secured</div><div class="kpi-value">${money(t.balance)}</div><div class="kpi-foot positive">${t.savingsRate.toFixed(1)}% savings rate</div></div></div>
    <div class="dashboard-grid"><div class="card"><div class="card-header"><h3>Income vs Expenses Trend</h3><span class="mini-legend"><i class="income-dot"></i>Income <i class="expense-dot"></i>Expenses</span></div><div class="card-body"><div class="chart-wrap"><canvas id="cashFlowChart"></canvas></div></div></div><div class="card"><div class="card-header"><h3>Expense Allocation</h3></div><div class="card-body"><div class="chart-wrap"><canvas id="categoryChart"></canvas></div></div></div></div>
    <div class="card table-card"><div class="card-header"><h3>Acquisition & Vault Ledger</h3><button class="btn btn-outline" onclick="exportLedger()">Export All Ledgers</button></div>${transactionTable(recent,false)}</div>`);
}

function transactionTable(rows, actions=true){
  return `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Category</th><th>Description / Asset Title</th><th>Amount</th><th>Status</th>${actions?"<th>Actions</th>":""}</tr></thead><tbody>${rows.length?rows.map(t=>`<tr><td>${dateText(t.date)}</td><td><span class="category-pill">${escapeHtml(t.category)}</span></td><td><div class="tx-name">${escapeHtml(t.name)}</div><div class="tx-meta">${escapeHtml(t.note||"")}</div></td><td class="${t.amount>=0?"amount-positive":"amount-negative"}">${t.amount>=0?"+":"-"}${money(t.amount)}</td><td><span class="badge ${t.status==="Pending"?"warning":"success"}">${t.status}</span></td>${actions?`<td class="actions"><button class="icon-btn" onclick="go('edit?id=${t.id}')">✎</button><button class="icon-btn danger-icon" onclick="confirmDelete(${t.id})">×</button></td>`:""}</tr>`).join(""):`<tr><td colspan="6" class="empty">No transactions found.</td></tr>`}</tbody></table></div>`;
}

function transactionsPage(){
  return shell("transactions", `<div class="card table-card"><div class="card-header"><h3>Acquisition & Vault Ledger</h3><div class="table-tools"><select id="txCategory" class="form-control" onchange="renderTransactionRows()"><option value="all">Category: All</option>${[...new Set(transactions.map(t=>t.category))].map(c=>`<option>${escapeHtml(c)}</option>`).join("")}</select><select id="txSort" class="form-control" onchange="renderTransactionRows()"><option value="new">Sort: Newest</option><option value="old">Sort: Oldest</option><option value="high">Amount: High</option><option value="low">Amount: Low</option></select><button class="btn btn-outline" onclick="document.getElementById('csvFileInput').click()">Import CSV</button><input id="csvFileInput" type="file" accept=".csv,text/csv" style="display:none" onchange="importTransactionsCSV(this.files[0]);this.value=''" /><button class="btn btn-outline" onclick="exportLedger()">Export CSV</button><button class="btn btn-primary" onclick="go('add')">+ Add Transaction</button></div></div><div class="ledger-search-row"><input id="txSearch" class="form-control search" placeholder="Search ledger..." oninput="renderTransactionRows()"><select id="txType" class="form-control" onchange="renderTransactionRows()"><option value="all">All types</option><option value="income">Income</option><option value="expense">Expense</option></select></div><div id="transactionRows"></div></div>`);
}

function renderTransactionRows(){
  const q=(document.getElementById("txSearch")?.value||"").toLowerCase(); const type=document.getElementById("txType")?.value||"all"; const cat=document.getElementById("txCategory")?.value||"all"; const sort=document.getElementById("txSort")?.value||"new";
  let rows=transactions.filter(t=>(type==="all"||t.type===type)&&(cat==="all"||t.category===cat)&&`${t.name} ${t.category} ${t.note}`.toLowerCase().includes(q));
  rows.sort((a,b)=>sort==="old"?a.date.localeCompare(b.date):sort==="high"?Math.abs(b.amount)-Math.abs(a.amount):sort==="low"?Math.abs(a.amount)-Math.abs(b.amount):b.date.localeCompare(a.date));
  const el=document.getElementById("transactionRows"); if(el) el.innerHTML=transactionTable(rows,true);
}

function addPage(editId=null){
  const t=editId?transactions.find(x=>x.id===Number(editId)):null; const editing=!!t;
  return shell(editing?"edit":"add", `<div class="form-layout"><div class="card form-card"><h3>${editing?"Edit transaction":"New transaction"}</h3><div class="two-col"><div class="form-group"><label>TRANSACTION NAME</label><input id="fName" class="form-control" value="${escapeAttr(t?.name||"")}" placeholder="e.g. Atelier Monthly Distribution"></div><div class="form-group"><label>TYPE</label><select id="fType" class="form-control"><option value="expense" ${t?.type==="expense"?"selected":""}>Expense</option><option value="income" ${t?.type==="income"?"selected":""}>Income</option></select></div><div class="form-group"><label>CATEGORY</label><select id="fCategory" class="form-control">${["Income","Food","Housing","Bills","Transport","Entertainment","Shopping","Personal","Security Vault","Luxury Curation","Alternative Yield","Estate Yield","Other"].map(c=>`<option ${t?.category===c?"selected":""}>${c}</option>`).join("")}</select></div><div class="form-group"><label>AMOUNT (PHP)</label><input id="fAmount" class="form-control" type="number" min="0" step="0.01" value="${t?Math.abs(t.amount):""}" placeholder="0.00" oninput="updatePreview()"></div><div class="form-group"><label>DATE</label><input id="fDate" class="form-control" type="date" value="${t?.date||new Date().toISOString().slice(0,10)}" oninput="updatePreview()"></div><div class="form-group"><label>STATUS</label><select id="fStatus" class="form-control"><option ${t?.status!=="Pending"?"selected":""}>Completed</option><option ${t?.status==="Pending"?"selected":""}>Pending</option></select></div></div><div class="form-group"><label>NOTE</label><textarea id="fNote" class="form-control" rows="4" placeholder="Optional note...">${escapeHtml(t?.note||"")}</textarea></div><div class="form-actions"><button class="btn btn-ghost" onclick="go('transactions')">Cancel</button>${editing?`<button class="btn btn-danger" onclick="confirmDelete(${t.id})">Delete</button>`:""}<button class="btn btn-primary" onclick="saveTransaction(${editing?t.id:"null"})">${editing?"Save changes":"Add transaction"}</button></div></div><div class="preview" id="preview"><small>TRANSACTION PREVIEW</small><h2 id="pAmount">${t?`${t.amount>=0?"+":"-"}${money(t.amount)}`:money(0)}</h2><div class="preview-row"><span>Name</span><strong id="pName">${escapeHtml(t?.name||"New transaction")}</strong></div><div class="preview-row"><span>Category</span><strong id="pCategory">${escapeHtml(t?.category||"Food")}</strong></div><div class="preview-row"><span>Date</span><strong id="pDate">${dateText(t?.date||new Date().toISOString().slice(0,10))}</strong></div></div></div>`);
}
function updatePreview(){const amount=Number(document.getElementById("fAmount")?.value||0),type=document.getElementById("fType")?.value,name=document.getElementById("fName")?.value||"New transaction",category=document.getElementById("fCategory")?.value||"Food",date=document.getElementById("fDate")?.value||new Date().toISOString().slice(0,10); if(document.getElementById("pAmount")){document.getElementById("pAmount").textContent=`${type==="income"?"+":"-"}${money(amount)}`;document.getElementById("pName").textContent=name;document.getElementById("pCategory").textContent=category;document.getElementById("pDate").textContent=dateText(date);}}
function saveTransaction(id){
  const name=document.getElementById("fName").value.trim(),type=document.getElementById("fType").value,category=document.getElementById("fCategory").value,amount=Number(document.getElementById("fAmount").value),date=document.getElementById("fDate").value,status=document.getElementById("fStatus").value,note=document.getElementById("fNote").value.trim();
  if(!name||!amount||!date)return showToast("Please complete the required fields.");
  if(type==="income" && category!=="Income") { /* income is allowed in any descriptive category, but Income is the default */ }
  const record={id:id?Number(id):Date.now(),name,type,category,amount:type==="income"?amount:-amount,date,status,note};
  if(id)transactions=transactions.map(t=>t.id===Number(id)?record:t);else transactions.push(record);
  saveData("zewealth_transactions",transactions); syncBudgets(); const hasBudget=type!=="expense" || budgets.some(b=>b.category===category); showToast(id?(hasBudget?"Transaction updated. Budget recalculated.":"Transaction updated. No budget exists for this category."):(hasBudget?"Transaction added. Budget recalculated.":"Transaction added. Create a budget for this category to track it.")); setTimeout(()=>go("transactions"),350);
}
function confirmDelete(id){const b=document.createElement("div");b.className="modal-backdrop";b.innerHTML=`<div class="modal"><h3>Delete transaction?</h3><p>This transaction will be removed from the ledger and its category budget will be recalculated automatically.</p><div class="modal-actions"><button class="btn btn-ghost" onclick="this.closest('.modal-backdrop').remove()">Cancel</button><button class="btn btn-danger" onclick="deleteTransaction(${id});this.closest('.modal-backdrop').remove()">Delete</button></div></div>`;document.body.appendChild(b);}
function deleteTransaction(id){const before=transactions.length;transactions=transactions.filter(t=>Number(t.id)!==Number(id));if(transactions.length===before)return showToast("Transaction could not be found.");saveData("zewealth_transactions",transactions);syncBudgets();showToast("Transaction deleted and budgets updated.");render();}

function budgetPage(){
  syncBudgets(); const totalBudget=budgets.reduce((s,b)=>s+Number(b.limit),0),totalSpent=budgets.reduce((s,b)=>s+Number(b.spent),0);
  return shell("budget", `<div class="grid-kpi"><div class="card kpi"><div class="kpi-label">Monthly budget</div><div class="kpi-value">${money(totalBudget)}</div><div class="kpi-foot">Across all categories</div></div><div class="card kpi"><div class="kpi-label">Spent</div><div class="kpi-value">${money(totalSpent)}</div><div class="kpi-foot">${totalBudget?((totalSpent/totalBudget)*100).toFixed(1):0}% used</div></div><div class="card kpi"><div class="kpi-label">Remaining</div><div class="kpi-value">${money(Math.max(0,totalBudget-totalSpent))}</div><div class="kpi-foot positive">Available to spend</div></div><div class="card kpi"><div class="kpi-label">Categories</div><div class="kpi-value">${budgets.length}</div><div class="kpi-foot">Active budgets</div></div></div><div class="card table-card" style="margin-bottom:15px"><div class="card-header"><div><h3>Budget overview</h3><p class="budget-helper">Monthly budget = your spending limit. Transactions increase <strong>Spent</strong> and reduce <strong>Remaining</strong>. Tracking starts fresh each month.</p></div><button class="btn btn-primary" onclick="openBudgetModal()">+ Add budget</button></div><div class="budget-grid" style="padding:18px">${budgets.map(b=>{const pct=Math.min(100,b.limit?(b.spent/b.limit)*100:0),cls=pct>=90?"danger":pct>=70?"warning":"";return `<div class="card budget-card"><div class="budget-top"><div><div class="budget-name">${escapeHtml(b.name)}</div><div class="budget-amount">${money(b.spent)} of ${money(b.limit)}</div></div><div class="budget-actions"><button class="icon-btn" title="Edit budget" onclick="openBudgetModal(${b.id})">✎</button><button class="icon-btn danger-icon" title="Delete budget" onclick="confirmDeleteBudget(${b.id})">×</button></div></div><div class="progress"><div class="progress-bar ${cls}" style="width:${pct}%"></div></div><div class="progress-foot"><span>${pct.toFixed(0)}% used</span><span>${money(Math.max(0,b.limit-b.spent))} left</span></div></div>`;}).join("")}</div></div><div class="card"><div class="card-header"><h3>Spending analytics</h3></div><div class="card-body"><div class="chart-wrap"><canvas id="budgetChart"></canvas></div></div></div>`);
}
function openBudgetModal(id=null){const b=id?budgets.find(x=>x.id===Number(id)):null;const modal=document.createElement("div");modal.className="modal-backdrop";modal.innerHTML=`<div class="modal"><h3>${b?"Edit budget":"Add budget"}</h3><div class="form-group"><label>BUDGET NAME</label><input id="bName" class="form-control" value="${escapeAttr(b?.name||"")}" placeholder="e.g. Food & Dining"></div><div class="form-group"><label>CATEGORY</label><select id="bCategory" class="form-control">${["Food","Housing","Bills","Transport","Entertainment","Shopping","Personal","Security Vault","Luxury Curation","Alternative Yield","Estate Yield","Other"].map(c=>`<option ${b?.category===c?"selected":""}>${c}</option>`).join("")}</select></div><div class="form-group"><label>MONTHLY LIMIT (PHP)</label><input id="bLimit" class="form-control" type="number" min="0" value="${b?.limit||""}"></div><div class="modal-actions"><button class="btn btn-ghost" onclick="this.closest('.modal-backdrop').remove()">Cancel</button><button class="btn btn-primary" onclick="saveBudget(${id||"null"});this.closest('.modal-backdrop').remove()">Save budget</button></div></div>`;document.body.appendChild(modal);}
function saveBudget(id){const name=document.getElementById("bName").value.trim(),category=document.getElementById("bCategory").value,limit=Number(document.getElementById("bLimit").value);if(!name||!limit)return showToast("Enter a budget name and limit.");if(id)budgets=budgets.map(b=>b.id===Number(id)?{...b,name,category,limit}:b);else budgets.push({id:Date.now(),name,category,limit,spent:0});syncBudgets();showToast("Budget saved.");render();}
function confirmDeleteBudget(id){const b=budgets.find(x=>Number(x.id)===Number(id));if(!b)return showToast("Budget could not be found.");const modal=document.createElement("div");modal.className="modal-backdrop";modal.innerHTML=`<div class="modal"><h3>Delete budget?</h3><p>Delete <strong>${escapeHtml(b.name)}</strong>? Its transaction records will stay in your ledger, but this budget card and its limit will be removed.</p><div class="modal-actions"><button class="btn btn-ghost" onclick="this.closest('.modal-backdrop').remove()">Cancel</button><button class="btn btn-danger" onclick="deleteBudget(${b.id})">Delete budget</button></div></div>`;document.body.appendChild(modal);}
function deleteBudget(id){const before=budgets.length;budgets=budgets.filter(b=>Number(b.id)!==Number(id));if(budgets.length===before)return showToast("Budget could not be found.");saveData("zewealth_budgets",budgets);showToast("Budget deleted.");document.querySelector(".modal-backdrop")?.remove();render();}

function profilePage(){
  const user=getData("zewealth_user",{name:"Czeckiah Dollizon",email:"czeckiah@example.com",password:""}); const dark=localStorage.getItem("zewealth_dark")==="true";
  return shell("profile", `<div class="profile-grid"><div class="card profile-card"><div class="profile-avatar">${initials(user.name)}</div><h2>${escapeHtml(user.name)}</h2><p>${escapeHtml(user.email)}</p><button class="btn btn-primary" onclick="openProfileModal()">Edit profile</button></div><div class="card settings-card"><h3 style="font:600 15px Inter;margin-bottom:4px">Settings</h3><p style="font-size:10px;color:var(--muted)">Your account preferences are saved immediately in this demo.</p><div class="setting"><div><strong>Notifications</strong><span>Receive updates about budgets and activity.</span></div><label class="switch"><input type="checkbox" ${getData("zewealth_notifications",true)?"checked":""} onchange="savePreference('zewealth_notifications',this.checked)"><span class="slider"></span></label></div><div class="setting"><div><strong>Budget alerts</strong><span>Notify when spending approaches a budget limit.</span></div><label class="switch"><input type="checkbox" ${getData("zewealth_budget_alerts",true)?"checked":""} onchange="savePreference('zewealth_budget_alerts',this.checked)"><span class="slider"></span></label></div><div class="setting"><div><strong>Dark theme</strong><span>Use the dark visual style for the dashboard.</span></div><label class="switch"><input type="checkbox" ${dark?"checked":""} onchange="toggleTheme(this.checked)"><span class="slider"></span></label></div><div class="setting"><div><strong>Password & security</strong><span>Change your password from the profile editor.</span></div><button class="btn btn-outline" onclick="openProfileModal('password')">Change password</button></div></div></div>`);
}
function openProfileModal(mode="profile"){
  const user=getData("zewealth_user",{name:"Czeckiah Dollizon",email:"czeckiah@example.com",password:""}); const passwordOnly=mode==="password"; const modal=document.createElement("div");modal.className="modal-backdrop";
  modal.innerHTML=`<div class="modal profile-edit-modal"><h3>${passwordOnly?"Change password":"Edit profile"}</h3>${passwordOnly?`<div class="form-group"><label>CURRENT PASSWORD</label><input id="currentPass" class="form-control" type="password"></div><div class="form-group"><label>NEW PASSWORD</label><input id="newPass" class="form-control" type="password"></div><div class="form-group"><label>CONFIRM NEW PASSWORD</label><input id="confirmPass" class="form-control" type="password"></div>`:`<div class="form-group"><label>FULL NAME</label><input id="editName" class="form-control" value="${escapeAttr(user.name)}"></div><div class="form-group"><label>EMAIL ADDRESS</label><input id="editEmail" class="form-control" type="email" value="${escapeAttr(user.email)}"></div><hr class="modal-rule"><div class="form-group"><label>CURRENT PASSWORD</label><input id="currentPass" class="form-control" type="password" placeholder="Required to change account details"></div><div class="form-group"><label>NEW PASSWORD (OPTIONAL)</label><input id="newPass" class="form-control" type="password" placeholder="Leave blank to keep current password"></div><div class="form-group"><label>CONFIRM NEW PASSWORD</label><input id="confirmPass" class="form-control" type="password"></div>`}<div class="modal-actions"><button class="btn btn-ghost" onclick="this.closest('.modal-backdrop').remove()">Cancel</button><button class="btn btn-primary" onclick="saveProfile(${passwordOnly})">Save changes</button></div></div>`;
  document.body.appendChild(modal);
}
function saveProfile(passwordOnly){const user=getData("zewealth_user",null);if(!user)return showToast("No account found.");const current=document.getElementById("currentPass").value;if(user.password&&current!==user.password)return showToast("Current password is incorrect.");const newPass=document.getElementById("newPass").value;const confirm=document.getElementById("confirmPass").value;if(newPass&&newPass.length<6)return showToast("New password must be at least 6 characters.");if(newPass!==confirm)return showToast("New passwords do not match.");if(!passwordOnly){const name=document.getElementById("editName").value.trim(),email=document.getElementById("editEmail").value.trim().toLowerCase();if(!name||!email)return showToast("Name and email are required.");user.name=name;user.email=email;}if(newPass)user.password=newPass;saveData("zewealth_user",user);document.querySelector(".modal-backdrop")?.remove();showToast("Account settings updated.");render();}
function savePreference(key,value){saveData(key,value);showToast("Setting updated.");}
function toggleTheme(on){document.body.classList.toggle("dark",on);saveData("zewealth_dark",on);showToast(on?"Dark theme enabled.":"Light theme enabled.");}
function logout(){showToast("Signed out.");setTimeout(()=>go("landing"),350);}
function csvEscape(value){return `"${String(value ?? "").replace(/"/g,'""')}"`;}
function exportLedger(){const header=["ID","Date","Category","Description","Amount","Type","Status","Note"];const rows=transactions.map(t=>[t.id,t.date,t.category,t.name,t.amount,t.type,t.status,t.note||""]);const csv=[header,...rows].map(r=>r.map(csvEscape).join(",")).join("\n");const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`zewealth-transactions-${new Date().toISOString().slice(0,10)}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);showToast("Transactions exported to CSV.");}
function parseCSV(text){const rows=[];let row=[],cell="",quoted=false;for(let i=0;i<text.length;i++){const ch=text[i],next=text[i+1];if(quoted){if(ch==='"'&&next==='"'){cell+='"';i++;}else if(ch==='"'){quoted=false;}else cell+=ch;}else{if(ch==='"')quoted=true;else if(ch===','){row.push(cell);cell="";}else if(ch==='\n'){row.push(cell);rows.push(row);row=[];cell="";}else if(ch==='\r'){}else cell+=ch;}}if(cell.length||row.length){row.push(cell);rows.push(row);}return rows.filter(r=>r.some(v=>String(v).trim()!==""));}
async function importTransactionsCSV(file){if(!file)return;try{const text=await file.text();const rows=parseCSV(text);if(rows.length<2)throw new Error("The CSV has no transaction rows.");const headers=rows[0].map(h=>String(h).trim().toLowerCase());const idx=name=>headers.indexOf(name);const required=["date","category","description","amount","type","status"];const missing=required.filter(h=>idx(h)<0);if(missing.length)throw new Error(`Missing column(s): ${missing.join(", ")}`);const imported=[];for(let i=1;i<rows.length;i++){const r=rows[i];const name=String(r[idx("description")]||"").trim();const date=String(r[idx("date")]||"").trim();const category=String(r[idx("category")]||"Other").trim()||"Other";const type=String(r[idx("type")]||"").trim().toLowerCase();const status=String(r[idx("status")]||"Completed").trim()||"Completed";const amount=Number(String(r[idx("amount")]||"").replace(/₱|,/g,""));if(!name||!date||!Number.isFinite(amount)||(type!=="income"&&type!=="expense"))continue;const noteIndex=idx("note");const idIndex=idx("id");const importedId=idIndex>=0?Number(r[idIndex]):NaN;imported.push({id:Number.isFinite(importedId)&&importedId?importedId:Date.now()+i,name,category,date,amount:type==="expense"?-Math.abs(amount):Math.abs(amount),type,status,note:noteIndex>=0?String(r[noteIndex]||""):""});}if(!imported.length)throw new Error("No valid transactions were found.");const mode=confirm(`Import ${imported.length} transaction(s)?\n\nOK = add to your existing data\nCancel = stop`);if(!mode)return;const existingIds=new Set(transactions.map(t=>Number(t.id)));for(const t of imported){if(existingIds.has(Number(t.id)))t.id=Date.now()+Math.floor(Math.random()*1000000);transactions.push(t);}saveData("zewealth_transactions",transactions);syncBudgets();showToast(`${imported.length} transaction(s) imported.`);render();}catch(err){showToast(err.message||"Could not import CSV.");}}

function reportsPage(){syncBudgets();const t=getTotals();const cats={};transactions.filter(x=>x.type==="expense").forEach(x=>cats[x.category]=(cats[x.category]||0)+Math.abs(x.amount));return shell("reports",`<div class="grid-kpi"><div class="card kpi"><div class="kpi-label">Income</div><div class="kpi-value">${money(t.income)}</div></div><div class="card kpi"><div class="kpi-label">Expenses</div><div class="kpi-value">${money(t.expenses)}</div></div><div class="card kpi"><div class="kpi-label">Net cash flow</div><div class="kpi-value">${money(t.balance)}</div></div><div class="card kpi"><div class="kpi-label">Top expense</div><div class="kpi-value" style="font-size:18px">${escapeHtml(Object.entries(cats).sort((a,b)=>b[1]-a[1])[0]?.[0]||"—")}</div></div></div><div class="card"><div class="card-header"><h3>Expense report</h3></div><div class="card-body"><div class="chart-wrap"><canvas id="reportChart"></canvas></div></div></div>`);}

function isDarkTheme(){return document.body.classList.contains("dark");}
function chartTextColor(){return isDarkTheme()?"#e9e3e4":"#665e61";}
function chartGridColor(){return isDarkTheme()?"#3a3436":"#eee7e5";}

function initCharts(){
  clearCharts();
  const ctx1=document.getElementById("cashFlowChart");
  if(ctx1){const latest=transactions.reduce((d,t)=>t.date>d?t.date:d,""),base=latest?new Date(latest+"T00:00:00"):new Date(),months=[];for(let i=5;i>=0;i--){const d=new Date(base.getFullYear(),base.getMonth()-i,1);months.push(d.toLocaleDateString("en-US",{month:"short"}));}const income=months.map((_,i)=>{const d=new Date(base.getFullYear(),base.getMonth()-(5-i),1);return transactions.filter(t=>t.type==="income"&&new Date(t.date).getFullYear()===d.getFullYear()&&new Date(t.date).getMonth()===d.getMonth()).reduce((s,t)=>s+Math.abs(t.amount),0)});const expenses=months.map((_,i)=>{const d=new Date(base.getFullYear(),base.getMonth()-(5-i),1);return transactions.filter(t=>t.type==="expense"&&new Date(t.date).getFullYear()===d.getFullYear()&&new Date(t.date).getMonth()===d.getMonth()).reduce((s,t)=>s+Math.abs(t.amount),0)});charts.cash=new Chart(ctx1,{type:"line",data:{labels:months,datasets:[{label:"Income",data:income,borderColor:"#c99636",backgroundColor:"transparent",tension:.35,pointRadius:2},{label:"Expenses",data:expenses,borderColor:"#65101a",backgroundColor:"transparent",tension:.35,pointRadius:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"top",align:"end",labels:{boxWidth:6,font:{size:10},color:chartTextColor()}}},scales:{y:{beginAtZero:true,ticks:{font:{size:10},color:chartTextColor(),callback:v=>"₱"+(v/1000).toFixed(0)+"k"},grid:{color:chartGridColor()}},x:{grid:{display:false},ticks:{font:{size:10},color:chartTextColor()}}}}});}
  const ctx2=document.getElementById("categoryChart");if(ctx2){const cats={};transactions.filter(t=>t.type==="expense").forEach(t=>cats[t.category]=(cats[t.category]||0)+Math.abs(t.amount));charts.category=new Chart(ctx2,{type:"doughnut",data:{labels:Object.keys(cats),datasets:[{data:Object.values(cats),backgroundColor:["#68101a","#b68b38","#9e7b7f","#47373a","#d7c4c6","#8c666b"],borderWidth:2,borderColor:isDarkTheme()?"#211e1f":"#fff"}]},options:{responsive:true,maintainAspectRatio:false,cutout:"68%",plugins:{legend:{position:"right",labels:{boxWidth:8,font:{size:10},color:chartTextColor()}}}}});}
  const ctx3=document.getElementById("budgetChart");if(ctx3){charts.budget=new Chart(ctx3,{type:"bar",data:{labels:budgets.map(b=>b.name),datasets:[{label:"Spent",data:budgets.map(b=>b.spent),backgroundColor:"#7a1520",borderRadius:4},{label:"Limit",data:budgets.map(b=>b.limit),backgroundColor:"#dfd2d4",borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{boxWidth:8,font:{size:10},color:chartTextColor()}}},scales:{y:{beginAtZero:true,ticks:{font:{size:9},callback:v=>"₱"+(v/1000).toFixed(0)+"k"}},x:{grid:{display:false},ticks:{font:{size:10},color:chartTextColor()}}}}});}
  const ctx4=document.getElementById("reportChart");if(ctx4){const cats={};transactions.filter(t=>t.type==="expense").forEach(t=>cats[t.category]=(cats[t.category]||0)+Math.abs(t.amount));charts.report=new Chart(ctx4,{type:"bar",data:{labels:Object.keys(cats),datasets:[{label:"Expenses",data:Object.values(cats),backgroundColor:"#7a1520",borderRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true},x:{grid:{display:false}}}}});}
}

function render(){
  clearCharts(); const r=route();
  if(r==="landing")app.innerHTML=landingPage();else if(r==="login")app.innerHTML=authPage("login");else if(r==="register")app.innerHTML=authPage("register");else if(r==="dashboard")app.innerHTML=dashboardPage();else if(r==="transactions")app.innerHTML=transactionsPage();else if(r==="add")app.innerHTML=addPage();else if(r.startsWith("edit"))app.innerHTML=addPage(new URLSearchParams(location.hash.split("?")[1]||"").get("id"));else if(r==="budget")app.innerHTML=budgetPage();else if(r==="reports")app.innerHTML=reportsPage();else if(r==="profile")app.innerHTML=profilePage();else app.innerHTML=landingPage();
  document.body.classList.toggle("dark",getData("zewealth_dark",false));
  if(["dashboard","budget","reports"].includes(r))setTimeout(initCharts,0);if(r==="transactions")renderTransactionRows();if(r==="add"||r.startsWith("edit"))setTimeout(updatePreview,0);
}
window.addEventListener("hashchange",render);window.addEventListener("load",render);
