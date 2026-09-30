# SerwisSystem

A repair-service management system for interactive-monitor/whiteboard hardware,
made up of three apps:

- **SerwisSystem.Api** — ASP.NET Core 10 Web API, EF Core + PostgreSQL. Owns
  authentication, users/permissions, the product catalogue and the repair workflow.
- **SerwisSystem.Client** — staff web app (React + Vite). Workers and admins
  manage repairs, users and permissions here.
- **SerwisSystem.Customer** — public web app (React + Vite) where customers
  submit a repair request and check its status.

UI text in both frontends is in Polish; the codebase (code, comments, docs) is in English.

## Repository layout

```
SerwisSystem.Api/               (repo root)
├── SerwisSystem.slnx
├── src/
│   ├── SerwisSystem.Api/       ASP.NET Core Web API
│   ├── SerwisSystem.Client/    staff app (React + Vite)
│   └── SerwisSystem.Customer/  customer app (React + Vite)
└── tests/
    └── SerwisSystem.Api.Tests/ integration tests (WebApplicationFactory)
```

## Prerequisites

- .NET SDK 10
- Node.js 22+
- PostgreSQL 17 (or compatible)
- EF Core CLI: `dotnet tool install --global dotnet-ef`

## Setup

### 1. Configure secrets

The API reads its configuration from environment variables or .NET user-secrets.
Real secrets must never be committed to `appsettings*.json`.

```bash
cd src/SerwisSystem.Api
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=SerwisSystem;Username=postgres;Password=<your-password>;Ssl Mode=Disable;GSS Encryption Mode=Disable"
dotnet user-secrets set "Jwt:Key" "<a random string, 64+ characters>"
dotnet user-secrets set "Email:SmtpHost" "smtp.example.com"
dotnet user-secrets set "Email:SmtpPort" "587"
dotnet user-secrets set "Email:Username" "<smtp-username>"
dotnet user-secrets set "Email:Password" "<smtp-password>"
dotnet user-secrets set "Email:FromEmail" "no-reply@example.com"
dotnet user-secrets set "FirstAdmin:Username" "admin"
dotnet user-secrets set "FirstAdmin:Email" "admin@example.com"
dotnet user-secrets set "FirstAdmin:Password" "<a strong password>"
```

The same keys work as environment variables (used in CI and Docker), with `:`
replaced by `__`, e.g. `ConnectionStrings__DefaultConnection`, `Jwt__Key`.

Notes:
- `Jwt:Issuer` (`SerwisSystem.Api`) and `Jwt:Audience` (`SerwisSystem`) are
  **not** secrets — they already have values in `appsettings.json` and are
  validated at startup. Only `Jwt:Key` needs to be supplied; it must be at
  least 32 characters (HMAC-SHA256), the app refuses to start otherwise.
- `FirstAdmin:*` is only used once, at startup: if the database has no admin
  yet, all three values are configured, and there are no pending EF Core
  migrations, that account is created as the first admin. If any value is
  missing, or a migration is still pending, nothing is seeded and a warning
  is logged instead — there is no `create-first-admin` endpoint.
- `Email:*` is optional for local development: if it is missing, or sending
  fails for any reason, `POST /api/repairs` still succeeds and the failure is
  only logged (no confirmation email is sent). `Email:FromName` is optional
  too and defaults to `"Service"`.
- `RateLimiting:PublicPermitLimit` (optional, default `10`) overrides how
  many requests per minute one client IP may make to the rate-limited public
  endpoints (see Errors below).

### 2. Apply database migrations

```bash
dotnet ef database update --project src/SerwisSystem.Api
```

> All migrations were squashed into a single `InitialCreate` on this branch.
> If you have an existing local database from before the squash, drop it
> first (`dotnet ef database drop --project src/SerwisSystem.Api`) and then
> run `dotnet ef database update` again.

### 3. Run the API

```bash
dotnet run --project src/SerwisSystem.Api
```

The API listens on `http://localhost:5000`.

### 4. Run the frontends

