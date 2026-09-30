# SerwisSystem.Customer

The public part of SerwisSystem: a React (Vite) app customers use to report
a device repair and later check its status. It requires no login and talks
only to the anonymous, rate-limited endpoints of the SerwisSystem API
(`POST /api/repairs`, `POST /api/repairs/check`, `GET /api/products`).

## Getting started

```bash
npm ci
npm run dev
```

The dev server runs at http://localhost:5174.

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
