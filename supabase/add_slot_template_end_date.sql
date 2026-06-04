-- Add optional end_date to slot_templates.
-- When set, the recurring slot stops appearing on dates after end_date.
ALTER TABLE slot_templates ADD COLUMN IF NOT EXISTS end_date date;
