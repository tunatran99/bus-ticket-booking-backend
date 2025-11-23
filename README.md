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

## API Endpoints

### Authentication

#### Register
- **POST** `/api/v1/auth/register`
- Register a new user account
- Body: `{ email, phone, password, fullName, role }`

#### Login
- **POST** `/api/v1/auth/login`
- Authenticate user and receive JWT tokens
- Body: `{ identifier, password }`

#### Refresh Token
- **POST** `/api/v1/auth/refresh`
- Refresh access token using refresh token
- Body: `{ refreshToken }`

#### Logout
- **POST** `/api/v1/auth/logout`
- Invalidate current session
- Headers: `Authorization: Bearer <token>`

#### Forgot Password
- **POST** `/api/v1/auth/forgot-password`
- Request password reset
- Body: `{ email }`

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

## Notes

- This is a demo application using in-memory storage
- For production, integrate with a real database (PostgreSQL, MongoDB, etc.)
- Implement proper session management with Redis for token blacklisting
- Add email service for password reset functionality
- Configure proper rate limiting for production use

## License

MIT
