-- Add calendar sync token to students table
-- Run this in the Supabase SQL editor

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS calendar_token text;

CREATE UNIQUE INDEX IF NOT EXISTS students_calendar_token_unique
  ON students (calendar_token)
  WHERE calendar_token IS NOT NULL;
