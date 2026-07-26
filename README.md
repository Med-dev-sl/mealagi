# AI MEAL Platform

AI Monitoring, Evaluation, Accountability and Learning Platform.

## Stack

| Layer | Technology |
|---|---|
| Backend | NestJS 11, TypeScript, Prisma ORM 7 |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Auth | JWT (access + refresh tokens), bcrypt |
| API Docs | Swagger (OpenAPI) |
| Email | Resend (not yet implemented) |
| AI | Mistral AI (not yet implemented) |
| Container | Docker |

## Getting Started

### Prerequisites

- Node.js 22
- PostgreSQL 16 (Postgres.app or Docker)
- npm

### Environment

```bash
cp .env.example .env
```

Edit `.env` and set your `DATABASE_URL`:

```env
# Local (Postgres.app)
DATABASE_URL=postgresql://your_username@localhost:5432/agi_meal

# Docker
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agi_meal
```

Generate JWT secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Local Setup (Postgres.app)

```bash
# Create database
createdb agi_meal

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run migration:deploy

# Seed database
npm run seed

# Start dev server
npm run dev
```

### Docker

```bash
# Start all services
docker compose up --build

# Start in background
docker compose up --build -d

# Stop all services
docker compose down

# View logs
docker compose logs -f
```

## Default Credentials

| Role | Email | Password |
|---|---|---|
| Super Administrator | `admin@aimeal.local` | `Admin@123456` |

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/health` | — | Health check |
| GET | `/api/v1/auth/profile` | Bearer | Current user profile |
| POST | `/api/v1/auth/login` | — | Login (not yet implemented) |
| POST | `/api/v1/auth/logout` | Bearer | Logout |
| POST | `/api/v1/auth/refresh` | — | Refresh token |
| POST | `/api/v1/auth/forgot-password` | — | Request password reset |
| POST | `/api/v1/auth/reset-password` | — | Reset password |
| GET | `/api/docs` | — | Swagger documentation |

## Project Structure

```
src/
├── core/                        # Cross-cutting infrastructure
│   ├── auth/                    # JWT, guards, strategies
│   │   ├── decorators/          # @CurrentUser
│   │   ├── guards/              # JwtAuthGuard (global)
│   │   ├── interfaces/          # JwtPayload, TokenPair
│   │   ├── strategies/          # JwtStrategy
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts      # Token generation/verification
│   │   └── constants.ts
│   ├── config/                  # App, database, JWT, Swagger configs
│   ├── constants/               # Permissions, roles, audit actions
│   └── database/                # PrismaModule, PrismaService
│
├── modules/                     # Business feature modules
│   └── health/                  # Health check endpoint
│
├── shared/                      # Reusable framework utilities
│   ├── decorators/              # @Public()
│   ├── exceptions/
│   ├── filters/                 # AllExceptionsFilter
│   ├── interceptors/            # LoggingInterceptor, TransformInterceptor
│   ├── middleware/              # RequestLoggerMiddleware
│   └── utils/
│
├── app.module.ts
└── main.ts
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with watch mode |
| `npm run build` | Generate Prisma client + compile NestJS |
| `npm run start` | Start production server |
| `npm run lint` | Lint source files |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run migration:deploy` | Apply pending migrations |
| `npm run migration:reset` | Reset database (dev only) |
| `npm run seed` | Seed database |
| `npm run docker:up` | `docker compose up --build -d` |
| `npm run docker:down` | `docker compose down` |
| `npm run docker:logs` | `docker compose logs -f` |

## Auth Foundation

The auth module provides token utilities without requiring a login endpoint:

| Method | Description |
|---|---|
| `generateAccessToken(payload)` | Signs a JWT with `JWT_SECRET` (default 15m expiry) |
| `generateRefreshToken(payload)` | Signs a JWT with `JWT_REFRESH_SECRET` (default 7d expiry) |
| `verifyToken(token, isRefresh?)` | Verifies and decodes a JWT |
| `decodeToken(token)` | Decodes a JWT without verification |

All authenticated routes are protected by the global `JwtAuthGuard`. Use `@Public()` to bypass.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | Server port |
| `NODE_ENV` | `development` | Environment |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `JWT_SECRET` | — | Access token signing key |
| `JWT_REFRESH_SECRET` | — | Refresh token signing key |
| `JWT_EXPIRES_IN` | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token lifetime |
| `FRONTEND_URL` | `http://localhost:5173` | CORS origin |
| `REDIS_HOST` | `redis` | Redis host (Docker) |
| `REDIS_PORT` | `6379` | Redis port |
| `LOG_LEVEL` | `debug` | Logger level |
