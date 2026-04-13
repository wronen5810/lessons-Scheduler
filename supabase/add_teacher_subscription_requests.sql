CREATE TABLE IF NOT EXISTS teacher_subscription_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  comments text,
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS teacher_subscription_requests_status_idx ON teacher_subscription_requests(status);
