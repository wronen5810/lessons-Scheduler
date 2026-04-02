-- Add fields to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS rate numeric(10,2);
ALTER TABLE students ADD COLUMN IF NOT EXISTS notes text;

-- Booking notes table
CREATE TABLE booking_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  booking_type text NOT NULL CHECK (booking_type IN ('one_time', 'recurring')),
  booking_id uuid NOT NULL,
  note text NOT NULL,
  visible_to_student boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX booking_notes_booking_idx ON booking_notes (booking_type, booking_id);
