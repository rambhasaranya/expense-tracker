Expense Tracker
A full-stack expense tracking application built with React, Vite, Express, Node.js, and MongoDB Atlas. It helps users record transactions, review income and expenses, visualize spending, and manage monthly category budgets.
> **Project status:** Add your real GitHub and live deployment URLs after publishing. Do not claim a deployment is live until you have tested it.
Features
Add, view, edit, and delete transactions
Track income and expenses
Calculate total income, total expenses, and current balance
Search, filter, and sort transactions
View expense breakdown by category
Compare monthly income and expenses with charts
Set monthly budgets by category
Review budget usage and remaining amounts
Store transaction and budget data in MongoDB Atlas
Tech stack
Frontend: React, Vite, JavaScript, CSS, Recharts
Backend: Node.js, Express.js
Database: MongoDB Atlas, Mongoose
API: REST endpoints
Version control: Git and GitHub
Project structure
```text
expense-tracker/
├── backend/
│   ├── models/
│   │   ├── Expense.js
│   │   └── Budget.js
│   ├── routes/
│   │   ├── expenses.js
│   │   └── budgets.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── src/
│   ├── App.jsx
│   ├── App.css
│   └── api.js
├── package.json
└── README.md
```
Your exact folder structure may differ slightly; update this section to match your repository.
Run locally
Requirements
Node.js and npm
A MongoDB Atlas database, or another MongoDB instance
Git (optional, for version control)
1. Clone the repository
```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd expense-tracker
```
Replace `YOUR_GITHUB_REPOSITORY_URL` with your actual GitHub repository URL.
2. Install frontend dependencies
Run from the project root:
```bash
npm install
```
3. Configure the backend
```bash
cd backend
npm install
```
Create `backend/.env`:
```env
MONGODB_URI=your_mongodb_atlas_connection_string
PORT=5000
```
Replace the example database value with your own MongoDB Atlas connection string. Never commit `.env` or publish database credentials.
4. Start the backend
From the `backend` folder:
```bash
npm start
```
The backend should be available at `http://localhost:5000` unless you configure a different port.
5. Start the frontend
Open a second terminal in the project root:
```bash
npm run dev
```
Open the local URL printed by Vite, commonly `http://localhost:5173`.
API endpoints
Method	Endpoint	Purpose
GET	`/api/health`	Check backend health
GET	`/api/expenses`	Retrieve transactions
POST	`/api/expenses`	Create a transaction
PATCH	`/api/expenses/:id`	Update a transaction
DELETE	`/api/expenses/:id`	Delete a transaction
GET	`/api/budgets?month=YYYY-MM`	Retrieve budgets for a month
PUT	`/api/budgets`	Create or update a category budget
Deployment
This application needs both a frontend host and a backend host, plus a reachable MongoDB database.
Deploy the `backend` folder as a Node.js web service.
Configure `MONGODB_URI` as a private environment variable on the backend host.
Set the backend's allowed CORS origin to your deployed frontend URL if your server uses a fixed CORS origin.
Configure the frontend API base URL to the deployed backend URL. Do not leave it pointing at `localhost`.
Deploy the Vite frontend as a static site.
Test the deployed site by creating, editing, refreshing, and deleting a transaction, then verify budgets and charts.
Update this section with your actual deployed links when available:
Live app: `ADD_DEPLOYED_FRONTEND_URL`
Backend health check: `ADD_DEPLOYED_BACKEND_URL/api/health`
GitHub repository: `ADD_GITHUB_REPOSITORY_URL`
Security notes
Keep `.env` out of Git.
Do not put MongoDB credentials in frontend code.
Use host-provided environment variables for deployment secrets.
Restrict MongoDB Atlas network access as appropriate for your deployment.
Configure CORS to allow your deployed frontend origin.
Future improvements
Add authentication and user-specific transactions
Export transactions to CSV
Add recurring transactions
Add automated tests and CI
Improve accessibility and mobile usability
Author
Your Name  
B.Tech student — update this section with your preferred public profile links.