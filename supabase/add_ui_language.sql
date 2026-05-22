-- Add ui_language preference to teacher_settings
alter table teacher_settings
  add column if not exists ui_language text not null default 'he'
  check (ui_language in ('en', 'he'));
