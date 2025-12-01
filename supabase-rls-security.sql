-- ============================================
-- Supabase RLS Security Configuration
-- ============================================
-- This file contains SQL commands to secure your law_chunks table
-- Execute these in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- 1. Enable Row Level Security on law_chunks table
ALTER TABLE law_chunks ENABLE ROW LEVEL SECURITY;

-- 2. Allow everyone to READ (SELECT) data
-- This is safe because it's a public knowledge base
CREATE POLICY "Allow public read access"
ON law_chunks
FOR SELECT
TO public
USING (true);

-- 3. Allow SERVICE ROLE to INSERT data
-- Only your backend (with service_role key) can add new chunks
CREATE POLICY "Allow service role to insert"
ON law_chunks
FOR INSERT
TO service_role
WITH CHECK (true);

-- 4. Allow SERVICE ROLE to UPDATE data
-- Only your backend can update existing chunks
CREATE POLICY "Allow service role to update"
ON law_chunks
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Allow SERVICE ROLE to DELETE data
-- Only your backend can delete chunks
CREATE POLICY "Allow service role to delete"
ON law_chunks
FOR DELETE
TO service_role
USING (true);

-- ============================================
-- Verification Queries (Optional)
-- ============================================
-- After running the above, verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'law_chunks';

-- Check all policies:
-- SELECT * FROM pg_policies WHERE tablename = 'law_chunks';

-- ============================================
-- NOTES:
-- ============================================
-- 1. This configuration allows:
--    - Anyone to READ the knowledge base (public access)
--    - Only your backend to WRITE/UPDATE/DELETE (via service_role key)
--
-- 2. Your backend uses SUPABASE_KEY (service role) from .env
--    So it will have full access to INSERT/UPDATE/DELETE
--
-- 3. Frontend or any other user can only READ (SELECT)
--    This is perfect for a shared knowledge base!
