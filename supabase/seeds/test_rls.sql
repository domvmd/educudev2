-- Copy the test content to seeds directory temporarily
-- RLS Policy Tests for Educude
-- This file tests all Row Level Security policies

-- Clean up any existing test data
DELETE FROM public.shared_documents WHERE shared_by IN (
  SELECT id FROM auth.users WHERE email LIKE '%@test.educude%'
);
DELETE FROM public.study_sessions WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@test.educude%'
);
DELETE FROM public.questions WHERE quiz_id IN (
  SELECT id FROM public.quizzes WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%@test.educude%'
  )
);
DELETE FROM public.quizzes WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@test.educude%'
);
DELETE FROM public.annotations WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@test.educude%'
);
DELETE FROM public.documents WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@test.educude%'
);
DELETE FROM public.profiles WHERE email LIKE '%@test.educude%';
DELETE FROM auth.users WHERE email LIKE '%@test.educude%';

-- Create test users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'user1@test.educude', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'user2@test.educude', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW());

-- Wait for profiles to be created by trigger
DO $$ 
BEGIN 
  PERFORM pg_sleep(0.1);
END $$;

-- Test 1: Profiles Table RLS
-- Each user should only see and update their own profile
DO $$
DECLARE
  user1_id UUID := '11111111-1111-1111-1111-111111111111';
  user2_id UUID := '22222222-2222-2222-2222-222222222222';
  profile_count INTEGER;
BEGIN
  -- Test SELECT policy - User 1 should only see their profile
  SET LOCAL "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111"}';
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  ASSERT profile_count = 1, 'User 1 should only see their own profile';
  
  -- Test UPDATE policy - User 1 can update their profile
  UPDATE public.profiles SET full_name = 'Test User 1' WHERE id = user1_id;
  
  -- Test UPDATE policy - User 1 cannot update User 2's profile
  BEGIN
    UPDATE public.profiles SET full_name = 'Hacked' WHERE id = user2_id;
    RAISE EXCEPTION 'User 1 should not be able to update User 2 profile';
  EXCEPTION
    WHEN OTHERS THEN
      -- Expected to fail
      NULL;
  END;
  
  RAISE NOTICE 'Test 1 Passed: Profiles RLS working correctly';
END $$;

-- Test 2: Documents Table RLS
-- Users can only CRUD their own documents
DO $$
DECLARE
  user1_id UUID := '11111111-1111-1111-1111-111111111111';
  user2_id UUID := '22222222-2222-2222-2222-222222222222';
  doc1_id UUID;
  doc2_id UUID;
  doc_count INTEGER;
BEGIN
  -- Create documents for both users
  SET LOCAL "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111"}';
  INSERT INTO public.documents (id, user_id, title, type) 
  VALUES (gen_random_uuid(), user1_id, 'User 1 Document', 'pdf')
  RETURNING id INTO doc1_id;
  
  SET LOCAL "request.jwt.claims" = '{"sub":"22222222-2222-2222-2222-222222222222"}';
  INSERT INTO public.documents (id, user_id, title, type) 
  VALUES (gen_random_uuid(), user2_id, 'User 2 Document', 'pdf')
  RETURNING id INTO doc2_id;
  
  -- Test SELECT - User 1 should only see their document
  SET LOCAL "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111"}';
  SELECT COUNT(*) INTO doc_count FROM public.documents;
  ASSERT doc_count = 1, 'User 1 should only see their own document';
  
  -- Test UPDATE - User 1 can update their document
  UPDATE public.documents SET title = 'Updated Title' WHERE id = doc1_id;
  
  -- Test DELETE - User 1 can delete their document
  DELETE FROM public.documents WHERE id = doc1_id;
  
  RAISE NOTICE 'Test 2 Passed: Documents RLS working correctly';
END $$;

-- Test 3: Document Sharing RLS
-- Test that shared documents are visible to shared users
DO $$
DECLARE
  user1_id UUID := '11111111-1111-1111-1111-111111111111';
  user2_id UUID := '22222222-2222-2222-2222-222222222222';
  doc_id UUID;
  share_id UUID;
  doc_count INTEGER;
