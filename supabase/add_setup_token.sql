-- One-time password setup token for new teachers
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS setup_token TEXT,
  ADD COLUMN IF NOT EXISTS setup_token_expires_at TIMESTAMPTZ;
