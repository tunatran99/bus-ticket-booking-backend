# Bus Ticket Booking System - Backend

A NestJS-based REST API for the Bus Ticket Booking System with JWT authentication, Swagger documentation, and comprehensive validation.

## Features

- 🔐 JWT-based authentication with refresh tokens
- 📝 API versioning (v1)
- 📚 Swagger/OpenAPI documentation
- ✅ Request validation using class-validator
- 🔍 X-Request-ID header tracking
- 🛡️ Password strength validation
- 📱 Vietnamese phone number validation
- 🚦 Rate limiting support
- 📋 Standardized API responses

## Tech Stack

- **Framework**: NestJS 10
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Password Hashing**: bcrypt

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` file and update the following variables:
- `JWT_SECRET`: Your JWT secret key
- `JWT_REFRESH_SECRET`: Your refresh token secret key
- `PORT`: Server port (default: 3000)
- `CORS_ORIGIN`: Frontend URL (default: http://localhost:5173)

## Running the Application

### Development Mode
```bash
npm run start:dev
```

The server will start on `http://localhost:3000`

### Production Mode
```bash
npm run build
npm run start:prod
```

## API Documentation

Once the application is running, access the Swagger documentation at:
```
http://localhost:3000/api/docs
```

## API Endpoints (summary)

All endpoints are served under the versioned prefix: `/api/v1`.

### Authentication & Users

> Note: The controller path is `@Controller('user')`, so all auth-related endpoints are under `/api/v1/user/*`.

#### Register
- **POST** `/api/v1/user/register`
- Register a new user account.
- Body: `{ email, phone, password, fullName, role? }`

#### Login
- **POST** `/api/v1/user/login`
- Authenticate user and receive **access** and **refresh** JWT tokens.
- Body: `{ identifier, password }`

#### Refresh Token
- **POST** `/api/v1/user/refresh`
- Exchange a valid refresh token for a new access token.
- Body: `{ refreshToken }`

#### Logout
- **POST** `/api/v1/user/logout`
- Log out the current user. In this demo implementation, logout is stateless (no token blacklist) and simply responds with a success message.
- Headers: `Authorization: Bearer <accessToken>`

#### Forgot Password
- **POST** `/api/v1/user/forgot-password`
- Request a password reset. In this demo implementation, it returns a success message without sending a real email.
- Body: `{ email }`

#### Get Current User
- **GET** `/api/v1/user/me`
- Get the profile of the currently authenticated user.
- Headers: `Authorization: Bearer <accessToken>`

#### Change Password
- **POST** `/api/v1/user/change-password`
- Change the current user's password.
- Headers: `Authorization: Bearer <accessToken>`
- Body: `{ currentPassword, newPassword }`

#### List All Users (admin only)
- **GET** `/api/v1/user/all`
- List all users in the system.
- Requires `role: 'admin'` in the JWT payload; non-admins receive `403 Forbidden`.
- Headers: `Authorization: Bearer <accessToken>`

### Dashboard

The dashboard endpoints expose simple, in-memory demo metrics that the frontend dashboard consumes.

#### Personal Dashboard
- **GET** `/api/v1/dashboard/me`
- Returns personal metrics and recent trips for the current user.
- Headers: `Authorization: Bearer <accessToken>`

#### Admin Dashboard
- **GET** `/api/v1/dashboard/admin`
- Returns admin-level metrics (total users, total admins, recent users) when the current user has `role: 'admin'`.
- For non-admin users, returns empty metrics.
- Headers: `Authorization: Bearer <accessToken>`

## Authentication Model: Access + Refresh Tokens

This project uses a **short-lived access token + longer-lived refresh token** model rather than server-side sessions.

- The **access token** is a JWT signed with `JWT_SECRET` and has a relatively short lifetime (`JWT_EXPIRES_IN`).
- The **refresh token** is a JWT signed with `JWT_REFRESH_SECRET` and has a longer lifetime (`JWT_REFRESH_EXPIRES_IN`).

