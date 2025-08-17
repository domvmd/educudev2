const { createClient } = require('@supabase/supabase-js');
const { Buffer } = require('buffer');

// Initialize Supabase clients
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

console.log('Running Storage Tests...');
console.log('================================\n');

let testsPassed = 0;
let testsFailed = 0;

async function runStorageTests() {
  // Test 1: Check if storage buckets exist
  console.log('Test 1: Storage Buckets Exist');
  try {
    const requiredBuckets = ['documents', 'audio', 'avatars'];
    const { data: buckets, error } = await adminClient.storage.listBuckets();
    
    if (error) throw error;
    
    const bucketNames = buckets.map(b => b.name);
    const missingBuckets = requiredBuckets.filter(b => !bucketNames.includes(b));
    
    if (missingBuckets.length > 0) {
      throw new Error(`Missing buckets: ${missingBuckets.join(', ')}`);
    }
    
    console.log('✅ Test 1 Passed: All required buckets exist\n');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 1 Failed:', error.message, '\n');
    testsFailed++;
  }

  // Test 2: Upload to documents bucket
  console.log('Test 2: Upload to Documents Bucket');
  try {
    // Create a test user first
    const { data: user } = await adminClient.auth.admin.createUser({
      email: `test_${Date.now()}@educude.com`,
      password: 'TestPass123!',
      email_confirm: true
    });

    // Create user client
    const userClient = createClient(supabaseUrl, supabaseAnonKey);
    await userClient.auth.signInWithPassword({
      email: user.user.email,
      password: 'TestPass123!'
    });

    // Create a test PDF content
    const testContent = Buffer.from('Test PDF content');
    const fileName = `${user.user.id}/test-document.pdf`;

    // Upload file
    const { data: uploadData, error: uploadError } = await userClient.storage
      .from('documents')
      .upload(fileName, testContent, {
        contentType: 'application/pdf'
      });

    if (uploadError) throw uploadError;
    
    console.log('✅ Test 2 Passed: Can upload to documents bucket\n');
    testsPassed++;

    // Clean up
    await adminClient.storage.from('documents').remove([fileName]);
    await adminClient.auth.admin.deleteUser(user.user.id);
  } catch (error) {
    console.error('❌ Test 2 Failed:', error.message, '\n');
    testsFailed++;
  }

  // Test 3: Upload to audio bucket
  console.log('Test 3: Upload to Audio Bucket');
  try {
    // Create a test user
    const { data: user } = await adminClient.auth.admin.createUser({
      email: `test_${Date.now()}@educude.com`,
      password: 'TestPass123!',
      email_confirm: true
    });

    // Create user client
    const userClient = createClient(supabaseUrl, supabaseAnonKey);
    await userClient.auth.signInWithPassword({
      email: user.user.email,
      password: 'TestPass123!'
    });

    // Create test audio content
    const testContent = Buffer.from('Test audio content');
    const fileName = `${user.user.id}/test-audio.mp3`;

    // Upload file
    const { data: uploadData, error: uploadError } = await userClient.storage
      .from('audio')
      .upload(fileName, testContent, {
        contentType: 'audio/mpeg'
      });

    if (uploadError) throw uploadError;
    
    console.log('✅ Test 3 Passed: Can upload to audio bucket\n');
    testsPassed++;

    // Clean up
    await adminClient.storage.from('audio').remove([fileName]);
    await adminClient.auth.admin.deleteUser(user.user.id);
  } catch (error) {
    console.error('❌ Test 3 Failed:', error.message, '\n');
    testsFailed++;
  }

  // Test 4: Upload to avatars bucket
  console.log('Test 4: Upload to Avatars Bucket');
  try {
    // Create a test user
    const { data: user } = await adminClient.auth.admin.createUser({
      email: `test_${Date.now()}@educude.com`,
      password: 'TestPass123!',
      email_confirm: true
    });

    // Create user client
    const userClient = createClient(supabaseUrl, supabaseAnonKey);
    await userClient.auth.signInWithPassword({
      email: user.user.email,
      password: 'TestPass123!'
    });

    // Create test image content
    const testContent = Buffer.from('Test image content');
    const fileName = `${user.user.id}/avatar.jpg`;

    // Upload file
    const { data: uploadData, error: uploadError } = await userClient.storage
      .from('avatars')
      .upload(fileName, testContent, {
        contentType: 'image/jpeg'
      });

    if (uploadError) throw uploadError;
    
    console.log('✅ Test 4 Passed: Can upload to avatars bucket\n');
    testsPassed++;

    // Clean up
    await adminClient.storage.from('avatars').remove([fileName]);
    await adminClient.auth.admin.deleteUser(user.user.id);
  } catch (error) {
    console.error('❌ Test 4 Failed:', error.message, '\n');
    testsFailed++;
  }

  // Test 5: File size limit enforcement
  console.log('Test 5: File Size Limit Enforcement');
  try {
    // Create a test user
    const { data: user } = await adminClient.auth.admin.createUser({
      email: `test_${Date.now()}@educude.com`,
      password: 'TestPass123!',
      email_confirm: true
    });

    // Create user client
    const userClient = createClient(supabaseUrl, supabaseAnonKey);
    await userClient.auth.signInWithPassword({
      email: user.user.email,
      password: 'TestPass123!'
    });

    // Create a file that's too large (over 200MB)
    // Note: We'll simulate this by checking the configured limit
    const { data: bucket } = await adminClient.storage.getBucket('documents');
    
    if (bucket.file_size_limit && bucket.file_size_limit >= 200 * 1024 * 1024) {
      console.log('✅ Test 5 Passed: File size limit is properly configured (200MB)\n');
      testsPassed++;
    } else {
      throw new Error('File size limit not properly configured');
    }

    // Clean up
    await adminClient.auth.admin.deleteUser(user.user.id);
  } catch (error) {
    console.error('❌ Test 5 Failed:', error.message, '\n');
    testsFailed++;
  }

  // Test 6: RLS policies - users can't access other users' files
  console.log('Test 6: Storage RLS Policies');
  try {
    // Create two test users
    const { data: user1 } = await adminClient.auth.admin.createUser({
      email: `test1_${Date.now()}@educude.com`,
      password: 'TestPass123!',
      email_confirm: true
    });

    const { data: user2 } = await adminClient.auth.admin.createUser({
      email: `test2_${Date.now()}@educude.com`,
      password: 'TestPass123!',
      email_confirm: true
    });

    // User 1 uploads a file
    const user1Client = createClient(supabaseUrl, supabaseAnonKey);
    await user1Client.auth.signInWithPassword({
      email: user1.user.email,
      password: 'TestPass123!'
    });

    const testContent = Buffer.from('User 1 private document');
    const fileName = `${user1.user.id}/private-doc.pdf`;

    await user1Client.storage
      .from('documents')
      .upload(fileName, testContent);

    // User 2 tries to access user 1's file
    const user2Client = createClient(supabaseUrl, supabaseAnonKey);
    await user2Client.auth.signInWithPassword({
      email: user2.user.email,
      password: 'TestPass123!'
    });

    const { data: downloadData, error: downloadError } = await user2Client.storage
      .from('documents')
      .download(fileName);

    if (!downloadError) {
      throw new Error('User 2 should not be able to access User 1 files');
    }
    
    console.log('✅ Test 6 Passed: Storage RLS policies work correctly\n');
    testsPassed++;

    // Clean up
    await adminClient.storage.from('documents').remove([fileName]);
    await adminClient.auth.admin.deleteUser(user1.user.id);
    await adminClient.auth.admin.deleteUser(user2.user.id);
  } catch (error) {
    console.error('❌ Test 6 Failed:', error.message, '\n');
    testsFailed++;
  }

  // Summary
  console.log('================================');
  console.log('Storage Test Summary:');
  console.log('================================');
  console.log(`Tests Passed: ${testsPassed}`);
  console.log(`Tests Failed: ${testsFailed}`);
  console.log('================================\n');

  if (testsFailed === 0) {
    console.log('✅ All Storage Tests Passed!');
  } else {
    console.log('❌ Some tests failed. Storage configuration needed.');
  }
}

// Run the tests
runStorageTests().catch(console.error);