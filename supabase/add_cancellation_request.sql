-- Add cancellation_requested to status enum for both booking tables
ALTER TABLE recurring_bookings
  DROP CONSTRAINT IF EXISTS recurring_bookings_status_check;
ALTER TABLE recurring_bookings
  ADD CONSTRAINT recurring_bookings_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'cancellation_requested'));

ALTER TABLE one_time_bookings
  DROP CONSTRAINT IF EXISTS one_time_bookings_status_check;
ALTER TABLE one_time_bookings
  ADD CONSTRAINT one_time_bookings_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'cancellation_requested', 'completed', 'paid'));
