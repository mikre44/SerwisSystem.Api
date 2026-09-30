# SerwisSystem.Client

Staff web app for SerwisSystem: workers and admins log in here to manage repairs,
users and permissions. React 19 + Vite, Bootstrap 5 for styling.

## Prerequisites

- Node.js 22+
- The API running locally (see the [root README](../../README.md))

## Setup

```bash
npm ci
npm run dev
```

The dev server prints its own URL; Vite defaults to `http://localhost:5173`
(or the next free port if it's taken).

The app calls the API at `http://localhost:5000/api` by default. If a
`VITE_API_URL` environment variable is read from `.env`, set it there instead
of editing source.

## Scripts

- `npm run dev` — start the Vite dev server with hot reload
- `npm run build` — production build into `dist/`
- `npm run lint` — ESLint, must pass with 0 errors
- `npm run preview` — serve the built `dist/` locally
