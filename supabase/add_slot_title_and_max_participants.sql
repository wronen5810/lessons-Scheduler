-- Add title and max_participants to slot_templates
ALTER TABLE slot_templates
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS max_participants INTEGER NOT NULL DEFAULT 1
    CHECK (max_participants >= 1);

-- Add title and max_participants to one_time_slots
ALTER TABLE one_time_slots
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS max_participants INTEGER NOT NULL DEFAULT 1
    CHECK (max_participants >= 1);
