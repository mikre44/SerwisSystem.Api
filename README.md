# SerwisSystem API

Backend API for a repair service management system built with **ASP.NET Core** and **PostgreSQL**.

The system allows users to create and manage repairs, assign repairs to workers, manage users, and control access through roles and individual permissions.

---

## 🛠️ Technologies

* **C#**
* **ASP.NET Core Web API**
* **Entity Framework Core**
* **PostgreSQL**
* **JWT Authentication**
* **ASP.NET Core Authorization**
* **PasswordHasher**
* **REST API**
* **Git / GitHub**

---

## 📌 Features

### Authentication

* User registration
* User login
* JWT token authentication
* Password hashing
* Username and email uniqueness
* Role-based authentication

### Users

* View users
* View individual users
* View currently logged-in user
* Edit user information
* Delete users
* Grant and revoke permissions
* User priority system

### Repairs

* Create repairs
* View all repairs
* View individual repairs
* Edit repairs
* Delete repairs
* Assign repairs to workers
* Complete repairs
* Cancel repairs
* Return repairs to the pending queue

### Authorization

The API uses a combination of:

* JWT authentication
* User roles
* Individual permissions
* User priority levels

Administrators automatically have access to all permissions.

---

# 🔐 Authentication

The API uses **JWT Bearer tokens**.

After logging in, the API returns a token:

```json
{
  "token": "YOUR_JWT_TOKEN",
  "role": "Worker"
}
```

The token must be sent with authenticated requests:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

JWT tokens currently expire after **2 hours**.

---

# 👥 User Roles

The system currently has two roles:

```text
Worker
Admin
```

### Worker

A Worker has access based on their individual permissions.

### Admin

Admins automatically pass permission checks and therefore have access to all permissions.

---

# 🔑 Permissions

The system currently supports the following permissions:

```text
ReadRepairs
TakeRepairs
EditRepairs
DeleteRepairs

ReadUsers
EditUsers
DeleteUsers
GrantUsers
DischargeUsers
```

Permissions can be granted or revoked by users who have the `GrantUsers` permission.

A user cannot modify their own permissions.

---

# 🧑‍🔧 Repair Workflow

Repairs follow a basic workflow:

```text
Pending
   │
   │ /take
   ▼
InProgress
   │
   ├───────────────┐
   │               │
/complete        /cancel
   │               │
   ▼               ▼
Completed       Cancelled
```

A repair can also be returned:

```text
InProgress
     │
   /return
     ▼
Pending
```

Users with `EditRepairs` can manually correct a repair's information and status if an incorrect status was assigned.

---

# 📡 API Endpoints

## Authentication

| Method | Endpoint             | Authentication | Description                   |
| ------ | -------------------- | -------------- | ----------------------------- |
| POST   | `/api/auth/register` | No             | Register a new user           |
| POST   | `/api/auth/login`    | No             | Login and receive a JWT token |

---

## Users

| Method | Endpoint                | Permission              | Description              |
| ------ | ----------------------- | ----------------------- | ------------------------ |
| GET    | `/api/users`            | `ReadUsers`             | Get all users            |
| GET    | `/api/users/{id}`       | `ReadUsers` or own user | Get a specific user      |
| GET    | `/api/users/logged`     | Authenticated           | Get the logged-in user   |
| PUT    | `/api/users/{id}`       | `EditUsers` or own user | Update username/email    |
| DELETE | `/api/users/{id}`       | `DeleteUsers`           | Delete a user            |
| PUT    | `/api/users/grant/{id}` | `GrantUsers`            | Grant/revoke permissions |

---

## Repairs

| Method | Endpoint                     | Permission                  | Description                   |
| ------ | ---------------------------- | --------------------------- | ----------------------------- |
| GET    | `/api/repairs`               | `ReadRepairs`               | Get all repairs               |
| GET    | `/api/repairs/{id}`          | `ReadRepairs`               | Get a specific repair         |
| POST   | `/api/repairs`               | `EditRepairs`               | Create a repair               |
| PUT    | `/api/repairs/{id}`          | `EditRepairs`               | Edit a repair                 |
| DELETE | `/api/repairs/{id}`          | `DeleteRepairs`             | Delete a repair               |
| POST   | `/api/repairs/{id}/take`     | `TakeRepairs`               | Assign repair to current user |
| POST   | `/api/repairs/{id}/complete` | Authenticated + owner/Admin | Complete repair               |
| POST   | `/api/repairs/{id}/cancel`   | `EditRepairs` + owner/Admin | Cancel repair                 |
| POST   | `/api/repairs/{id}/return`   | `DischargeUsers` or owner   | Return repair to pending      |

---

# 📝 Example Requests

## Register

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "password123"
}
```

---

## Login

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "usernameOrEmail": "john",
  "password": "password123"
}
```

---

## Create a Repair

