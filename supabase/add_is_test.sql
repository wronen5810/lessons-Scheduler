-- Mark teacher accounts as test/demo accounts so they can be filtered out of reports
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