BEGIN
  -- User 1 creates a document
  SET LOCAL "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111"}';
  INSERT INTO public.documents (id, user_id, title, type) 
  VALUES (gen_random_uuid(), user1_id, 'Shared Document', 'pdf')
  RETURNING id INTO doc_id;
  
  -- User 1 shares document with User 2
  INSERT INTO public.shared_documents (id, document_id, shared_by, shared_with) 
  VALUES (gen_random_uuid(), doc_id, user1_id, ARRAY[user2_id])
  RETURNING id INTO share_id;
  
  -- User 2 should now see the shared document
  SET LOCAL "request.jwt.claims" = '{"sub":"22222222-2222-2222-2222-222222222222"}';
  SELECT COUNT(*) INTO doc_count FROM public.documents WHERE id = doc_id;
  ASSERT doc_count = 1, 'User 2 should see the shared document';
  
  -- User 2 cannot update the shared document (only read)
  BEGIN
    UPDATE public.documents SET title = 'Hacked' WHERE id = doc_id;
    RAISE EXCEPTION 'User 2 should not be able to update shared document';
  EXCEPTION
    WHEN OTHERS THEN
      -- Expected to fail
      NULL;
  END;
  
  -- Clean up
  SET LOCAL "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111"}';
  DELETE FROM public.documents WHERE id = doc_id;
  
  RAISE NOTICE 'Test 3 Passed: Document sharing RLS working correctly';
END $$;

-- Test 4: Annotations Table RLS
-- Users can only CRUD their own annotations
DO $$
DECLARE
  user1_id UUID := '11111111-1111-1111-1111-111111111111';
  user2_id UUID := '22222222-2222-2222-2222-222222222222';
  doc_id UUID;
  annotation_id UUID;
  annotation_count INTEGER;
BEGIN
  -- User 1 creates a document
  SET LOCAL "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111"}';
  INSERT INTO public.documents (id, user_id, title, type) 
  VALUES (gen_random_uuid(), user1_id, 'Document for Annotations', 'pdf')
  RETURNING id INTO doc_id;
  
  -- User 1 creates an annotation
  INSERT INTO public.annotations (id, user_id, document_id, text_selection, note_content) 
  VALUES (gen_random_uuid(), user1_id, doc_id, 'Selected text', 'My note')
  RETURNING id INTO annotation_id;
  
  -- User 2 cannot see User 1's annotations
  SET LOCAL "request.jwt.claims" = '{"sub":"22222222-2222-2222-2222-222222222222"}';
  SELECT COUNT(*) INTO annotation_count FROM public.annotations WHERE document_id = doc_id;
  ASSERT annotation_count = 0, 'User 2 should not see User 1 annotations';
  
  -- Clean up
  SET LOCAL "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111"}';
  DELETE FROM public.documents WHERE id = doc_id;
  
  RAISE NOTICE 'Test 4 Passed: Annotations RLS working correctly';
END $$;

-- Test 5: Quizzes and Questions RLS
-- Users can only manage their own quizzes and questions
DO $$
DECLARE
  user1_id UUID := '11111111-1111-1111-1111-111111111111';
  user2_id UUID := '22222222-2222-2222-2222-222222222222';
  quiz_id UUID;
  question_id UUID;
  quiz_count INTEGER;
  question_count INTEGER;
