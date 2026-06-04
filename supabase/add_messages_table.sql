-- Persistent message log so students can read messages in their portal
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_email text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('to_student', 'to_teacher')),
  body text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_teacher_student_idx
  ON messages(teacher_id, student_email, sent_at DESC);

-- Students and teachers can read their own messages; service role used for inserts
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
