-- Add 2FA flag to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS two_factor_enabled boolean NOT NULL DEFAULT false;

-- OTP codes for student email-based 2FA
CREATE TABLE IF NOT EXISTS student_otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS student_otp_codes_email_idx ON student_otp_codes (email);
