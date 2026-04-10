-- Student Notebook: homework, notes, resources

CREATE TABLE IF NOT EXISTS notebook_homework (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id uuid NOT NULL,
  student_email text NOT NULL,
  due_date date,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notebook_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id uuid NOT NULL,
  student_email text NOT NULL,
  note text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notebook_resources (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id uuid NOT NULL,
  student_email text NOT NULL,
  description text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notebook_homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebook_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebook_resources ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS notebook_homework_lookup ON notebook_homework (teacher_id, student_email);
CREATE INDEX IF NOT EXISTS notebook_notes_lookup ON notebook_notes (teacher_id, student_email);
CREATE INDEX IF NOT EXISTS notebook_resources_lookup ON notebook_resources (teacher_id, student_email);