On the backend:

- Both tokens include a payload with `userId`, `email`, and `role`.
- `/user/login` issues both tokens via `AuthService.generateTokens`.
- `/user/refresh` verifies the refresh token and issues a new access token.

On the frontend:

- The React client stores both tokens using a small `tokenStore` helper (backed by `localStorage`).
- An auto-refresh helper schedules a refresh request before the access token expires.
- All protected API calls include the access token in the `Authorization: Bearer <token>` header.

### Why tokens instead of cookies/sessions?

- Simpler integration with a standalone SPA (the React front-end can talk to the NestJS backend without sharing a cookie domain).
- JWTs allow easy inspection of the user's role/claims in both client and server without extra round trips.
- The refresh token flow limits the blast radius of a stolen access token because it is short-lived.

**Security considerations (for this assignment/demo):**

- Tokens are stored in `localStorage`, which makes them accessible to JavaScript and therefore vulnerable to XSS.
- In a production system you would typically prefer **httpOnly cookies** or at least harden the app against XSS (CSP, strict sanitization, etc.).
- Since this is a coursework demo with an in-memory backend, we prioritize implementation simplicity and clarity of the token model.

## Validation Rules

### Email
- Must be a valid email format
- Must be unique

### Phone
- Must be a valid Vietnamese phone format: `+84xxxxxxxxx` or `0xxxxxxxxx`
- Must be unique

### Password
- Minimum 8 characters
- Must contain:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (@$!%*?&)

### Full Name
- Minimum 2 characters
- Maximum 100 characters

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "operation successful",
  "timestamp": "2025-11-15T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "human readable error message",
    "details": { ... }
  },
  "timestamp": "2025-11-15T10:30:00Z"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| AUTH_001 | Invalid credentials |
| AUTH_002 | Token expired or invalid |
| AUTH_003 | Insufficient permissions |
| USER_001 | User not found |
| USER_002 | Email already exists |
| USER_003 | Phone already exists |
| VAL_001 | Validation error |
| SYS_001 | Internal server error |
| SYS_002 | Service unavailable |

## Project Structure

```
backend/
├── src/
│   ├── auth/
│   │   ├── dto/                 # Data Transfer Objects
│   │   ├── guards/              # Auth guards
│   │   ├── strategies/          # Passport strategies
│   │   ├── interfaces/          # TypeScript interfaces
│   │   ├── auth.controller.ts   # Auth endpoints
│   │   ├── auth.service.ts      # Auth business logic
│   │   └── auth.module.ts       # Auth module
│   ├── users/
│   │   ├── users.service.ts     # User management
│   │   └── users.module.ts      # Users module
│   ├── common/
│   │   ├── decorators/          # Custom decorators
│   │   ├── filters/             # Exception filters
│   │   └── middleware/          # Custom middleware
│   ├── app.module.ts            # Root module
│   └── main.ts                  # Application entry point
├── .env                         # Environment variables
├── .env.example                 # Environment template
├── nest-cli.json               # NestJS CLI config
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
└── README.md                   # This file
```

## Development

### Linting
```bash
npm run lint
```

### Testing
```bash
npm run test
```

### Build
```bash
npm run build
```

## Authorization Model

Authorization is **role-based** using a simple `role: string` field on the user:

- New users default to `role: 'passenger'`.
- A demo admin user is seeded at startup by `UsersService.onModuleInit`.
- The JWT payload includes the user's `role`, which is used for:
  - Guarding server endpoints (e.g., `/user/all` and `/dashboard/admin` are effectively admin-only).
  - Powering role-aware UI on the frontend (admin widgets on the dashboard).

To keep the demo small, there is no persistent database or role management UI; users are stored in-memory.

## Notes

- This is a demo application using in-memory storage
- For production, integrate with a real database (PostgreSQL, MongoDB, etc.)
- Implement proper session management with Redis for token blacklisting
- Add email service for password reset functionality
- Configure proper rate limiting for production use

## License

MIT
