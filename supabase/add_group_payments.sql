-- Tracks which students in a group have paid for a specific group lesson
CREATE TABLE group_booking_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_type TEXT NOT NULL CHECK (booking_type IN ('recurring', 'one_time')),
  booking_id UUID NOT NULL,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paid_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (booking_type, booking_id, student_id)
);
