-- Fix: slot_templates unique constraint was blocking recreation of previously-deleted slots.
-- Deleted slots are soft-deleted (is_active = false), not removed.
-- Replace the plain unique constraint with a partial unique index that
-- only applies to active templates, so inactive rows never block new inserts.

ALTER TABLE slot_templates
  DROP CONSTRAINT IF EXISTS slot_templates_teacher_day_time_key;

CREATE UNIQUE INDEX IF NOT EXISTS slot_templates_teacher_day_time_active_key
  ON slot_templates (teacher_id, day_of_week, start_time)
  WHERE is_active = true;
