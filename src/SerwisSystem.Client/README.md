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

The dev server always runs on `http://localhost:5173` (`vite.config.js` sets
`strictPort: true`): if that port is already taken, Vite fails to start
instead of picking another one — the API's CORS policy only allows this exact
origin (see the root README).

The app calls the API at `http://localhost:5000/api` by default. To use
another address, set `VITE_API_URL` in a `.env` file next to `package.json`
(e.g. `VITE_API_URL=http://localhost:5080/api`) instead of editing source.
Vite reads it when the dev server starts or the app is built.

## Scripts

- `npm run dev` — start the Vite dev server with hot reload
- `npm run build` — production build into `dist/`
- `npm run lint` — ESLint, must pass with 0 errors
- `npm run preview` — serve the built `dist/` locally