```http
POST /api/repairs
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

```json
{
  "product": "Laptop",
  "description": "Does not turn on",
  "name": "John",
  "surname": "Smith",
  "phoneNumber": "+48123456789",
  "email": "john@example.com",
  "address": "Example Street 10",
  "nip": "1234567890"
}
```

---

## Take a Repair

```http
POST /api/repairs/1/take
Authorization: Bearer YOUR_JWT_TOKEN
```

The repair must:

* exist
* have no assigned user
* have the `Pending` status
* be accessed by a user with `TakeRepairs`

After taking the repair:

```text
UserId = current user
Status = InProgress
```

---

## Complete a Repair

```http
POST /api/repairs/1/complete
Authorization: Bearer YOUR_JWT_TOKEN
```

The repair must be assigned to the current user, unless the current user is an Admin.

The repair must also have:

```text
Status = InProgress
```

After completion:

```text
Status = Completed
```

---

# 🗄️ Database

The project uses **PostgreSQL** with **Entity Framework Core**.

Main entities:

```text
User
 ├── Permissions
 └── Repairs

Repair
 └── User (optional)

Permissions
 └── User
```

### Relationships

A user can have multiple repairs:

```text
User 1 ──────── * Repair
```

A user has one permissions record:

```text
User 1 ──────── 1 Permissions
```

When a user is deleted, their permissions are deleted as well.

When a worker is deleted, their assigned repairs are not deleted. The repair's `UserId` is set to `null`.

---

# ⚙️ Setup

## Requirements

Before running the project, install:

* [.NET SDK](https://dotnet.microsoft.com/)
* PostgreSQL
* Entity Framework Core CLI

Install EF Core CLI if necessary:

```bash
dotnet tool install --global dotnet-ef
```

---

## Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
cd SerwisSystem.Api
```

---

## Configure the database

Add your PostgreSQL connection string to:

```text
appsettings.json
```

Example:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=SerwisSystem;Username=postgres;Password=YOUR_PASSWORD"
  }
}
```

If your local PostgreSQL installation requires it, configure the appropriate SSL settings for your environment.

---

## Configure JWT

Add a JWT key to `appsettings.json`:

```json
{
  "Jwt": {
    "Key": "YOUR_SECRET_KEY"
  }
}
```

The JWT key should be kept secret and should **not** be committed to a public repository.

For production, use a secure secret-management solution or environment variables.

---

## Apply database migrations

Run:

```bash
dotnet ef database update
```

---

## Run the API

```bash
dotnet run
```

The API will start using the ASP.NET Core development configuration.

---

# 🧪 Testing

The API can be tested using:

* Visual Studio `.http` files
* Postman
* Insomnia
* Another HTTP client
* The future frontend application

A typical testing flow is:

```text
1. Register
      ↓
2. Login
      ↓
3. Get JWT token
      ↓
4. Send JWT with Authorization header
      ↓
5. Create / view / manage repairs
```

---

# 🔒 Security

The project currently uses:

* JWT Bearer authentication
* Password hashing using `PasswordHasher<User>`
* Authorization policies
* Custom permission handling
* Role-based Admin access
* User priority restrictions
* Model validation
* Global exception handling
* Unique username constraint
* Unique email constraint

Passwords are never stored directly. Only their hashes are stored in the database.

---

# 📁 Project Structure

A simplified project structure:

```text
SerwisSystem.Api/
│
├── Authorization/
│   ├── PermissionHandler.cs
│   ├── PermissionPolicyProvider.cs
│   ├── PermissionRequirement.cs
│   └── RequirePermissionAttribute.cs
│
├── Controllers/
│   ├── AuthController.cs
│   ├── RepairsController.cs
│   └── UsersController.cs
│
├── Data/
│   └── AppDbContext.cs
│
├── Models/
│   ├── DTOs/
│   │   ├── CreateRepairDto.cs
│   │   ├── LoginDto.cs
│   │   ├── PermissionsResponseDto.cs
│   │   ├── RegisterDto.cs
│   │   ├── RepairResponseDto.cs
│   │   ├── UpdatePermissionsDto.cs
│   │   ├── UpdateRepairDto.cs
│   │   ├── UpdateUserDto.cs
│   │   └── UserResponseDto.cs
│   │
│   ├── Enums/
│   │   ├── RepairStatus.cs
│   │   ├── UserResponseOption.cs
│   │   └── UserRole.cs
│   │
│   ├── Permissions.cs
│   ├── Repair.cs
│   └── User.cs
│
├── Services/
│   ├── PermissionService.cs
│   └── UserService.cs
│
├── Migrations/
│
├── GlobalExceptionHandler.cs
├── Program.cs
├── appsettings.json
└── appsettings.Development.json
```

---

# 🚧 Future Development

Planned improvements include:

* React frontend
* Worker interface
* User management interface
* Repair management interface
* Better API documentation
* Improved error handling
* Production-ready secret management
* Additional validation
* More comprehensive automated tests

---

# 👨‍💻 Author

**Michał Reinert**

readme was generated by ai


