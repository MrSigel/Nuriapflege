create table if not exists public.client_access_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  access_reason text not null default 'assigned_care',
  source_type text not null,
  source_id uuid not null,
  access_started_at timestamptz not null,
  access_expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint client_access_logs_source_type_check check (source_type in ('shift', 'tour', 'tour_stop'))
);

create index if not exists client_access_logs_employee_idx
  on public.client_access_logs(company_id, employee_id, client_id, access_expires_at);

alter table public.client_access_logs enable row level security;

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
            and (
              shifts.date >= current_date
              or ((shifts.date + coalesce(shifts.suggested_end_time, time '23:59:59')) + interval '24 hours') >= now()
            )
        )
        or exists (
          select 1
          from public.tours
          join public.tour_stops on tour_stops.company_id = tours.company_id and tour_stops.tour_id = tours.id
          where tours.company_id = record_company_id
            and tours.employee_id = auth.uid()
            and tour_stops.client_id = record_client_id
            and (
              tours.tour_date >= current_date
              or coalesce(tour_stops.completed_at, (tours.tour_date + coalesce(tour_stops.suggested_time, time '23:59:59'))::timestamptz) + interval '24 hours' >= now()
            )
        )
        or exists (
          select 1
          from public.client_access_logs
          where client_access_logs.company_id = record_company_id
            and client_access_logs.client_id = record_client_id
            and client_access_logs.employee_id = auth.uid()
            and client_access_logs.access_started_at <= now()
            and client_access_logs.access_expires_at >= now()
        )
      )
    )
$$;

drop policy if exists client_access_logs_read_own on public.client_access_logs;
create policy client_access_logs_read_own on public.client_access_logs
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

drop policy if exists client_access_logs_write_manager on public.client_access_logs;
create policy client_access_logs_write_manager on public.client_access_logs
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
);
