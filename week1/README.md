# Week 1 - Compliance & Policy Dashboard (Frontend)

This is a Vite + React + TypeScript dashboard scaffold for Week 1. It provides a modern layout with a sidebar, topbar, and KPI cards.

## Prerequisites
- Node.js 18+

## Getting started
```bash
cd week1
npm install
npm run dev
```
Open http://localhost:5173

## Build
```bash
npm run build
npm run preview
```

## Test
```bash
npm test -- --run
```

## Structure
- `src/components/` basic UI components (Sidebar, Topbar, Card)
- `src/pages/Dashboard.tsx` example dashboard view
- `src/styles.css` basic dark theme styling

## Next steps
- Wire this UI to a backend API (auth, policies, audits, compliance scores)
- Add routing and state management as needed (React Router, Zustand, etc.)
- Add E2E tests (Playwright/Cypress)
