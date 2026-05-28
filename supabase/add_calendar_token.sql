-- Add calendar_token to teacher_settings for ICS feed authentication.
-- Each teacher gets a unique secret token that forms their calendar subscription URL.
-- Run in: Supabase Dashboard → SQL Editor

ALTER TABLE teacher_settings
  ADD COLUMN IF NOT EXISTS calendar_token text;

CREATE UNIQUE INDEX IF NOT EXISTS teacher_settings_calendar_token_unique
  ON teacher_settings (calendar_token)
  WHERE calendar_token IS NOT NULL;
