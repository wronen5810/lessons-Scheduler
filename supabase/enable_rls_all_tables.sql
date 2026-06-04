-- Enable Row Level Security on all application tables.
--
-- The app uses the service role key for every server-side query,
-- which bypasses RLS entirely, so this has no functional impact.
-- The benefit: direct anon-key access (e.g. from a decompiled app
-- or leaked credentials) returns no rows by default.
--
-- Uses a DO block so tables that don't exist yet are silently skipped.
-- Run in: Supabase Dashboard → SQL Editor

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'admin_settings',
    'booking_notes',
    'group_booking_payments',
    'leads',
    'messages',
    'notebook_files',
    'notebook_grades',
    'notebook_group_homework',
    'notebook_group_notes',
    'notebook_group_resources',
    'notebook_homework',
    'notebook_notes',
    'notebook_resources',
    'one_time_bookings',
    'one_time_slots',
    'profiles',
    'push_tokens',
    'recurring_bookings',
    'recurring_reminders',
    'slot_overrides',
    'slot_templates',
    'student_access_requests',
    'student_group_members',
    'student_groups',
    'student_logins',
    'student_otp_codes',
    'student_payments',
    'students',
    'subscription_plans',
    'teacher_logins',
    'teacher_settings',
    'teacher_subscription_requests',
    'teacher_subscriptions'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      RAISE NOTICE 'RLS enabled on %', t;
    ELSE
      RAISE NOTICE 'Skipped (table does not exist): %', t;
    END IF;
  END LOOP;
END $$;
