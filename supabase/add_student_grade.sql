-- Add grade column to students table
-- Grade is stored as 1–12 (integer); display logic (א–י"ב vs 1–12) is in the frontend.

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS grade smallint CHECK (grade BETWEEN 1 AND 12);
