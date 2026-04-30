CREATE TABLE IF NOT EXISTS teacher_logins (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_in_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS teacher_logins_teacher_id_idx ON teacher_logins(teacher_id);
CREATE INDEX IF NOT EXISTS teacher_logins_at_idx ON teacher_logins(logged_in_at DESC);
