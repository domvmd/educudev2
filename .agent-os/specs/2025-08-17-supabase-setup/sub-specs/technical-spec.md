# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-17-supabase-setup/spec.md

> Created: 2025-08-17
> Version: 1.0.0

## Technical Requirements

### Prerequisites
- Docker Desktop installed and running
- Node.js 20+ installed
- Terminal access (bash/zsh)

### Supabase CLI Setup
- Install Supabase CLI globally via npm
- Initialize Supabase project in the repository root
- Configure local development settings

### Database Schema Requirements
- All tables must use UUID primary keys
- Timestamps should use TIMESTAMPTZ for timezone awareness
- Foreign keys must have appropriate CASCADE rules
- Indexes on frequently queried columns

### Authentication Requirements
- Enable email/password authentication
- Prepare Google OAuth configuration (client ID placeholder)
- Set up proper redirect URLs for local development
- Configure JWT expiry and refresh settings

### Storage Configuration
- Create three buckets: `documents`, `audio`, `avatars`
- Set appropriate file size limits (200MB for documents)
- Configure MIME type restrictions
- Implement public/private access policies

### Migration Strategy
- Each table creation in a separate migration file
- RLS policies in dedicated migration files
- Seed migration for initial configuration (optional)

## Approach Options

**Option A:** Single migration file for all tables
- Pros: Simpler, faster initial setup
- Cons: Harder to modify individual tables later

**Option B:** Separate migration file per table (Selected)
- Pros: Better organization, easier modifications, clearer history
- Cons: More files to manage

**Rationale:** Separate migrations provide better maintainability and clearer change history, which is important for a collaborative project.

## External Dependencies

- **Supabase CLI** - Local development environment
- **Justification:** Required for local Supabase stack

- **Docker** - Container runtime for Supabase services
- **Justification:** Supabase CLI uses Docker to run local services

No additional npm packages needed at this stage.