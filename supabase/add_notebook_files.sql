-- notebook_files: stores file attachments for individual student notebooks
create table if not exists notebook_files (
  id            uuid        primary key default gen_random_uuid(),
  teacher_id    uuid        not null references auth.users(id) on delete cascade,
  student_email text        not null,
  file_name     text        not null,
  file_size     integer     not null,
  file_type     text        not null,
  storage_path  text        not null,
  url           text        not null,
  created_at    timestamptz not null default now()
);

create index if not exists notebook_files_lookup
  on notebook_files (teacher_id, student_email);

alter table notebook_files enable row level security;

create policy "teachers can manage their notebook files"
  on notebook_files for all
  using  (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);
