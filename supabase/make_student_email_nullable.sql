-- Allow students to be created with phone only (no email)
ALTER TABLE students ALTER COLUMN email DROP NOT NULL;
