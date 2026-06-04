-- Add TOTP secret storage to teacher_settings
ALTER TABLE teacher_settings ADD COLUMN IF NOT EXISTS totp_secret text;

-- Add fast-check flag to profiles (avoids extra join in requireTeacher)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS totp_enabled boolean NOT NULL DEFAULT false;
