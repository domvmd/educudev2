# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-17-supabase-setup/spec.md

> Created: 2025-08-17
> Version: 1.0.0

## Test Coverage

### Unit Tests

**Database Schema Validation**
- Verify all tables exist with correct columns
- Check data types and constraints
- Validate foreign key relationships
- Test default values and auto-generated fields

**RLS Policy Tests**
- Test user can only see their own documents
- Test shared document access works correctly
- Verify users cannot access others' data
- Test policy enforcement for INSERT, UPDATE, DELETE

### Integration Tests

**Authentication Flow**
- Test email/password signup
- Test email/password signin
- Test password reset flow
- Test JWT token generation and refresh

**Storage Access**
- Test file upload to documents bucket
- Test file size limit enforcement
- Test MIME type restrictions
- Test access control for private files

### Feature Tests

**End-to-End Scenarios**
- Create user → Create document → Add annotation
- Create quiz → Add questions → Start study session
- Share document → Access as shared user
- Upload PDF → Verify storage → Create document record

### Mocking Requirements

- **No external services to mock** - All tests run against local Supabase instance
- **Test data cleanup** - Each test should clean up after itself
- **Test user creation** - Use Supabase auth helpers for test users