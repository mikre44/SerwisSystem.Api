# SerwisSystem

A repair management system with a .NET 10 API, PostgreSQL and two React apps.
The application interface and emails are in Polish.

```text
Folder                       | Purpose
SerwisSystem.Api/               Backend
SerwisSystem.Client/            Staff website, port 5173
SerwisSystem.Customer/          Customer website, port 5174
Tests/                         Development checks
```

## Local setup

Install .NET SDK 10, PostgreSQL and Node.js 24. Start PostgreSQL.
Run these PowerShell commands from the repository root. Replace the example
passwords, administrator details and SMTP settings with your own.

### 1. Configure the API

```powershell
dotnet tool install --global dotnet-ef --version 10.*    # Install the migration tool if missing
dotnet restore SerwisSystem.Api    # Download API packages

dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=SerwisSystem;Username=postgres;Password=YOUR_DB_PASSWORD" --project SerwisSystem.Api    # Database connection

$jwtKey = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))    # Generate a random signing key
dotnet user-secrets set "Jwt:Key" "$jwtKey" --project SerwisSystem.Api    # Store the key outside the repository

dotnet user-secrets set "FirstAdmin:Username" "Anna Kowalska" --project SerwisSystem.Api    # First administrator's name
dotnet user-secrets set "FirstAdmin:Email" "admin@example.com" --project SerwisSystem.Api    # First administrator's email
dotnet user-secrets set "FirstAdmin:Password" "REPLACE_WITH_YOUR_PASSWORD" --project SerwisSystem.Api    # Your own password, 6–50 characters
```

The project already has a User Secrets ID; no `user-secrets init` is needed.
Visual Studio's **Manage User Secrets** opens the same settings.
Do not put passwords in tracked configuration files.

`FirstAdmin` replaces `InitialAdmin`. If you saved the old keys, use the new names above.
Existing administrator accounts are not changed.

### 2. Configure email

```powershell
dotnet user-secrets set "Email:SmtpHost" "smtp.example.com" --project SerwisSystem.Api    # SMTP server
dotnet user-secrets set "Email:SmtpPort" "587" --project SerwisSystem.Api    # 587 uses STARTTLS; 465 uses implicit TLS
dotnet user-secrets set "Email:Username" "service@example.com" --project SerwisSystem.Api    # SMTP login
dotnet user-secrets set "Email:Password" "YOUR_SMTP_PASSWORD" --project SerwisSystem.Api    # SMTP password or app password
dotnet user-secrets set "Email:FromEmail" "service@example.com" --project SerwisSystem.Api    # Sender address
dotnet user-secrets set "Email:FromName" "Serwis" --project SerwisSystem.Api    # Sender name
dotnet user-secrets set "Email:RepairNotificationRecipient" "repairs@example.com" --project SerwisSystem.Api    # Internal recipient for visit and on-site repair notifications
```

