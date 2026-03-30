-- ============================================================
-- Add profiles table to support admin and teacher roles
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id           uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role         text        NOT NULL DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher')),
  display_name text        NOT NULL DEFAULT '',
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- BACKFILL: insert a profile row for every existing auth user.
-- Run this after creating the table.
-- Set your admin user's role to 'admin' manually afterward.
-- ============================================================

-- Insert profiles for all existing users (defaulting to teacher role)
INSERT INTO profiles (id, display_name)
SELECT id, COALESCE(email, '') FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Then promote your admin user:
-- UPDATE profiles SET role = 'admin' WHERE id = '<your-admin-user-id>';
