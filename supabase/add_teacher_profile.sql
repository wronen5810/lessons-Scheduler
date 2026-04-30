-- Add teacher public profile fields to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS show_photo BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_description BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_bio BOOLEAN NOT NULL DEFAULT false;
