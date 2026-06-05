-- Calendar Events: teacher and student non-lesson events shown on calendar
-- Run in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS calendar_events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by        text NOT NULL DEFAULT 'teacher'
                      CHECK (created_by IN ('teacher', 'student')),
  student_id        uuid REFERENCES students(id) ON DELETE SET NULL,
  event_type        text NOT NULL
                      CHECK (event_type IN ('exam', 'task', 'paperwork', 'vacation', 'other')),
  description       text NOT NULL,
  event_date        date NOT NULL,
  event_time        time,
  reminder_days     smallint,
  reminder_channels jsonb,   -- {email:bool, whatsapp:bool, push:bool}
  reminder_sent     boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calendar_event_students (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   uuid NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE (event_id, student_id)
);

CREATE INDEX IF NOT EXISTS calendar_events_teacher_date
  ON calendar_events (teacher_id, event_date);
CREATE INDEX IF NOT EXISTS calendar_events_student_id
  ON calendar_events (student_id);
CREATE INDEX IF NOT EXISTS ces_event_id
  ON calendar_event_students (event_id);
CREATE INDEX IF NOT EXISTS ces_student_id
  ON calendar_event_students (student_id);

-- RLS: teachers manage their own events
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_event_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_own_events"
  ON calendar_events FOR ALL
  USING (teacher_id = auth.uid());

CREATE POLICY "teacher_own_event_students"
  ON calendar_event_students FOR ALL
  USING (
    event_id IN (
      SELECT id FROM calendar_events WHERE teacher_id = auth.uid()
    )
  );
