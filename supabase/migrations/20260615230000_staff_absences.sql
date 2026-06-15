create table if not exists public.employee_absences (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  absence_type text not null default 'vacation',
  start_date date not null,
  end_date date not null,
  status text not null default 'submitted',
  reason text,
  response_note text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_absences_type_check check (absence_type in ('vacation', 'sick', 'training', 'other')),
  constraint employee_absences_status_check check (status in ('submitted', 'approved', 'rejected', 'cancelled')),
  constraint employee_absences_date_check check (end_date >= start_date)
);

create index if not exists employee_absences_company_employee_idx
  on public.employee_absences(company_id, employee_id, start_date);

alter table public.employee_absences enable row level security;

drop policy if exists employee_absences_read_own on public.employee_absences;
create policy employee_absences_read_own on public.employee_absences
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

drop policy if exists employee_absences_write_own on public.employee_absences;
create policy employee_absences_write_own on public.employee_absences
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
  or (
    company_id = public.current_profile_company_id()
    and employee_id = auth.uid()
    and status = 'submitted'
  )
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
  or (
    company_id = public.current_profile_company_id()
    and employee_id = auth.uid()
    and created_by = auth.uid()
    and status in ('submitted', 'cancelled')
  )
);
