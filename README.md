# test-manager-library-3145556-app

Operations frontend for *Manager Library* in React (T-22): login, catalog, members, loans, returns, overdue list, most-borrowed report.

## Run

```powershell
npm install
npm run dev        # http://localhost:5173, expects the API at http://localhost:8000/api/v1
```

Override the API base with `VITE_API_URL`. The token is kept in `localStorage`; admin-only views (report, book creation, covers) unlock with the admin role.

## Fair walkthrough

Login → search the catalog → create a member → lend 1–3 books → open the loan → return a line → check overdue → run the report.
