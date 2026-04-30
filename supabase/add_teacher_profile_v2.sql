-- Add tutoring area, quote and page color fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tutoring_area TEXT,
  ADD COLUMN IF NOT EXISTS quote TEXT,
  ADD COLUMN IF NOT EXISTS page_color TEXT NOT NULL DEFAULT '#4A9E8A';
