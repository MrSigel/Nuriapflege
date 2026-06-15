create table if not exists public.care_documentation (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  employee_id uuid references public.profiles(id) on delete set null,
  shift_id uuid references public.shifts(id) on delete set null,
  tour_id uuid references public.tours(id) on delete set null,
  tour_stop_id uuid references public.tour_stops(id) on delete set null,
  documentation_date date not null,
  documentation_time time,
  category text not null,
  title text not null,
  content text not null,
  status text not null default 'draft',
  visibility text not null default 'internal',
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.care_documentation drop constraint if exists care_documentation_category_check;
alter table public.care_documentation add constraint care_documentation_category_check check (category in ('pflegebericht', 'uebergabe', 'beobachtung', 'massnahme', 'vitalwerte', 'wunde', 'medikation', 'ereignis', 'sonstiges'));
alter table public.care_documentation drop constraint if exists care_documentation_status_check;
alter table public.care_documentation add constraint care_documentation_status_check check (status in ('draft', 'submitted', 'reviewed', 'archived'));
alter table public.care_documentation drop constraint if exists care_documentation_visibility_check;
alter table public.care_documentation add constraint care_documentation_visibility_check check (visibility in ('internal', 'care_team', 'management'));

create table if not exists public.care_vitals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  documentation_id uuid not null references public.care_documentation(id) on delete cascade,
  measured_at timestamptz,
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  pulse integer,
  temperature numeric(4,1),
  blood_sugar numeric(6,1),
  weight numeric(6,2),
  oxygen_saturation integer,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.care_documentation_audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  documentation_id uuid not null references public.care_documentation(id) on delete cascade,
  changed_by uuid references public.profiles(id) on delete set null,
  action text not null,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

create index if not exists care_documentation_company_date_idx on public.care_documentation(company_id, documentation_date);
create index if not exists care_documentation_company_client_idx on public.care_documentation(company_id, client_id);
create index if not exists care_vitals_company_doc_idx on public.care_vitals(company_id, documentation_id);

alter table public.care_documentation enable row level security;
alter table public.care_vitals enable row level security;
alter table public.care_documentation_audit_logs enable row level security;

drop policy if exists care_documentation_read_by_company on public.care_documentation;
create policy care_documentation_read_by_company on public.care_documentation for select using (public.is_same_company(company_id));
drop policy if exists care_documentation_write_owner on public.care_documentation;
create policy care_documentation_write_owner on public.care_documentation for all using (public.is_admin() or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))) with check (public.is_admin() or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl')));

drop policy if exists care_vitals_read_by_company on public.care_vitals;
create policy care_vitals_read_by_company on public.care_vitals for select using (public.is_same_company(company_id));
drop policy if exists care_vitals_write_owner on public.care_vitals;
create policy care_vitals_write_owner on public.care_vitals for all using (public.is_admin() or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))) with check (public.is_admin() or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl')));

drop policy if exists care_documentation_audit_read_by_company on public.care_documentation_audit_logs;
create policy care_documentation_audit_read_by_company on public.care_documentation_audit_logs for select using (public.is_same_company(company_id));
drop policy if exists care_documentation_audit_write_owner on public.care_documentation_audit_logs;
create policy care_documentation_audit_write_owner on public.care_documentation_audit_logs for all using (public.is_admin() or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))) with check (public.is_admin() or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl')));
