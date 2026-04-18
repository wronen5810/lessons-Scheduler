ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'new'
    CHECK (plan_type IN ('new', 'renewal', 'both'));
