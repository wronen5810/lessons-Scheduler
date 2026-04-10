ALTER TABLE teacher_settings
  DROP COLUMN IF EXISTS notification_channel;

ALTER TABLE teacher_settings
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT '{
    "lesson_request":   "email",
    "lesson_approved":  "email",
    "lesson_rejected":  "email",
    "lesson_cancelled": "email",
    "lesson_reminder":  "email",
    "access_request":   "email"
  }';
