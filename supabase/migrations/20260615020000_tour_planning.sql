alter table public.tours
  add column if not exists location_id uuid references public.company_locations(id) on delete set null,
  add column if not exists title text,
  add column if not exists tour_date date,
  add column if not exists suggested_start_time time,
  add column if not exists suggested_end_time time,
  add column if not exists notes text,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

update public.tours set tour_date = date where tour_date is null;
update public.tours set title = 'Tour' where title is null;

alter table public.tours
  alter column title set not null,
  alter column tour_date set not null;

alter table public.tours
  drop constraint if exists tours_status_check;

alter table public.tours
  add constraint tours_status_check check (status in ('planned', 'in_progress', 'completed', 'cancelled'));

alter table public.tour_stops
  add column if not exists shift_id uuid references public.shifts(id) on delete set null,
  add column if not exists tasks text,
  add column if not exists notes text,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz;

alter table public.tour_stops
  drop constraint if exists tour_stops_status_check;

alter table public.tour_stops
  add constraint tour_stops_status_check check (status in ('planned', 'in_progress', 'completed', 'skipped', 'cancelled'));

create table if not exists public.tour_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  tour_id uuid not null references public.tours(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tours_company_tour_date_idx on public.tours(company_id, tour_date);
create index if not exists tours_company_status_idx on public.tours(company_id, status);
create index if not exists tour_stops_company_tour_order_idx on public.tour_stops(company_id, tour_id, sort_order);
create index if not exists tour_notes_company_tour_idx on public.tour_notes(company_id, tour_id);

alter table public.tour_notes enable row level security;

drop policy if exists tours_write_owner on public.tours;
create policy tours_write_owner on public.tours
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
);

drop policy if exists tour_stops_write_owner on public.tour_stops;
create policy tour_stops_write_owner on public.tour_stops
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
);

drop policy if exists tour_notes_read_by_company on public.tour_notes;
create policy tour_notes_read_by_company on public.tour_notes
for select using (public.is_same_company(company_id));

drop policy if exists tour_notes_write_owner on public.tour_notes;
create policy tour_notes_write_owner on public.tour_notes
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
);
