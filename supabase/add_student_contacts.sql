-- Add student_contacts table for multiple contacts per student.
-- Each student can have several contacts (parents, guardians, etc.).
-- One contact can be marked as primary — that contact's email/phone
-- is used for message delivery instead of the student's own details.
-- Run in: Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS student_contacts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id   uuid NOT NULL,
  name         text NOT NULL,
  relationship text,
  email        text,
  phone        text,
  is_primary   boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- At most one primary contact per student
CREATE UNIQUE INDEX IF NOT EXISTS student_contacts_primary_unique
  ON student_contacts (student_id)
  WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS student_contacts_student_id_idx
  ON student_contacts (student_id);

CREATE INDEX IF NOT EXISTS student_contacts_teacher_id_idx
  ON student_contacts (teacher_id);
