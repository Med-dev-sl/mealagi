# AI MEAL Platform

AI Monitoring, Evaluation, Accountability and Learning Platform.

## Stack

| Layer | Technology |
|---|---|
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | PostgreSQL 16 |
| Cache | Redis |
| API Docs | Swagger |
| Container | Docker |

## Getting Started

### Prerequisites

- Node.js 22
- Docker & Docker Compose
- npm

### Environment

```bash
cp .env.example .env
```

### Docker (recommended)

```bash
# Start all services
docker compose up --build

# Start in background
docker compose up --build -d

# Stop all services
docker compose down

# View logs
docker compose logs -f

# View backend logs only
docker compose logs -f backend
```

### Run locally

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run migration:deploy

# Seed database
npm run seed

# Start dev server
npm run start:dev
```

## Prisma Commands

```bash
# Generate Prisma client
npm run prisma:generate

# Open Prisma Studio
npm run prisma:studio

# Create a new migration
npm run migration:create --name describe_changes

# Deploy migrations (production-safe)
npm run migration:deploy

# Reset database (dev only - drops all data)
npm run migration:reset

# Seed database
npm run seed
```

## Docker Commands

```bash
npm run docker:up      # docker compose up --build -d
npm run docker:down    # docker compose down
npm run docker:logs    # docker compose logs -f
```

## API Endpoints

| Endpoint | Description |
|---|---|
| `http://localhost:3000/api/v1/health` | Health check |
| `http://localhost:3000/api/docs` | Swagger documentation |

## Services

| Service | URL | Credentials |
|---|---|---|
| Backend | http://localhost:3000 | — |
| PostgreSQL | localhost:5432 | postgres / postgres |
| Redis | localhost:6379 | redis_password |
| pgAdmin | http://localhost:5050 | admin@agimeal.com / admin |

## Project Structure

```
src/
├── common/           # Shared infrastructure
│   ├── decorators/
│   ├── dto/
│   ├── enums/
│   ├── exceptions/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── interfaces/
│   ├── middleware/
│   ├── pipes/
│   ├── services/
│   └── utils/
├── config/           # Configuration (app, database, swagger)
├── prisma/           # Prisma module (service + module)
├── modules/          # Feature modules
│   ├── auth/
│   ├── users/
│   ├── organizations/
│   ├── roles/
│   ├── permissions/
│   └── audit/
├── app.module.ts
└── main.ts
```
