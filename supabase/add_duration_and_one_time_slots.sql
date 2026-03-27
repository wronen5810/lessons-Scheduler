-- Add duration_minutes to recurring slot templates (default 45)
alter table slot_templates
  add column if not exists duration_minutes int not null default 45;

-- One-time slots created by the teacher for a specific date
create table if not exists one_time_slots (
  id               uuid        primary key default gen_random_uuid(),
  specific_date    date        not null,
  start_time       time        not null,
  duration_minutes int         not null default 45,
  is_active        boolean     not null default true,
  created_at       timestamptz not null default now(),
  unique (specific_date, start_time)
);

alter table one_time_slots enable row level security;

-- Link one_time_bookings to one_time_slots
alter table one_time_bookings
  add column if not exists one_time_slot_id uuid references one_time_slots(id) on delete set null;
