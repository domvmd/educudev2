# Local Development Setup - Educude

This guide will walk you through setting up the Educude platform for local development using Supabase.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker Desktop** (required for Supabase local development)
  - [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
  - Make sure Docker is running before proceeding
- **Node.js 20+ and npm**
  - [Download Node.js](https://nodejs.org/)
  - Verify installation: `node --version` and `npm --version`
- **Git**
  - [Download Git](https://git-scm.com/)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/domvmd/educudev2.git
   cd educudev2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your API keys:
   - `GOOGLE_CLIENT_SECRET`: Already included for OAuth
   - Other API keys can be added as you obtain them

4. **Start Supabase local development**
   ```bash
   npx supabase start
   ```
   
   This will start all Supabase services. Note the URLs and keys displayed - they should match what's in `.env.local.example`.

5. **Access Supabase services**
   - **Supabase Studio**: http://127.0.0.1:54323
   - **API**: http://127.0.0.1:54321
   - **Email testing (Inbucket)**: http://127.0.0.1:54324
   - **Database**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

## Database Schema

The database is automatically set up with migrations when you run `supabase start`. The schema includes:

### Core Tables
- **profiles**: User profiles with subscription tiers
- **documents**: PDF, audio, slides, and notes storage
- **annotations**: User annotations on documents
- **quizzes**: Generated quizzes
- **questions**: Quiz questions with Bloom's taxonomy levels
- **study_sessions**: User study progress tracking
- **shared_documents**: Document sharing between users

### Storage Buckets
- **documents**: PDFs and processed files (200MB limit)
- **audio**: Lecture recordings (500MB limit)
- **avatars**: User profile images (5MB limit, public)

### Security
- Row Level Security (RLS) is enabled on all tables
- Users can only access their own data
- Shared documents have special policies for collaboration

## Authentication

The platform supports:

1. **Email/Password Authentication**
   - Minimum 8 characters
   - Must include uppercase, lowercase, and numbers

2. **Google OAuth**
   - Already configured with credentials
   - Redirect URL: `http://localhost:3000/auth/callback`

## Common Commands

### Supabase Management
```bash
# Start Supabase (if not running)
npx supabase start

# Stop Supabase (preserves data)
npx supabase stop

# Reset database (applies all migrations fresh)
npx supabase db reset

# Check status
npx supabase status

# View logs
npx supabase logs
```

### Database Migrations
```bash
# Create a new migration
npx supabase migration new <migration_name>

# Apply pending migrations
npx supabase migration up

# Check migration status
npx supabase migration list
```

### Testing
```bash
# Run authentication tests
node supabase/tests/test-auth.js

# Run storage tests
node supabase/tests/test-storage.js

# Run RLS policy tests
node supabase/tests/test-rls-complete.js
```

## Troubleshooting

### Docker Issues
- **Error**: "Cannot connect to Docker daemon"
  - **Solution**: Make sure Docker Desktop is running

### Port Conflicts
- **Error**: "Port already allocated"
  - **Solution**: Stop other Supabase projects: `npx supabase stop --all`
  - Or specify project: `npx supabase stop --project-id educudev2`

### Migration Errors
- **Error**: "Migration failed"
  - **Solution**: Reset the database: `npx supabase db reset`
  - This will drop all data and reapply migrations

### Authentication Issues
- **Error**: "Invalid login credentials"
  - **Solution**: Check that the user exists and email is confirmed
  - For local dev, email confirmations are disabled

### Storage Upload Errors
- **Error**: "File too large"
  - **Solution**: Check bucket file size limits:
    - Documents: 200MB
    - Audio: 500MB
    - Avatars: 5MB

### Google OAuth Not Working
- **Error**: "OAuth error"
  - **Solution**: Ensure `GOOGLE_CLIENT_SECRET` is set in `.env.local`
  - Check redirect URL matches your application URL

## Development Workflow

1. **Always start with Supabase running**
   ```bash
   npx supabase start
   ```

2. **Make database changes via migrations**
   - Never modify the database directly through the UI
   - Create migrations for all schema changes
   - Test migrations with `npx supabase db reset`

3. **Test your changes**
   - Run relevant test suites after changes
   - Add new tests for new functionality

4. **Commit migrations**
   - Migrations are in `supabase/migrations/`
   - Commit them with your code changes

## Next Steps

1. **Set up the frontend application** (when available)
2. **Configure additional API services**:
   - Voyage AI for embeddings
   - DeepSeek for question generation
   - Pinecone for vector search
3. **Review the technical specification** in `.agent-os/specs/`

## Support

For issues or questions:
- Check the [GitHub repository](https://github.com/domvmd/educudev2)
- Review migrations in `supabase/migrations/`
- Inspect test files in `supabase/tests/`

---

Happy coding! 🚀