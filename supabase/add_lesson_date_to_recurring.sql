-- Add lesson_date (specific date for this occurrence) and series_id (groups a recurring series)
ALTER TABLE recurring_bookings ADD COLUMN IF NOT EXISTS lesson_date date;
ALTER TABLE recurring_bookings ADD COLUMN IF NOT EXISTS series_id uuid;

-- Migrate existing rows: use started_date as the lesson_date
UPDATE recurring_bookings SET lesson_date = started_date WHERE lesson_date IS NULL;

-- Make lesson_date NOT NULL going forward
ALTER TABLE recurring_bookings ALTER COLUMN lesson_date SET NOT NULL;
