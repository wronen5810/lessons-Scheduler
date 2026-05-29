-- ── Booking queries (used in slots computation, schedule page, layout) ─────────

-- Recurring bookings: teacher+status+date (used in slots computation and requests list)
CREATE INDEX IF NOT EXISTS idx_recurring_teacher_status_date
  ON recurring_bookings(teacher_id, status, lesson_date);

-- Recurring bookings: teacher+date range (used in slots computation)
CREATE INDEX IF NOT EXISTS idx_recurring_teacher_date
  ON recurring_bookings(teacher_id, lesson_date);

-- One-time bookings: teacher+status+date
CREATE INDEX IF NOT EXISTS idx_ot_bookings_teacher_status_date
  ON one_time_bookings(teacher_id, status, specific_date);

-- Slot overrides: teacher+date range
CREATE INDEX IF NOT EXISTS idx_overrides_teacher_date
  ON slot_overrides(teacher_id, specific_date);

-- One-time slots: teacher+date range
CREATE INDEX IF NOT EXISTS idx_ot_slots_teacher_date
  ON one_time_slots(teacher_id, specific_date);

-- ── Student queries ─────────────────────────────────────────────────────────

-- Students: teacher+active (used in student list, billing, message send)
CREATE INDEX IF NOT EXISTS idx_students_teacher_active
  ON students(teacher_id, is_active);

-- Student contacts: primary lookup (used in message delivery override)
CREATE INDEX IF NOT EXISTS idx_student_contacts_primary
  ON student_contacts(student_id) WHERE is_primary = true;

-- ── Message queries ─────────────────────────────────────────────────────────

-- Messages inbox: teacher+email+date (used in inbox lookup, ordering)
CREATE INDEX IF NOT EXISTS idx_messages_teacher_email_sent
  ON messages(teacher_id, student_email, sent_at DESC);

-- ── Slot templates ──────────────────────────────────────────────────────────

-- Slot templates: teacher+active (used in weekly slot generation)
CREATE INDEX IF NOT EXISTS idx_slot_templates_teacher_active
  ON slot_templates(teacher_id, is_active);

-- ── Billing / payments ──────────────────────────────────────────────────────

-- Student payments: student lookup (used in billing page per-student view)
CREATE INDEX IF NOT EXISTS idx_student_payments_student
  ON student_payments(student_id);

-- Student payments: teacher+date (used in billing aggregate)
CREATE INDEX IF NOT EXISTS idx_student_payments_teacher_date
  ON student_payments(teacher_id, paid_at DESC);
