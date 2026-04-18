-- Add plan fields to teacher_subscriptions
ALTER TABLE teacher_subscriptions
  ADD COLUMN IF NOT EXISTS free_period_days INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_charge NUMERIC(10,2) DEFAULT NULL;

-- Admin settings table for global defaults
CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default monthly charge: 20 NIS
INSERT INTO admin_settings (key, value)
VALUES ('default_monthly_charge', '20')
ON CONFLICT (key) DO NOTHING;
