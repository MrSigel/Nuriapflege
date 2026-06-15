create table if not exists public.shift_read_confirmations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  shift_id uuid not null references public.shifts(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (company_id, shift_id, employee_id)
);

create index if not exists shift_read_confirmations_employee_idx
  on public.shift_read_confirmations(company_id, employee_id, shift_id);

alter table public.shift_read_confirmations enable row level security;

create or replace function public.can_read_shift_record(record_company_id uuid, record_shift_id uuid, record_employee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or (
      record_company_id = public.current_profile_company_id()
      and (
        public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung')
        or record_employee_id = auth.uid()
        or exists (
          select 1
          from public.shift_assignments
          where shift_assignments.company_id = record_company_id
            and shift_assignments.shift_id = record_shift_id
            and shift_assignments.employee_id = auth.uid()
        )
      )
    )
$$;

create or replace function public.can_read_client_for_current_user(record_company_id uuid, record_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or (
      record_company_id = public.current_profile_company_id()
      and (
        public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung')
        or exists (
          select 1
          from public.shifts
          where shifts.company_id = record_company_id
            and shifts.client_id = record_client_id
            and public.can_read_shift_record(shifts.company_id, shifts.id, shifts.employee_id)
        )
        or exists (
          select 1
          from public.tours
          where tours.company_id = record_company_id
            and tours.employee_id = auth.uid()
            and exists (
              select 1
              from public.tour_stops
              where tour_stops.company_id = record_company_id
                and tour_stops.tour_id = tours.id
                and tour_stops.client_id = record_client_id
            )
        )
      )
    )
$$;

drop policy if exists shifts_read_by_role on public.shifts;
create policy shifts_read_by_role on public.shifts
for select using (public.can_read_shift_record(company_id, id, employee_id));

drop policy if exists shift_assignments_read_by_company on public.shift_assignments;
create policy shift_assignments_read_by_company on public.shift_assignments
for select using (
  public.is_admin()
  or (
    company_id = public.current_profile_company_id()
    and (
      public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung')
      or employee_id = auth.uid()
    )
  )
);

drop policy if exists shift_notes_read_by_company on public.shift_notes;
create policy shift_notes_read_by_company on public.shift_notes
for select using (
  public.is_admin()
  or (
    company_id = public.current_profile_company_id()
    and (
      public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung')
      or exists (
        select 1
        from public.shifts
        where shifts.id = shift_notes.shift_id
          and public.can_read_shift_record(shifts.company_id, shifts.id, shifts.employee_id)
      )
    )
  )
);

drop policy if exists clients_read_by_company on public.clients;
create policy clients_read_by_company on public.clients
for select using (public.can_read_client_for_current_user(company_id, id));

drop policy if exists shift_read_confirmations_read_own on public.shift_read_confirmations;
create policy shift_read_confirmations_read_own on public.shift_read_confirmations
for select using (
  public.is_admin()
  or (
    company_id = public.current_profile_company_id()
    and (
      public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung')
      or employee_id = auth.uid()
    )
  )
);

drop policy if exists shift_read_confirmations_insert_own on public.shift_read_confirmations;
create policy shift_read_confirmations_insert_own on public.shift_read_confirmations
for insert with check (
  company_id = public.current_profile_company_id()
  and employee_id = auth.uid()
  and exists (
    select 1
    from public.shifts
    where shifts.id = shift_id
      and public.can_read_shift_record(shifts.company_id, shifts.id, shifts.employee_id)
  )
);
