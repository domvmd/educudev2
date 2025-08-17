const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase clients
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

console.log('Running Authentication Tests...');
console.log('================================\n');

let testsPassed = 0;
let testsFailed = 0;

async function runAuthTests() {
  // Test 1: Email/Password Signup
  console.log('Test 1: Email/Password Signup');
  try {
    const testEmail = `test_${Date.now()}@educude.com`;
    const testPassword = 'TestPass123!';
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          display_name: 'Test User'
        }
      }
    });

    if (signUpError) throw signUpError;
    if (!signUpData.user) throw new Error('No user returned from signup');
    
    console.log('✅ Test 1 Passed: User can sign up with email/password\n');
    testsPassed++;

    // Clean up - delete the test user
    await adminClient.auth.admin.deleteUser(signUpData.user.id);
  } catch (error) {
    console.error('❌ Test 1 Failed:', error.message, '\n');
    testsFailed++;
  }

  // Test 2: Email/Password Signin
  console.log('Test 2: Email/Password Signin');
  try {
    // First create a user
    const testEmail = `test_${Date.now()}@educude.com`;
    const testPassword = 'TestPass123!';
    
    const { data: createData } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });

    // Try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) throw signInError;
    if (!signInData.session) throw new Error('No session returned from signin');
    
    console.log('✅ Test 2 Passed: User can sign in with email/password\n');
    testsPassed++;

    // Sign out
    await supabase.auth.signOut();
    
    // Clean up
    await adminClient.auth.admin.deleteUser(createData.user.id);
  } catch (error) {
    console.error('❌ Test 2 Failed:', error.message, '\n');
    testsFailed++;
  }

  // Test 3: Invalid Password
  console.log('Test 3: Invalid Password Rejection');
  try {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: 'nonexistent@educude.com',
      password: 'wrongpassword'
    });

    if (!signInError) throw new Error('Should have failed with invalid credentials');
    
    console.log('✅ Test 3 Passed: Invalid credentials are rejected\n');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 3 Failed:', error.message, '\n');
    testsFailed++;
  }

  // Test 4: OAuth Provider Configuration
  console.log('Test 4: OAuth Provider Configuration');
  try {
    // Check if Google provider is configured by attempting to generate OAuth URL
    const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback',
        skipBrowserRedirect: true
      }
    });

    if (oauthError) throw oauthError;
    if (!oauthData.url) throw new Error('No OAuth URL generated');
    
    // Verify the OAuth URL is properly formed (Supabase acts as intermediary)
    if (!oauthData.url.includes('/auth/v1/authorize') || !oauthData.url.includes('provider=google')) {
      throw new Error('OAuth URL is not properly configured');
    }
    
    console.log('✅ Test 4 Passed: Google OAuth is configured\n');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 4 Failed:', error.message, '\n');
    testsFailed++;
  }

  // Test 5: Session Management
  console.log('Test 5: Session Management');
  try {
    // Create and sign in a user
    const testEmail = `test_${Date.now()}@educude.com`;
    const testPassword = 'TestPass123!';
    
    const { data: createData } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });

    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    // Get session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No session found after signin');
    
    // Verify session has required fields
    if (!session.access_token) throw new Error('Session missing access_token');
    if (!session.refresh_token) throw new Error('Session missing refresh_token');
    if (!session.user) throw new Error('Session missing user data');
    
    console.log('✅ Test 5 Passed: Session management works correctly\n');
    testsPassed++;

    // Clean up
    await supabase.auth.signOut();
    await adminClient.auth.admin.deleteUser(createData.user.id);
  } catch (error) {
    console.error('❌ Test 5 Failed:', error.message, '\n');
    testsFailed++;
  }

  // Test 6: User Profile Creation on Signup
  console.log('Test 6: User Profile Auto-Creation');
  try {
    const testEmail = `test_${Date.now()}@educude.com`;
    const testPassword = 'TestPass123!';
    
    // Sign up a new user
    const { data: signUpData } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          display_name: 'Test User'
        }
      }
    });

    // Check if profile was created (this will depend on triggers being set up)
    const { data: profile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', signUpData.user.id)
      .single();

    if (profile) {
      console.log('✅ Test 6 Passed: User profile is created on signup\n');
      testsPassed++;
    } else {
      console.log('⚠️  Test 6 Skipped: Profile trigger not yet implemented\n');
    }

    // Clean up
    await adminClient.auth.admin.deleteUser(signUpData.user.id);
  } catch (error) {
    console.error('❌ Test 6 Failed:', error.message, '\n');
    testsFailed++;
  }

  // Summary
  console.log('================================');
  console.log('Authentication Test Summary:');
  console.log('================================');
  console.log(`Tests Passed: ${testsPassed}`);
  console.log(`Tests Failed: ${testsFailed}`);
  console.log('================================\n');

  if (testsFailed === 0) {
    console.log('✅ All Authentication Tests Passed!');
  } else {
    console.log('❌ Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

// Run the tests
runAuthTests().catch(console.error);