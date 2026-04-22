CREATE TABLE IF NOT EXISTS notebook_grades (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_email text       NOT NULL,
  test_date    date        NOT NULL,
  grade        text        NOT NULL,
  comments     text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notebook_grades_lookup
  ON notebook_grades (teacher_id, student_email, test_date);
