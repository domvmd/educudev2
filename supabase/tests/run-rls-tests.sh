#!/bin/bash

# Run RLS Policy Tests for Educude

echo "Running RLS Policy Tests..."
echo "=========================="

# Run the SQL test file against the local database
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f supabase/tests/rls-policies.test.sql 2>&1 | tee test-results.log

# Check if tests passed
if grep -q "All RLS Policy Tests Passed Successfully!" test-results.log; then
    echo ""
    echo "✅ All RLS tests passed!"
    exit 0
else
    echo ""
    echo "❌ Some RLS tests failed. Check test-results.log for details."
    exit 1
fi