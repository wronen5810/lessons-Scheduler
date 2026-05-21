-- Student payments table
-- Tracks all payments received from individual students.
-- booking_id IS NULL  → unallocated payment (credit towards future/existing lessons)
-- booking_id IS NOT NULL → payment allocated to a specific lesson

CREATE TABLE IF NOT EXISTS student_payments (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id    UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount        NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  note          TEXT,
  booking_type  TEXT        CHECK (booking_type IN ('one_time', 'recurring')),
  booking_id    UUID,       -- NULL = unallocated
  paid_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE student_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_owns_payments" ON student_payments
  FOR ALL USING (teacher_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS student_payments_teacher_idx   ON student_payments (teacher_id);
CREATE INDEX IF NOT EXISTS student_payments_student_idx   ON student_payments (student_id);
CREATE INDEX IF NOT EXISTS student_payments_booking_idx   ON student_payments (booking_id) WHERE booking_id IS NOT NULL;