Without working SMTP settings, repairs are still saved, but emails cannot be sent.
For Gmail, use `smtp.gmail.com`, port `587`, and your full Gmail address for the login and sender.
Set `Email:Password` to a Google app password (requires two-step verification), not your normal account password.
See [Google's app password instructions](https://support.google.com/mail/answer/185833).
Check the connection without sending mail: `dotnet run --project Tests -c Release -- --check-email`.
In production, set `Email__RepairNotificationRecipient` alongside the existing email environment variables.

Staff can choose **Wysyłka** (default), **Naprawa z dojazdem** (technician visits the customer)
or **Naprawa na miejscu** (repair at our service centre). Saving a change to either repair option
sends the internal recipient the repair number, location, device and contact details.
Unrelated edits do not send another message. Failed notifications remain visible after refreshing;
staff with repair editing permission can retry from the repair details. A retry can send a duplicate
if the mail server accepted the previous message but its response was lost.

**Drukuj** in the repair table and details downloads an A4 PDF of the saved repair.
Open the file and print it from your PDF viewer. PDF fonts are included, so no system font installation is needed.

### 3. Start the API

```powershell
dotnet ef database update --project SerwisSystem.Api    # Create or update the database first
dotnet run --project SerwisSystem.Api --launch-profile http    # Start at http://localhost:5000
```

The first startup creates the administrator with priority 1. Setup runs once.
Changing `FirstAdmin` settings later does not reset an account.
There is no public administrator-creation endpoint.

### 4. Start the websites

Open two more terminals, each starting at the repository root.

```powershell
cd SerwisSystem.Client    # Staff website
npm ci    # Install the exact versions from package-lock.json
npm run dev    # Open http://localhost:5173
```

```powershell
cd SerwisSystem.Customer    # Customer website
npm ci    # Install the saved package versions
npm run dev    # Open http://localhost:5174
```

`npm i` means `npm install`; use it when adding or updating dependencies.
`npm ci` replaces `node_modules` and installs from the lockfile without updating it.
It is useful after downloading the project and fails if the lockfile disagrees with `package.json`.

## Configuration files

- `.env.development` contains the local API address and is loaded by `npm run dev`.
- `.env.production` contains the production API address and is loaded by `npm run build`.
  In each frontend, replace its example `VITE_API_URL` with the deployed API address before building.
- `VITE_` settings are public. Never put passwords or keys there.
- `eslint.config.js` defines JavaScript and React checks, including undefined
  variables and incorrect hook usage. Run them with `npm run lint`.

The command chooses the environment; creating a file does not switch it:

```powershell
npm run dev    # Development server: reads .env.development
npm run build    # Production build: reads .env.production
npm run build -- --mode development    # Optional build using .env.development
```

Run these inside the frontend directory.
Restart the development server after changing its settings; rebuild a production
website after changing its API address. If no API URL is configured, this project's
frontend uses `/api` on its own host; it does not fall back to another environment file.

## Accounts and repairs

- Usernames allow spaces, but not `@`. Names and emails ignore letter case.
- Sessions last **10 hours**. Changing a password ends that account's existing sessions.
- Administrators have all permissions. Workers use assigned permissions.
  Workers allowed to manage permissions can grant or revoke only permissions they have.
- Priorities range from **1 to 999**; smaller numbers mean more authority.
  Administrators may manage and demote others with equal or lower authority.
  **An administrator with priority 999 cannot promote anyone else to administrator.**
- Nobody can delete their own account or remove their own administrator role.
  The last administrator cannot be deleted or demoted.
- Workers with `EditRepairs` may edit any repair and its status, including another worker's repair.
  Saving outdated data requires reloading the latest version first.
- Workers can enter any serial format; a serial is required only for selected products.
  Customer forms also check the serial format for those products.
- Each submission covers one device. Customers receive an eight-character tracking
  code, not a database ID. Lookup requires the code, email and original serial if supplied.
  Older repairs without codes remain available to staff.

## Limits and email

```text
Operation           | Limit per IP, per API instance
Login                 10 per minute
Registration          10 per hour
Customer lookup       20 per minute
Repair creation       15 per 30 minutes
```

Repair limits use `RateLimits:RepairCreatePermitLimit` and `RateLimits:RepairCreateWindowMinutes`.
People in one office may share an IP address.

If email fails, the repair stays saved and its code appears on screen.
Failures are logged; there is no email queue or automatic retry.
Retrying after a lost response may create a duplicate submission.
Cancelling a browser request does not undo a saved change.

## Deployment

Deployment means making the application available on your server. Local development
only needs the commands in **Local setup** above.

### Prepare the websites

Run from the repository root. Replace the example API address in both
`.env.production` files with your real address, including `/api`.

```powershell
notepad SerwisSystem.Client/.env.production    # Set VITE_API_URL
notepad SerwisSystem.Customer/.env.production    # Set VITE_API_URL
npm ci --prefix SerwisSystem.Client    # Install staff dependencies
npm ci --prefix SerwisSystem.Customer    # Install customer dependencies
npm run build --prefix SerwisSystem.Client    # Create SerwisSystem.Client/dist
npm run build --prefix SerwisSystem.Customer    # Create SerwisSystem.Customer/dist
```

`dist` contains the finished HTML, JavaScript and other website files.
To publish a website, copy the **contents** of its `dist` folder to that website's
directory on your web server or upload them to your hosting service. Keep the staff
and customer websites separate. Configure the server to return `index.html` for
frontend routes such as `/repairs` or `/check`. Do not route API requests to that file.
The exact upload command depends on your server or hosting provider.

For a local check of the built files, run these in separate terminals:

```powershell
npm run preview --prefix SerwisSystem.Client -- --port 5173 --strictPort    # Staff preview
npm run preview --prefix SerwisSystem.Customer -- --port 5174 --strictPort    # Customer preview
```

Preview serves the API address saved during the build; it is not a production web server.
The API must allow these preview addresses in CORS if you use them to check a deployed API.

### Prepare the API

Supply database, JWT and email settings through deployment secrets, not User Secrets.
Environment variables use double underscores, such as `Jwt__Key` and `FirstAdmin__Username`.
For example, in PowerShell on the API server:

```powershell
$env:ASPNETCORE_ENVIRONMENT = "Production"    # Use production settings
$env:ConnectionStrings__DefaultConnection = "Host=localhost;Port=5432;Database=SerwisSystem;Username=postgres;Password=YOUR_DB_PASSWORD"    # Server database
$env:Jwt__Key = "YOUR_EXISTING_PRODUCTION_SIGNING_KEY_AT_LEAST_32_BYTES"    # Use your generated key; keep it across restarts
$env:Cors__AllowedOrigins__0 = "https://staff.example.com"    # Replace with the staff website address
$env:Cors__AllowedOrigins__1 = "https://service.example.com"    # Replace with the customer website address
$env:FirstAdmin__Username = "Anna Kowalska"    # Needed before the first setup
$env:FirstAdmin__Email = "admin@example.com"    # First administrator's email
$env:FirstAdmin__Password = "REPLACE_WITH_YOUR_PASSWORD"    # First administrator's password
$env:Email__SmtpHost = "smtp.example.com"    # SMTP server
$env:Email__SmtpPort = "587"    # SMTP port
$env:Email__Username = "service@example.com"    # SMTP login
$env:Email__Password = "YOUR_SMTP_PASSWORD"    # SMTP password
$env:Email__FromEmail = "service@example.com"    # Sender address
$env:Email__FromName = "Serwis"    # Sender name
dotnet ef database update --project SerwisSystem.Api    # Apply migrations from the source repository
dotnet publish SerwisSystem.Api -c Release -o artifacts/api    # Create the runnable API files
dotnet artifacts/api/SerwisSystem.Api.dll --urls http://127.0.0.1:5000    # Start behind a reverse proxy on the same server
```

These variables last only for this terminal session. For permanent hosting, configure
the same settings in your service or hosting platform and enable HTTPS at the proxy.
Behind a reverse proxy, set `ReverseProxy:KnownProxies` to its trusted IP addresses.
Multiple API instances need shared gateway rate limits.

The Dockerfile requires Windows containers and runs only the API on port 8080:

```powershell
docker build -f SerwisSystem.Api/Dockerfile -t serwissystem-api .    # Run from the repository root
```

Apply migrations before starting the deployed API. Publish the websites separately.

## Development checks

```powershell
dotnet build    # Build from the repository root
dotnet run --project Tests/RegressionTests.csproj    # Check the API using a temporary database
node --test Tests/frontend-api.test.mjs    # Check frontend API requests
npm run lint --prefix SerwisSystem.Client    # Check staff JavaScript
npm run lint --prefix SerwisSystem.Customer    # Check customer JavaScript
npm run build --prefix SerwisSystem.Client    # Build the staff website
npm run build --prefix SerwisSystem.Customer    # Build the customer website
```

Database checks use `SERWIS_TEST_CONNECTION` or the local API connection secret.
That login must be allowed to create a temporary database. Checks do not change the application database.

Before the final handoff, remove `Tests/`, its commands and its GitHub Actions steps.
Keep the API build and frontend lint/build checks.

Request examples: `SerwisSystem.Api/SerwisSystem.Api.http`.
