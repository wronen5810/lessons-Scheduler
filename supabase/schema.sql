-- ============================================================
-- Lessons Scheduler — Supabase Schema
-- Run this in the Supabase SQL editor to set up the database.
-- ============================================================

-- Weekly slot templates defined by the teacher (e.g., every Monday at 16:00)
create table if not exists slot_templates (
  id          uuid        primary key default gen_random_uuid(),
  day_of_week smallint    not null check (day_of_week between 0 and 6), -- 0=Sun, 6=Sat
  start_time  time        not null,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  unique (day_of_week, start_time)
);

-- Per-date overrides: teacher blocks or re-opens a specific week's instance
create table if not exists slot_overrides (
  id            uuid        primary key default gen_random_uuid(),
  template_id   uuid        not null references slot_templates(id) on delete cascade,
  specific_date date        not null,
  is_blocked    boolean     not null default true,
  created_at    timestamptz not null default now(),
  unique (template_id, specific_date)
);

-- Recurring bookings: student (or teacher) books a day/time every week indefinitely
create table if not exists recurring_bookings (
  id                  uuid        primary key default gen_random_uuid(),
  template_id         uuid        not null references slot_templates(id) on delete cascade,
  student_name        text        not null,
  student_email       text        not null,
  status              text        not null default 'pending'
                        check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  booked_by           text        not null default 'student'
                        check (booked_by in ('teacher', 'student')),
  started_date        date        not null,
  ended_date          date,
  cancel_token        uuid        not null default gen_random_uuid() unique,
  cancellation_reason text,
  cancelled_at        timestamptz,
  cancelled_by        text        check (cancelled_by in ('teacher', 'student')),
  created_at          timestamptz not null default now()
);

-- One-time bookings: student (or teacher) books a specific date
create table if not exists one_time_bookings (
  id                  uuid        primary key default gen_random_uuid(),
  template_id         uuid        references slot_templates(id) on delete set null,
  specific_date       date        not null,
  start_time          time        not null,
  student_name        text        not null,
  student_email       text        not null,
  status              text        not null default 'pending'
                        check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  booked_by           text        not null default 'student'
                        check (booked_by in ('teacher', 'student')),
  cancel_token        uuid        not null default gen_random_uuid() unique,
  reminder_sent       boolean     not null default false,
  cancellation_reason text,
  cancelled_at        timestamptz,
  cancelled_by        text        check (cancelled_by in ('teacher', 'student')),
  created_at          timestamptz not null default now()
);

-- Tracks which lesson dates already received a reminder email (for recurring bookings)
create table if not exists recurring_reminders (
  id          uuid        primary key default gen_random_uuid(),
  booking_id  uuid        not null references recurring_bookings(id) on delete cascade,
  lesson_date date        not null,
  sent_at     timestamptz not null default now(),
  unique (booking_id, lesson_date)
);

-- Enable RLS on all tables (all access goes through server-side API routes using service role key)
alter table slot_templates      enable row level security;
alter table slot_overrides      enable row level security;
alter table recurring_bookings  enable row level security;
alter table one_time_bookings   enable row level security;
alter table recurring_reminders enable row level security;
