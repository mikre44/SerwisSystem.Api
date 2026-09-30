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
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=SerwisSystem;Username=postgres;Password=<your-password>"
dotnet user-secrets set "Jwt:Key" "<a random string, 64+ characters>"
dotnet user-secrets set "Jwt:Issuer" "SerwisSystem.Api"
dotnet user-secrets set "Jwt:Audience" "SerwisSystem.Client"
dotnet user-secrets set "Email:SmtpHost" "smtp.example.com"
dotnet user-secrets set "Email:SmtpPort" "587"
dotnet user-secrets set "Email:Username" "<smtp-username>"
dotnet user-secrets set "Email:Password" "<smtp-password>"
dotnet user-secrets set "Email:FromEmail" "no-reply@example.com"
dotnet user-secrets set "Email:FromName" "SerwisSystem"
dotnet user-secrets set "FirstAdmin:Username" "admin"
dotnet user-secrets set "FirstAdmin:Email" "admin@example.com"
dotnet user-secrets set "FirstAdmin:Password" "<a strong password>"
```

The same keys work as environment variables (used in CI and Docker), with `:`
replaced by `__`, e.g. `ConnectionStrings__DefaultConnection`, `Jwt__Key`.

Notes:
- `FirstAdmin:*` is only used once, at startup: if the database has no admin
  yet and all three values are configured, that account is created as the
  first admin. If any value is missing, nothing is seeded and a warning is
  logged instead — there is no `create-first-admin` endpoint.
- `Email:*` is required to send the repair-confirmation email from
  `POST /api/repairs`; if sending fails the repair is still created (the
  failure is only logged).

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

Vite defaults to `http://localhost:5173`, and to the next free port
(normally `5174`) for whichever app you start second. Both talk to the API
at `http://localhost:5000/api` by default.

### CORS

The API only accepts browser requests from `http://localhost:5173` and
`http://localhost:5174`. If you serve a frontend from another origin, add it
to the CORS policy in `src/SerwisSystem.Api/Program.cs`.

## API overview

### Auth

| Method | Endpoint             | Auth | Description                                           |
| ------ | --------------------- | ---- | ------------------------------------------------------ |
| POST   | `/api/auth/register`  | none | Register a new user                                     |
| POST   | `/api/auth/login`     | none | `{ usernameOrEmail, password }` → `{ token }`           |

### Users

| Method | Endpoint                          | Permission                     | Description                          |
| ------ | ---------------------------------- | ------------------------------- | ------------------------------------- |
| GET    | `/api/users`                       | `ReadUsers`                     | List users (paged, searchable)        |
| GET    | `/api/users/{id:int}`              | `ReadUsers`, or the user themself | Get a single user                   |
| GET    | `/api/users/logged`                | any authenticated user          | Get the current user                  |
| PUT    | `/api/users/{id:int}`              | `EditUsers`, or the user themself | Update username/email               |
| PUT    | `/api/users/change-password`       | any authenticated user          | `{ currentPassword, newPassword }`    |
| DELETE | `/api/users/{id:int}`              | `DeleteUsers`                    | Delete a user                         |
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
| POST   | `/api/repairs`                   | none, rate limited                            | Create a repair (used by the customer app)       |
| POST   | `/api/repairs/check`             | none, rate limited                            | `{ id, email }` → repair status                  |
| PUT    | `/api/repairs/{id:int}`          | `EditRepairs`                                 | Edit repair data (does not change status)        |
| PUT    | `/api/repairs/{id:int}/status`   | Admin role                                    | Correct a repair's status (see below)            |
| DELETE | `/api/repairs/{id:int}`          | `DeleteRepairs`                               | Delete a repair                                  |
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

Every non-2xx response is an RFC 7807 `ProblemDetails` JSON body:

```json
{
  "type": "...",
  "title": "...",
  "status": 400,
  "detail": "Human-readable message.",
  "errors": { "fieldName": ["message"] },
  "traceId": "..."
}
```

- `400` — invalid input; validation failures also include `errors` keyed by
  camelCase field name.
- `401` — not logged in, or an invalid/expired token.
- `403` — logged in, but missing the required permission.
- `404` — resource not found.
- `409` — conflict (duplicate username or email).
- `429` — rate limited (the anonymous repair endpoints).

## Running tests

```bash
dotnet test
```

`tests/SerwisSystem.Api.Tests` runs integration tests against a real
PostgreSQL database via `WebApplicationFactory`; point it at a local instance
with `ConnectionStrings__DefaultConnection` and `Jwt__Key` environment
variables (same names as above). See `.github/workflows/ci.yml` for the exact
setup used in CI, where PostgreSQL runs as a service container.

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
