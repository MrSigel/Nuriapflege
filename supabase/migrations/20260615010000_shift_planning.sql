alter table public.shifts
  add column if not exists title text,
  add column if not exists shift_type text not null default 'pflegeeinsatz',
  add column if not exists notes text,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

update public.shifts
set title = 'Dienst'
where title is null;

alter table public.shifts
  alter column title set not null;

alter table public.shifts
  drop constraint if exists shifts_status_check;

alter table public.shifts
  add constraint shifts_status_check check (status in ('planned', 'in_progress', 'completed', 'cancelled'));

alter table public.shifts
  drop constraint if exists shifts_shift_type_check;

alter table public.shifts
  add constraint shifts_shift_type_check check (shift_type in ('pflegeeinsatz', 'hauswirtschaft', 'beratung', 'verwaltung', 'bereitschaft', 'sonstiges'));

create table if not exists public.shift_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  shift_id uuid not null references public.shifts(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  role_in_shift text,
  created_at timestamptz not null default now()
);

create table if not exists public.shift_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  shift_id uuid not null references public.shifts(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shifts_company_status_idx on public.shifts(company_id, status);
create index if not exists shifts_company_employee_idx on public.shifts(company_id, employee_id);
create index if not exists shifts_company_client_idx on public.shifts(company_id, client_id);
create index if not exists shift_assignments_company_shift_idx on public.shift_assignments(company_id, shift_id);
create index if not exists shift_notes_company_shift_idx on public.shift_notes(company_id, shift_id);

alter table public.shift_assignments enable row level security;
alter table public.shift_notes enable row level security;

drop policy if exists shifts_write_owner on public.shifts;
create policy shifts_write_owner on public.shifts
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
);

drop policy if exists shift_assignments_read_by_company on public.shift_assignments;
create policy shift_assignments_read_by_company on public.shift_assignments
for select using (public.is_same_company(company_id));

drop policy if exists shift_assignments_write_owner on public.shift_assignments;
create policy shift_assignments_write_owner on public.shift_assignments
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
);

drop policy if exists shift_notes_read_by_company on public.shift_notes;
create policy shift_notes_read_by_company on public.shift_notes
for select using (public.is_same_company(company_id));

drop policy if exists shift_notes_write_owner on public.shift_notes;
create policy shift_notes_write_owner on public.shift_notes
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
);
