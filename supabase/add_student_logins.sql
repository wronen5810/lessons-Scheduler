CREATE TABLE IF NOT EXISTS student_logins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_email text NOT NULL,
  student_name text NOT NULL,
  logged_in_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS student_logins_teacher_id_idx ON student_logins(teacher_id);
CREATE INDEX IF NOT EXISTS student_logins_email_idx ON student_logins(student_email);
