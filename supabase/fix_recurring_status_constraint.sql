-- Fix recurring_bookings status constraint to include all valid statuses
ALTER TABLE recurring_bookings DROP CONSTRAINT IF EXISTS recurring_bookings_status_check;
ALTER TABLE recurring_bookings ADD CONSTRAINT recurring_bookings_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'cancellation_requested', 'completed', 'paid'));
