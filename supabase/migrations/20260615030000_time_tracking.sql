create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  location_id uuid references public.company_locations(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  tour_id uuid references public.tours(id) on delete set null,
  tour_stop_id uuid references public.tour_stops(id) on delete set null,
  shift_id uuid references public.shifts(id) on delete set null,
  entry_date date not null,
  start_time time not null,
  end_time time not null,
  break_minutes integer not null default 0,
  duration_minutes integer not null default 0,
  entry_type text not null default 'work_time',
  status text not null default 'draft',
  source text not null default 'manual',
  notes text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.time_entries
  add column if not exists location_id uuid references public.company_locations(id) on delete set null,
  add column if not exists client_id uuid references public.clients(id) on delete set null,
  add column if not exists tour_id uuid references public.tours(id) on delete set null,
  add column if not exists tour_stop_id uuid references public.tour_stops(id) on delete set null,
  add column if not exists shift_id uuid references public.shifts(id) on delete set null,
  add column if not exists break_minutes integer not null default 0,
  add column if not exists duration_minutes integer not null default 0,
  add column if not exists entry_type text not null default 'work_time',
  add column if not exists source text not null default 'manual',
  add column if not exists notes text,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

alter table public.time_entries drop constraint if exists time_entries_status_check;
alter table public.time_entries add constraint time_entries_status_check check (status in ('draft', 'submitted', 'approved', 'rejected', 'corrected'));
alter table public.time_entries drop constraint if exists time_entries_type_check;
alter table public.time_entries add constraint time_entries_type_check check (entry_type in ('work_time', 'client_visit', 'tour_time', 'break', 'admin_time', 'other'));
alter table public.time_entries drop constraint if exists time_entries_source_check;
alter table public.time_entries add constraint time_entries_source_check check (source in ('manual', 'tour_wizard', 'system'));

create table if not exists public.time_entry_audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  time_entry_id uuid not null references public.time_entries(id) on delete cascade,
  changed_by uuid references public.profiles(id) on delete set null,
  action text not null,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

create index if not exists time_entries_company_date_idx on public.time_entries(company_id, entry_date);
create index if not exists time_entries_company_employee_idx on public.time_entries(company_id, employee_id);
create index if not exists time_entries_company_status_idx on public.time_entries(company_id, status);
create index if not exists time_entry_audit_logs_company_entry_idx on public.time_entry_audit_logs(company_id, time_entry_id);

alter table public.time_entries enable row level security;
alter table public.time_entry_audit_logs enable row level security;

drop policy if exists time_entries_read_by_company on public.time_entries;
create policy time_entries_read_by_company on public.time_entries
for select using (public.is_same_company(company_id));

drop policy if exists time_entries_write_owner on public.time_entries;
create policy time_entries_write_owner on public.time_entries
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
);

drop policy if exists time_entry_audit_logs_read_by_company on public.time_entry_audit_logs;
create policy time_entry_audit_logs_read_by_company on public.time_entry_audit_logs
for select using (public.is_same_company(company_id));

drop policy if exists time_entry_audit_logs_write_owner on public.time_entry_audit_logs;
create policy time_entry_audit_logs_write_owner on public.time_entry_audit_logs
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
);
