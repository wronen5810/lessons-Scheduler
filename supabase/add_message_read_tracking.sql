-- Add read tracking to messages table
-- Run this in the Supabase SQL editor

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Index to quickly count unread messages
CREATE INDEX IF NOT EXISTS messages_unread_idx
  ON messages (teacher_id, direction, read_at)
  WHERE read_at IS NULL AND direction = 'to_teacher';
