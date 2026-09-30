# SerwisSystem.Customer

The public part of SerwisSystem: a React (Vite) app customers use to report
a device repair and later check its status. It requires no login and talks
only to anonymous endpoints of the SerwisSystem API: `POST /api/repairs` and
`POST /api/repairs/check` (both rate-limited per IP), and `GET /api/products`
(not rate-limited).

## Getting started

```bash
npm ci
npm run dev
```

The dev server always runs at `http://localhost:5174` (`vite.config.js` sets
`strictPort: true`): if that port is already taken, Vite fails to start
instead of picking another one — the API's CORS policy only allows this exact
origin (see the root README).

## Configuration

The API base URL (including the `/api` path) is read from the
`VITE_API_URL` environment variable, e.g. in a `.env.local` file:

```
VITE_API_URL=http://localhost:5000/api
```

If unset, it defaults to `http://localhost:5000/api`, which matches the
API's default dev port.

## Scripts

- `npm run dev` -- start the dev server
- `npm run build` -- production build
- `npm run lint` -- run ESLint
- `npm run preview` -- preview the production build locally