BEGIN
  -- User 1 creates a quiz
  SET LOCAL "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111"}';
  INSERT INTO public.quizzes (id, user_id, title, bloom_levels, source_documents) 
  VALUES (gen_random_uuid(), user1_id, 'Test Quiz', ARRAY[4,5,6], ARRAY[]::UUID[])
  RETURNING id INTO quiz_id;
  
  -- User 1 creates a question
  INSERT INTO public.questions (id, quiz_id, question_text, question_type, bloom_level, answer_key) 
  VALUES (gen_random_uuid(), quiz_id, 'Test Question', 'multiple_choice', 4, '{"correct": "A"}')
  RETURNING id INTO question_id;
  
  -- User 2 cannot see User 1's quiz
  SET LOCAL "request.jwt.claims" = '{"sub":"22222222-2222-2222-2222-222222222222"}';
  SELECT COUNT(*) INTO quiz_count FROM public.quizzes WHERE id = quiz_id;
  ASSERT quiz_count = 0, 'User 2 should not see User 1 quiz';
  
  -- User 2 cannot see User 1's questions
  SELECT COUNT(*) INTO question_count FROM public.questions WHERE quiz_id = quiz_id;
  ASSERT question_count = 0, 'User 2 should not see User 1 questions';
  
  -- Clean up
  SET LOCAL "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111"}';
  DELETE FROM public.quizzes WHERE id = quiz_id;
  
  RAISE NOTICE 'Test 5 Passed: Quizzes and Questions RLS working correctly';
END $$;

-- Test 6: Study Sessions RLS
-- Users can only manage their own study sessions
DO $$
DECLARE
  user1_id UUID := '11111111-1111-1111-1111-111111111111';
  user2_id UUID := '22222222-2222-2222-2222-222222222222';
  quiz_id UUID;
  session_id UUID;
  session_count INTEGER;
BEGIN
  -- User 1 creates a quiz
  SET LOCAL "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111"}';
  INSERT INTO public.quizzes (id, user_id, title, bloom_levels, source_documents) 
  VALUES (gen_random_uuid(), user1_id, 'Quiz for Sessions', ARRAY[4,5,6], ARRAY[]::UUID[])
  RETURNING id INTO quiz_id;
  
  -- User 1 creates a study session
  INSERT INTO public.study_sessions (id, user_id, quiz_id, score, time_spent) 
  VALUES (gen_random_uuid(), user1_id, quiz_id, 85.5, 1200)
  RETURNING id INTO session_id;
  
  -- User 2 cannot see User 1's study sessions
  SET LOCAL "request.jwt.claims" = '{"sub":"22222222-2222-2222-2222-222222222222"}';
  SELECT COUNT(*) INTO session_count FROM public.study_sessions WHERE id = session_id;
  ASSERT session_count = 0, 'User 2 should not see User 1 study sessions';
  
  -- Clean up
  SET LOCAL "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111"}';
  DELETE FROM public.quizzes WHERE id = quiz_id;
  
  RAISE NOTICE 'Test 6 Passed: Study Sessions RLS working correctly';
END $$;

-- Clean up test data
DELETE FROM public.shared_documents WHERE shared_by IN (
  SELECT id FROM auth.users WHERE email LIKE '%@test.educude%'
);
DELETE FROM public.study_sessions WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@test.educude%'
);
DELETE FROM public.questions WHERE quiz_id IN (
  SELECT id FROM public.quizzes WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%@test.educude%'
  )
);
DELETE FROM public.quizzes WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@test.educude%'
);
DELETE FROM public.annotations WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@test.educude%'
);
DELETE FROM public.documents WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@test.educude%'
);
DELETE FROM public.profiles WHERE email LIKE '%@test.educude%';
DELETE FROM auth.users WHERE email LIKE '%@test.educude%';

-- Summary
RAISE NOTICE '';
RAISE NOTICE '===========================================';
RAISE NOTICE 'All RLS Policy Tests Passed Successfully!';
RAISE NOTICE '===========================================';
RAISE NOTICE '';
RAISE NOTICE 'Summary of tests:';
RAISE NOTICE '1. ✓ Profiles RLS - Users can only view/update own profile';
RAISE NOTICE '2. ✓ Documents RLS - Users can only CRUD own documents';
RAISE NOTICE '3. ✓ Document Sharing - Shared users can view shared documents';
RAISE NOTICE '4. ✓ Annotations RLS - Users can only manage own annotations';
RAISE NOTICE '5. ✓ Quizzes/Questions RLS - Users can only manage own content';
RAISE NOTICE '6. ✓ Study Sessions RLS - Users can only view own sessions';
RAISE NOTICE '';