-- Add students table
create table if not exists students (
  id         uuid    primary key default gen_random_uuid(),
  name       text    not null,
  email      text    not null unique,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

alter table students enable row level security;