Each app is an independent Vite project (see each app's own README):

```bash
cd src/SerwisSystem.Client && npm ci && npm run dev      # staff app
cd src/SerwisSystem.Customer && npm ci && npm run dev    # customer app
```

Each app's `vite.config.js` pins its dev port so it always matches the API's
CORS allow-list: the staff app (`SerwisSystem.Client`) always uses `5173` and
the customer app (`SerwisSystem.Customer`) always uses `5174`, both with
`strictPort: true` — the dev server fails to start rather than silently pick
another port if its port is already taken.

Both apps call the API at `http://localhost:5000/api` by default and read
`VITE_API_URL` to override it — see each app's own README.

### CORS

The API only accepts browser requests from `http://localhost:5173` and
`http://localhost:5174`. If you serve a frontend from another origin, add it
to the CORS policy in `src/SerwisSystem.Api/Program.cs`.

## API overview

### Auth

| Method | Endpoint             | Auth | Description                                           |
| ------ | --------------------- | ---- | ------------------------------------------------------ |
| POST   | `/api/auth/register`  | none, rate limited | Register a new user → 200; duplicate username/email → 409 |
| POST   | `/api/auth/login`     | none, rate limited | `{ usernameOrEmail, password }` → 200 `{ token, role }`; wrong username/email or password → 401 |

`/api/auth/register` and `/api/auth/login` share the same per-IP `"public"`
rate-limiting policy as the anonymous repair endpoints (see Errors below).

### Users

| Method | Endpoint                          | Permission                     | Description                          |
| ------ | ---------------------------------- | ------------------------------- | ------------------------------------- |
| GET    | `/api/users`                       | `ReadUsers`                     | List users (paged, searchable, sorted by priority by default; unknown `sortBy` → 400) |
| GET    | `/api/users/{id:int}`              | `ReadUsers`, or the user themself | Get a single user                   |
| GET    | `/api/users/logged`                | any authenticated user          | Get the current user                  |
| PUT    | `/api/users/{id:int}`              | `EditUsers`, or the user themself | Update username/email               |
| PUT    | `/api/users/change-password`       | any authenticated user          | `{ currentPassword, newPassword }`    |
| DELETE | `/api/users/{id:int}`              | `DeleteUsers`                    | Delete a user → 204                   |
| PUT    | `/api/users/grant/{id:int}`        | `GrantUsers`                     | Grant/revoke another user's permissions |
| PUT    | `/api/users/{id:int}/promote-admin`| Admin role                       | Promote a worker to admin             |
| PUT    | `/api/users/{id:int}/priority`     | Admin role                       | Change an admin's priority            |
| GET    | `/api/users/admins`                | Admin role                       | List admins, ordered by priority      |
| PUT    | `/api/users/{id:int}/demote-admin` | Admin role                       | Demote an admin back to worker        |

A user can never delete themselves, and the last remaining admin can't be
deleted or demoted. Priority is compared strictly (`<`): a lower number means
more authority, and an admin can't grant another admin higher authority than
their own.

### Products & repairs

| Method | Endpoint                        | Auth                                        | Description                                    |
| ------ | -------------------------------- | -------------------------------------------- | ------------------------------------------------ |
| GET    | `/api/products`                  | none                                          | Product catalogue (name, whether a serial number is required, and its format hint) |
| GET    | `/api/repairs`                   | `ReadRepairs`                                 | List repairs (paged, searchable, filterable, sortable) |
| GET    | `/api/repairs/{id:int}`          | `ReadRepairs`                                 | Get a single repair                              |
| POST   | `/api/repairs`                   | none, rate limited                            | Create a repair (used by the customer app) → 201 |
| POST   | `/api/repairs/check`             | none, rate limited                            | `{ id, email }` → 200 repair status; not found → 404 |
| PUT    | `/api/repairs/{id:int}`          | `EditRepairs`                                 | Edit repair data (does not change status)        |
| PUT    | `/api/repairs/{id:int}/status`   | Admin role                                    | Correct a repair's status (see below)            |
| DELETE | `/api/repairs/{id:int}`          | `DeleteRepairs`                               | Delete a repair → 204                            |
| POST   | `/api/repairs/{id:int}/take`     | `TakeRepairs`                                 | Assign the repair to the current user            |
| POST   | `/api/repairs/{id:int}/complete` | authenticated; must own the repair, or be Admin | Mark as completed                              |
| POST   | `/api/repairs/{id:int}/cancel`   | `EditRepairs`; must own the repair, or be Admin | Cancel the repair                              |
| POST   | `/api/repairs/{id:int}/return`   | `DischargeUsers`, or the assigned worker      | Return the repair to the pending queue           |

`POST /api/repairs` and `POST /api/repairs/check` are anonymous (the customer
app is not authenticated) and rate limited per client IP.

Status corrections via `PUT /api/repairs/{id:int}/status` only allow:
`Pending → Cancelled`, `InProgress → Pending`, `InProgress → Cancelled`,
`Completed → InProgress`, `Cancelled → Pending`. Any other transition is
rejected with `400`.

### Errors

Every non-2xx response is an RFC 7807 `ProblemDetails` JSON body. User-facing
text (`title`, `detail` and the messages inside `errors`) is in Polish, like
the rest of the UI. A failed login, for example:

```json
{
  "type": "...",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Nieprawidłowy login lub hasło.",
  "traceId": "..."
}
```

A validation failure (400) has `"title": "Błędne dane."` and an `errors` object
keyed by camelCase field name, e.g. `"errors": { "email": ["To pole jest wymagane."] }`.

- `400` — invalid input; validation failures also include `errors`.
- `401` — not logged in, or an invalid/expired token.
- `403` — logged in, but missing the required permission.
- `404` — resource not found.
- `409` — conflict (duplicate username or email).
- `429` — rate limited (the public repair endpoints and `/api/auth/register`
  / `/api/auth/login`).

## Running tests

```bash
dotnet test SerwisSystem.slnx
```

`tests/SerwisSystem.Api.Tests` is an xUnit + `WebApplicationFactory`
integration test project (67 tests) covering registration/login and the
first-admin seed, the permission policy and admin priority rules, the repair
workflow and admin status corrections, the public repair endpoints (rate
limiting, the confirmation email, sorting), change-password, and the product
catalogue's serial number rules.

The tests run against a **real PostgreSQL database**, dropped and recreated
(`EnsureDeletedAsync` + `MigrateAsync`) once per test run — so point
`ConnectionStrings__DefaultConnection` at a database whose name contains
`"test"` (the fixture refuses to run otherwise, as a safety check against
wiping a development database by mistake); `Jwt__Key` is also required (same
names as above). See `.github/workflows/ci.yml` for the exact setup used in
CI, where PostgreSQL runs as a service container with database
`serwissystem_test`.

## Docker

The API ships a standalone multi-stage Dockerfile:

```bash
cd src/SerwisSystem.Api
docker build -t serwissystem-api .
docker run --rm -p 8080:8080 \
  -e ConnectionStrings__DefaultConnection="Host=host.docker.internal;Port=5432;Database=SerwisSystem;Username=postgres;Password=<your-password>" \
  -e Jwt__Key="<a random string, 64+ characters>" \
  serwissystem-api
```

The container listens on port 8080 and runs as a non-root user.

## What changed on this branch

This branch is the teacher's reference solution: it starts from the
student's project and fixes the issues filed against it. One line per issue:

- **#6** — every error response is now RFC 7807 `ProblemDetails`; login
  returns 401 (not 400) with one generic message; the frontend `apiFetch`
  parses `detail`/`title` and redirects to `/login` on an expired token;
  a duplicate username/email on register now returns 409 instead of a 500.
  User-facing `detail`/validation messages are now in Polish.
- **#7** — secrets moved out of `appsettings.json` into user-secrets/env
  vars; the JWT now carries and validates `iss`/`aud`; a per-IP rate-limiting
  policy (`"public"`, 10 requests/minute by default, configurable) now
  covers the anonymous repair endpoints as well as `/api/auth/register` and
  `/api/auth/login`.
- **#8** — `status` was removed from `UpdateRepairDto`; status corrections
  now go through a separate, admin-only `PUT /api/repairs/{id}/status` with
  an explicit table of allowed transitions.
- **#9** — repair-to-DTO mapping was unified into a single
  `RepairResponseDto.FromEntity`; `WorkerId` is always set from `UserId`;
  the current user is now loaded once per request (and without their
  repairs) instead of twice.
- **#10** — `EditRepairForm` keeps one state object re-seeded from the
  current repair instead of nine stale `useState` copies; the customer
  create form resets itself and shows the new repair's id after submit;
  actions update local state from the response instead of refetching.
- **#11** — template leftovers, dead code and informal comments were
  removed; the Dockerfile was rewritten as a standard Linux multi-stage
  build; the root README and `SerwisSystem.Api.http` were rewritten to match
  the real API.
- **#12** — the repo was restructured into `src/SerwisSystem.Api`,
  `src/SerwisSystem.Client`, `src/SerwisSystem.Customer` with a root
  solution; the migration history was squashed into one `InitialCreate`;
  a GitHub Actions workflow builds/lints both frontends and builds/tests the
  API; permission names moved from raw strings to a `Permission` enum;
  `tests/SerwisSystem.Api.Tests` now covers auth, permissions, the repair
  workflow and the public endpoints (see Running tests above).
- **#13** — the customer app's `checkRepair` call was rewritten to send
  `{ id, email }`, matching the current `CheckRepairDto`.
- **#14** — the change-password route is `PUT /api/users/change-password`
  (kebab-case, matching the other routes), and every `{id}` route now has an
  `:int` constraint.
- **#15** — the `ProductCategory` enum was removed entirely; a single
  `ProductCatalog` on the API now owns the list of products and their serial
  number rules, served via `GET /api/products` and used to validate repairs
  on the server, so the client and server can no longer disagree.
- **#16** — the anonymous `create-first-admin` endpoint was removed; the
  first admin is now seeded once at startup from `FirstAdmin:*`
  configuration (skipped, with a warning, while migrations are pending).
  Managing another admin now requires strictly higher authority (`<`, not
  `<=`), so admins with equal priority can no longer demote or delete each
  other.
- **#17** — every user-supplied value is HTML-encoded before being
  interpolated into the repair-confirmation email.
- **#18** — resolved by the migration squash in #12: the reference database
  starts from one clean `InitialCreate` with correct `CompanyNip` /
  `CompanyAddress` columns, so the destructive rename this issue described
  no longer exists in the history.
- **#19** — fixed the undefined `demoteAdmin`/`loadAdmins` references behind
  the "Demote" button, and cleaned up the app until `npm run lint` passes
  with 0 errors.
- **#20** — sorting repairs by reporter now uses the `reporterSurname` key
  the backend understands, and an unknown `sortBy` value returns 400 instead
  of silently falling back (the same rule now also applies to
  `GET /api/users`); the reporter's email is normalised
  (`Trim().ToLowerInvariant()`) on both save and check, so
  `POST /api/repairs/check` matches it case-insensitively.
