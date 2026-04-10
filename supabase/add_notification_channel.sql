ALTER TABLE teacher_settings
  ADD COLUMN IF NOT EXISTS notification_channel text NOT NULL DEFAULT 'email'
  CHECK (notification_channel IN ('email', 'whatsapp', 'both'));
