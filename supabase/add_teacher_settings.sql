CREATE TABLE IF NOT EXISTS teacher_settings (
  teacher_id uuid PRIMARY KEY,
  default_duration_minutes integer NOT NULL DEFAULT 45,
  time_format text NOT NULL DEFAULT '24h' CHECK (time_format IN ('24h', '12h')),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE teacher_settings ENABLE ROW LEVEL SECURITY;
