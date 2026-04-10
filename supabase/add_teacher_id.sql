-- ============================================================
-- Add teacher_id to support multiple teachers
-- Each teacher only sees and manages their own data.
-- ============================================================

-- Add teacher_id columns (nullable first to allow backfill of existing rows)
ALTER TABLE slot_templates     ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE slot_overrides     ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE one_time_slots     ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE students           ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE recurring_bookings ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE one_time_bookings  ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================
-- BACKFILL: set teacher_id on all existing rows to your user ID.
-- Find your user ID in Supabase → Authentication → Users.
-- Replace the placeholder below and run this block:
-- ============================================================
-- UPDATE slot_templates     SET teacher_id = '<your-user-id>' WHERE teacher_id IS NULL;
-- UPDATE slot_overrides     SET teacher_id = '<your-user-id>' WHERE teacher_id IS NULL;
-- UPDATE one_time_slots     SET teacher_id = '<your-user-id>' WHERE teacher_id IS NULL;
-- UPDATE students           SET teacher_id = '<your-user-id>' WHERE teacher_id IS NULL;
-- UPDATE recurring_bookings SET teacher_id = '<your-user-id>' WHERE teacher_id IS NULL;
-- UPDATE one_time_bookings  SET teacher_id = '<your-user-id>' WHERE teacher_id IS NULL;
-- ============================================================

-- After backfilling, update unique constraints to be teacher-scoped:

-- slot_templates: was unique on (day_of_week, start_time); now per teacher
ALTER TABLE slot_templates DROP CONSTRAINT IF EXISTS slot_templates_day_of_week_start_time_key;
ALTER TABLE slot_templates ADD CONSTRAINT slot_templates_teacher_day_time_key
  UNIQUE (teacher_id, day_of_week, start_time);

-- one_time_slots: was unique on (specific_date, start_time); now per teacher
ALTER TABLE one_time_slots DROP CONSTRAINT IF EXISTS one_time_slots_specific_date_start_time_key;
ALTER TABLE one_time_slots ADD CONSTRAINT one_time_slots_teacher_date_time_key
  UNIQUE (teacher_id, specific_date, start_time);

-- students: was unique on email globally; now per teacher (same student can be with multiple teachers)
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_email_key;
ALTER TABLE students ADD CONSTRAINT students_teacher_email_key
  UNIQUE (teacher_id, email);
