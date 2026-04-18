ALTER TABLE teacher_subscription_requests
  ADD COLUMN IF NOT EXISTS starts_after DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
