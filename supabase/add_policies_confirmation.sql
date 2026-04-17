-- Add policy acceptance tracking to teacher subscription requests
ALTER TABLE teacher_subscription_requests
  ADD COLUMN IF NOT EXISTS policies_accepted_at TIMESTAMPTZ;
