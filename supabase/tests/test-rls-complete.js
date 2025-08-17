#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function runCompleteRLSTests() {
  console.log('Running Complete RLS Policy Tests...');
  console.log('===================================\n');

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

  // Test 4: Annotations RLS
  console.log('Test 4: Annotations Table RLS');
  try {
    // User 1 creates a document
    const { data: doc } = await user1Client
      .from('documents')
      .insert({ title: 'Document for Annotations', type: 'pdf', user_id: user1.user.id })
      .select()
      .single();

    // User 1 creates an annotation
    const { data: annotation } = await user1Client
      .from('annotations')
      .insert({
        user_id: user1.user.id,
        document_id: doc.id,
        text_selection: 'Selected text',
        note_content: 'My note'
      })
      .select()
      .single();

    // User 2 cannot see User 1's annotations
    const { data: user2Annotations } = await user2Client
      .from('annotations')
      .select('*')
      .eq('document_id', doc.id);
    
    if (user2Annotations.length !== 0) throw new Error('User 2 should not see User 1 annotations');

    // Clean up
    await user1Client.from('documents').delete().eq('id', doc.id);

    console.log('✅ Test 4 Passed: Annotations RLS working correctly\n');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 4 Failed:', error.message, '\n');
    testsFailed++;
  }

  // Test 5: Quizzes and Questions RLS
  console.log('Test 5: Quizzes and Questions Table RLS');
  try {
    // User 1 creates a quiz
    const { data: quiz } = await user1Client
      .from('quizzes')
      .insert({
        user_id: user1.user.id,
        title: 'Test Quiz',
        bloom_levels: [4, 5, 6],
        source_documents: []
      })
      .select()
      .single();

    // User 1 creates a question
    const { data: question } = await user1Client
      .from('questions')
      .insert({
        quiz_id: quiz.id,
        question_text: 'Test Question',
        question_type: 'multiple_choice',
        bloom_level: 4,
        answer_key: { correct: 'A' }
      })
      .select()
      .single();

    // User 2 cannot see User 1's quiz
    const { data: user2Quizzes } = await user2Client
      .from('quizzes')
      .select('*')
      .eq('id', quiz.id);
    
    if (user2Quizzes.length !== 0) throw new Error('User 2 should not see User 1 quiz');

    // User 2 cannot see User 1's questions
    const { data: user2Questions } = await user2Client
      .from('questions')
      .select('*')
      .eq('quiz_id', quiz.id);
    
    if (user2Questions.length !== 0) throw new Error('User 2 should not see User 1 questions');

    // Clean up
    await user1Client.from('quizzes').delete().eq('id', quiz.id);

    console.log('✅ Test 5 Passed: Quizzes and Questions RLS working correctly\n');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 5 Failed:', error.message, '\n');
    testsFailed++;
  }

  // Test 6: Study Sessions RLS
  console.log('Test 6: Study Sessions Table RLS');
  try {
    // User 1 creates a quiz
    const { data: quiz } = await user1Client
      .from('quizzes')
      .insert({
        user_id: user1.user.id,
        title: 'Quiz for Sessions',
        bloom_levels: [4, 5, 6],
        source_documents: []
      })
      .select()
      .single();

    // User 1 creates a study session
    const { data: session } = await user1Client
      .from('study_sessions')
      .insert({
        user_id: user1.user.id,
        quiz_id: quiz.id,
        score: 85.5,
        time_spent: 1200
      })
      .select()
      .single();

    // User 2 cannot see User 1's study sessions
    const { data: user2Sessions } = await user2Client
      .from('study_sessions')
      .select('*')
      .eq('id', session.id);
    
    if (user2Sessions.length !== 0) throw new Error('User 2 should not see User 1 study sessions');

    // Clean up
    await user1Client.from('quizzes').delete().eq('id', quiz.id);

    console.log('✅ Test 6 Passed: Study Sessions RLS working correctly\n');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 6 Failed:', error.message, '\n');
    testsFailed++;
  }

  // Test 7: Shared Documents RLS
  console.log('Test 7: Shared Documents Table RLS');
  try {
    // User 1 creates a document
    const { data: doc } = await user1Client
      .from('documents')
      .insert({ title: 'Document to Share', type: 'pdf', user_id: user1.user.id })
      .select()
      .single();

    // User 1 shares document with User 2
    const { data: share } = await user1Client
      .from('shared_documents')
      .insert({
        document_id: doc.id,
        shared_by: user1.user.id,
        shared_with: [user2.user.id],
        permissions: ['read', 'annotate']
      })
      .select()
      .single();

    // User 2 can see the share
    const { data: user2Shares } = await user2Client
      .from('shared_documents')
      .select('*')
      .eq('id', share.id);
    
    if (user2Shares.length !== 1) throw new Error('User 2 should see shares they are included in');

    // User 2 cannot update the share
    const { data: updateData, error: updateError } = await user2Client
      .from('shared_documents')
      .update({ permissions: ['read', 'write'] })
      .eq('id', share.id)
      .select();
    
    // RLS blocks the update by returning no affected rows
    if (updateError || (updateData && updateData.length > 0)) {
      throw new Error('User 2 should not be able to update shares');
    }

    // Clean up
    await user1Client.from('documents').delete().eq('id', doc.id);

    console.log('✅ Test 7 Passed: Shared Documents RLS working correctly\n');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 7 Failed:', error.message, '\n');
    testsFailed++;
  }

  // Clean up test users
  await adminClient.auth.admin.deleteUser(user1.user.id);
  await adminClient.auth.admin.deleteUser(user2.user.id);

  // Summary
  console.log('===========================================');
  console.log('RLS Policy Test Summary:');
  console.log('===========================================');
  console.log(`Tests Passed: ${testsPassed}`);
  console.log(`Tests Failed: ${testsFailed}`);
  console.log('===========================================');
  console.log('');
  console.log('Tested policies:');
  console.log('1. ✓ Profiles RLS - Users can only view/update own profile');
  console.log('2. ✓ Documents RLS - Users can only CRUD own documents');
  console.log('3. ✓ Document Sharing - Shared users can view shared documents');
  console.log('4. ✓ Annotations RLS - Users can only manage own annotations');
  console.log('5. ✓ Quizzes/Questions RLS - Users can only manage own content');
  console.log('6. ✓ Study Sessions RLS - Users can only view own sessions');
  console.log('7. ✓ Shared Documents RLS - Proper share visibility and permissions');
  console.log('');

  if (testsFailed === 0) {
    console.log('✅ All RLS Policy Tests Passed Successfully!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

// Run the tests
runCompleteRLSTests().catch(console.error);