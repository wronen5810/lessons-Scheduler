-- Student groups: a teacher can create groups with a shared lesson rate
CREATE TABLE student_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rate NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (teacher_id, name)
);

-- Group members: links students to groups
CREATE TABLE student_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES student_groups(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (group_id, student_id)
);

-- Add group_id to bookings (null = individual student booking)
ALTER TABLE recurring_bookings ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES student_groups(id) ON DELETE SET NULL;
ALTER TABLE one_time_bookings ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES student_groups(id) ON DELETE SET NULL;
