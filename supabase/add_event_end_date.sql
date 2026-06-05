-- Add end date/time to calendar_events for multi-day event support
-- Run in Supabase Dashboard → SQL Editor

ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS event_end_date date,
  ADD COLUMN IF NOT EXISTS event_end_time time;
