#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function runRLSTests() {
  console.log('Running RLS Policy Tests...');
  console.log('==========================\n');

  // Create admin client for setup
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  // Clean up any existing test users
  await adminClient.auth.admin.deleteUser('11111111-1111-1111-1111-111111111111').catch(() => {});
  await adminClient.auth.admin.deleteUser('22222222-2222-2222-2222-222222222222').catch(() => {});

  // Create test users
  const { data: user1, error: error1 } = await adminClient.auth.admin.createUser({
    email: 'user1@test.educude',
    password: 'password123',
    email_confirm: true,
    user_metadata: { id: '11111111-1111-1111-1111-111111111111' }
  });

  const { data: user2, error: error2 } = await adminClient.auth.admin.createUser({
    email: 'user2@test.educude',
    password: 'password123',
    email_confirm: true,
    user_metadata: { id: '22222222-2222-2222-2222-222222222222' }
  });

  if (error1 || error2) {
    console.error('Failed to create test users:', error1 || error2);
    return;
  }

  // Create authenticated clients for each user
  const { data: session1 } = await adminClient.auth.signInWithPassword({
    email: 'user1@test.educude',
    password: 'password123'
  });
  const user1Client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${session1.session.access_token}` } }
  });

  const { data: session2 } = await adminClient.auth.signInWithPassword({
    email: 'user2@test.educude',
    password: 'password123'
  });
  const user2Client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${session2.session.access_token}` } }
  });

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Profiles RLS
  console.log('Test 1: Profiles Table RLS');
  try {
    // User 1 should only see their profile
    const { data: profiles, error } = await user1Client.from('profiles').select('*');
    if (error) throw error;
    if (profiles.length !== 1) throw new Error('User 1 should only see their own profile');
    
    // User 1 can update their profile
    const { error: updateError } = await user1Client
      .from('profiles')
      .update({ full_name: 'Test User 1' })
      .eq('id', user1.user.id);
    if (updateError) throw updateError;

    console.log('✅ Test 1 Passed: Profiles RLS working correctly\n');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 1 Failed:', error.message, '\n');
    testsFailed++;
  }

  // Test 2: Documents RLS
  console.log('Test 2: Documents Table RLS');
  try {
    // User 1 creates a document
    const { data: doc1, error: docError1 } = await user1Client
      .from('documents')
      .insert({ title: 'User 1 Document', type: 'pdf', user_id: user1.user.id })
      .select()
      .single();
    if (docError1) throw docError1;

    // User 2 creates a document
    const { data: doc2, error: docError2 } = await user2Client
      .from('documents')
      .insert({ title: 'User 2 Document', type: 'pdf', user_id: user2.user.id })
      .select()
      .single();
    if (docError2) throw docError2;

    // User 1 should only see their document
    const { data: user1Docs } = await user1Client.from('documents').select('*');
    if (user1Docs.length !== 1) throw new Error('User 1 should only see their own document');

    // Clean up
    await user1Client.from('documents').delete().eq('id', doc1.id);
    await user2Client.from('documents').delete().eq('id', doc2.id);

    console.log('✅ Test 2 Passed: Documents RLS working correctly\n');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 2 Failed:', error.message, '\n');
    testsFailed++;
  }

  // Test 3: Document Sharing
  console.log('Test 3: Document Sharing RLS');
  try {
    // User 1 creates a document
    const { data: doc } = await user1Client
      .from('documents')
      .insert({ title: 'Shared Document', type: 'pdf', user_id: user1.user.id })
      .select()
      .single();

    // User 1 shares document with User 2
    await user1Client
      .from('shared_documents')
      .insert({
        document_id: doc.id,
        shared_by: user1.user.id,
        shared_with: [user2.user.id]
      });

    // User 2 should now see the shared document
    const { data: sharedDocs } = await user2Client
      .from('documents')
      .select('*')
      .eq('id', doc.id);
    if (sharedDocs.length !== 1) throw new Error('User 2 should see the shared document');

    // Clean up
    await user1Client.from('documents').delete().eq('id', doc.id);

    console.log('✅ Test 3 Passed: Document sharing RLS working correctly\n');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 3 Failed:', error.message, '\n');
    testsFailed++;
  }

  // Clean up test users
  await adminClient.auth.admin.deleteUser(user1.user.id);
  await adminClient.auth.admin.deleteUser(user2.user.id);

  // Summary
  console.log('===========================================');
  console.log(`Tests Passed: ${testsPassed}`);
  console.log(`Tests Failed: ${testsFailed}`);
  console.log('===========================================');

  if (testsFailed === 0) {
    console.log('\n✅ All RLS Policy Tests Passed Successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

// Check if we have the required dependency
try {
  require('@supabase/supabase-js');
} catch (error) {
  console.log('Installing @supabase/supabase-js...');
  require('child_process').execSync('npm install @supabase/supabase-js', { stdio: 'inherit' });
}

// Run the tests
runRLSTests().catch(console.error);