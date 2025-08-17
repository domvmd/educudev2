# Local Development Setup

This guide will help you set up Educude for local development using Supabase.

## Prerequisites

- Node.js 20+ installed
- Docker Desktop installed and running
- Git installed

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/[organization]/educude.git
cd educude
```

### 2. Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file and add your API keys:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your API keys for:
- Voyage AI
- DeepSeek
- OpenAI (optional)
- Pinecone
- Google Cloud Vision (optional)

### 4. Start Supabase

Start the local Supabase services:

```bash
npx supabase start
```

This will start:
- PostgreSQL database at `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- Supabase Studio at `http://127.0.0.1:54323`
- API at `http://127.0.0.1:54321`
- Email testing at `http://127.0.0.1:54324`

### 5. Run Database Migrations

Apply all database migrations:

```bash
npx supabase db push
```

### 6. Access Supabase Studio

Open your browser and navigate to:
```
http://127.0.0.1:54323
```

You can use Supabase Studio to:
- View and edit database tables
- Test authentication
- Manage storage buckets
- Monitor real-time subscriptions

## Local Development Credentials

These are the default local development credentials:

- **Database URL**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- **API URL**: `http://127.0.0.1:54321`
- **Anon Key**: See `.env.local.example`
- **Service Role Key**: See `.env.local.example`

## Useful Commands

### Stop Supabase
```bash
npx supabase stop
```

### Reset Database
```bash
npx supabase db reset
```

### View Logs
```bash
npx supabase db logs
```

### Create a New Migration
```bash
npx supabase migration new <migration_name>
```

## Troubleshooting

### Port Already in Use
If you get a "port already allocated" error:
1. Check for other Supabase projects: `docker ps`
2. Stop other projects: `npx supabase stop --project-id <project_id>`

### Docker Not Running
Make sure Docker Desktop is running before starting Supabase.

### Database Connection Issues
1. Check if Supabase is running: `npx supabase status`
2. Verify the connection string in your `.env.local`
3. Try restarting Supabase: `npx supabase stop && npx supabase start`

## Next Steps

1. Create your first migration in `supabase/migrations/`
2. Start building your frontend application
3. Connect to the local Supabase instance from your app