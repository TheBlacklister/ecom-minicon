-- Debug script to verify reviews table and policies exist
-- Run this in your Supabase SQL Editor

-- Check if reviews table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE  table_schema = 'public'
   AND    table_name   = 'reviews'
);

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'reviews'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'reviews';

-- Test inserting a sample review (you'll need to replace the UUIDs)
-- INSERT INTO reviews (user_id, product_id, rating, comment) 
-- VALUES ('your-user-id-here', 1, 5, 'Test review');

-- Check if there are any reviews
SELECT COUNT(*) as review_count FROM reviews;