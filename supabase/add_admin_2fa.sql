-- Store TOTP secret directly on profiles for admin 2FA.
-- Teachers use teacher_settings.totp_secret; admin uses profiles.totp_secret.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS totp_secret text;
