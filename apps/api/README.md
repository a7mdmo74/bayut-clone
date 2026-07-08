# API

Express.js backend API for Bayut Clone, powered by NeonDB (PostgreSQL).

## Getting Started

### Prerequisites

- Node.js >= 18
- Bun 1.3.14+

### Installation

Install dependencies:

```bash
bun install
```

### Database Setup

#### Option 1: Local Docker (Development)

Start PostgreSQL in Docker:

```bash
docker-compose up -d
```

The database will be running at `postgresql://bayut_user:bayut_password@localhost:5432/bayut_db`

#### Option 2: NeonDB (Production)

1. Create a project at [console.neon.tech](https://console.neon.tech)
2. Copy your connection string
3. Update `DATABASE_URL` in `.env.local`:

```bash
cp .env.example .env.local
```

Then update the connection string in `.env.local`

### Development

Start the development server with hot reload:

```bash
bun run dev
```

The API will be available at `http://localhost:3001`

### Production Build

Build the project:

```bash
bun run build
```

Start the production server:

```bash
bun run start
```

### Type Checking

Check for TypeScript errors:

```bash
bun run check-types
```

### Linting

Run ESLint:

```bash
bun run lint
```

## API Endpoints

- `GET /` - API info
- `GET /health` - Health check with database connection status

## Project Structure

```
src/
├── index.ts          # Main server entry point
```

## Database

This project uses **Prisma ORM** with **PostgreSQL** as the database provider.

### Local Development with Docker

1. Start the PostgreSQL container from the root directory:

   ```bash
   docker compose up -d
   ```

2. Push the Prisma schema to the database:

   ```bash
   bun run prisma db push
   ```

3. (Optional) View and manage data with Prisma Studio:
   ```bash
   bun run prisma studio
   ```

### Migration to NeonDB

When ready to use NeonDB:

1. Create a project at [console.neon.tech](https://console.neon.tech)
2. Update `DATABASE_URL` in `.env.local` with your NeonDB connection string
3. Push schema: `bun run prisma db push`

### Docker Management

- Start database: `docker compose up -d`
- Stop database: `docker compose down`
- Stop and remove data: `docker compose down -v`
- View logs: `docker compose logs postgres`

### Prisma Commands

- `bun run prisma db push` - Sync schema changes to the database
- `bun run prisma generate` - Generate Prisma Client
- `bun run prisma studio` - Open Prisma Studio (visual DB browser)
- `bun run prisma migrate dev --name <name>` - Create and apply a new migration

## Scripts

- `dev` - Start development server with hot reload
- `build` - Build TypeScript to JavaScript
- `start` - Run production build
- `lint` - Run ESLint checks
- `check-types` - Run TypeScript type checking
