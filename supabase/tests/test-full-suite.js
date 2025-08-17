#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Running Full Educude Test Suite\n');
console.log('=====================================\n');

const tests = [
  {
    name: 'Authentication Tests',
    file: 'test-auth.js',
    description: 'Testing email/password and OAuth authentication'
  },
  {
    name: 'Storage Tests', 
    file: 'test-storage.js',
    description: 'Testing storage buckets and policies'
  },
  {
    name: 'RLS Policy Tests',
    file: 'test-rls-complete.js',
    description: 'Testing Row Level Security on all tables'
  }
];

let currentTest = 0;
let passed = 0;
let failed = 0;

function runTest(index) {
  if (index >= tests.length) {
    // All tests complete
    console.log('\n=====================================');
    console.log('📊 Test Suite Summary');
    console.log('=====================================');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📋 Total: ${tests.length}`);
    console.log('=====================================\n');
    
    if (failed === 0) {
      console.log('🎉 All tests passed! The Educude platform is ready for development.\n');
      process.exit(0);
    } else {
      console.log('⚠️  Some tests failed. Please check the errors above.\n');
      process.exit(1);
    }
    return;
  }

  const test = tests[index];
  console.log(`\n📝 Running ${test.name}`);
  console.log(`   ${test.description}`);
  console.log('-------------------------------------\n');

  const testProcess = spawn('node', [path.join(__dirname, test.file)], {
    stdio: 'inherit'
  });

  testProcess.on('close', (code) => {
    if (code === 0) {
      passed++;
      console.log(`\n✅ ${test.name} completed successfully`);
    } else {
      failed++;
      console.log(`\n❌ ${test.name} failed with code ${code}`);
    }
    
    // Run next test
    runTest(index + 1);
  });

  testProcess.on('error', (err) => {
    console.error(`\n❌ Failed to run ${test.name}:`, err);
    failed++;
    runTest(index + 1);
  });
}

// Check if Supabase is running first
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

// Test connection
supabase
  .from('profiles')
  .select('count')
  .single()
  .then(() => {
    console.log('✅ Supabase is running\n');
    // Start running tests
    runTest(0);
  })
  .catch((err) => {
    console.error('❌ Cannot connect to Supabase. Make sure it\'s running:');
    console.error('   npx supabase start\n');
    process.exit(1);
  });