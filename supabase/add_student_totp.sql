-- Add TOTP secret storage to students (for Google Authenticator 2FA)
ALTER TABLE students ADD COLUMN IF NOT EXISTS totp_secret text;

-- Drop the email-OTP table from the previous migration (no longer used)
DROP TABLE IF EXISTS student_otp_codes;
