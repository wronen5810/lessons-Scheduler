-- Add privacy_accepted_at to students table
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS privacy_accepted_at timestamptz;
