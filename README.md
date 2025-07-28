# Gym Tracker MVP

A minimal gym tracking application built with Next.js, Prisma, and PostgreSQL.

## Features

- **Session Types**: Track Pull, Push, Legs, Cardio Z2, Plyometrics, and HIIT workouts
- **Exercise Tracking**: Log sets with reps, weight, and notes
- **Cardio Sessions**: Track duration and optional distance
- **Workout Templates**: Create and apply pre-defined workout routines
- **Progress Tracking**: View exercise history and weight progression over time

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase or local)
- Environment variables in `.env`:
  ```
  POSTGRES_PRISMA_URL="postgresql://..."
  ```

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run database migrations:
   ```bash
   npm run db:migrate
   ```

3. Seed the database with initial exercises and templates:
   ```bash
   npm run db:seed
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Database Commands

- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed initial data
- `npm run db:studio` - Open Prisma Studio for database management

## Deployment on Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add `POSTGRES_PRISMA_URL` to Environment Variables (use your Supabase connection string)
4. Deploy
5. Run migrations in production:
   ```bash
   npx prisma migrate deploy
   ```

### Using with Supabase

If you're using Supabase as your PostgreSQL provider:
- Use `POSTGRES_PRISMA_URL` for Prisma connections (includes connection pooling)
- The app uses a single default user, so authentication is not implemented yet

## Architecture

- **Frontend**: Next.js 14 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **State Management**: React hooks
- **Data Fetching**: Server Actions

## Project Structure

```
/app
  /page.tsx              # Home - today's workout
  /progress/page.tsx     # Exercise progress tracking
  /templates/page.tsx    # Workout templates management
  /actions/              # Server Actions
/components/             # Reusable UI components
/lib/
  /db.ts                # Prisma client
/prisma/
  /schema.prisma        # Database schema
  /seed.ts              # Initial data
```