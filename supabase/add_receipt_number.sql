-- Add receipt_number to student_payments
-- Format: YYYY-NNNN, sequential per teacher per year
alter table student_payments add column if not exists receipt_number text;

-- Enforce unique receipt numbers per teacher (nulls are excluded from the constraint)
create unique index if not exists student_payments_receipt_number_unique
  on student_payments (teacher_id, receipt_number)
  where receipt_number is not null;
