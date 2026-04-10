CREATE TABLE IF NOT EXISTS student_access_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id uuid NOT NULL,
  student_name text NOT NULL,
  student_email text NOT NULL,
  student_phone text,
  student_note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE student_access_requests ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS student_access_requests_teacher ON student_access_requests (teacher_id);
