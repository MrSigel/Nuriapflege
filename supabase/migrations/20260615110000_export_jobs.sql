create table if not exists public.export_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  requested_by uuid references public.profiles(id) on delete set null,
  export_type text not null,
  format text not null,
  status text not null default 'pending',
  date_from date,
  date_to date,
  filters jsonb not null default '{}'::jsonb,
  file_name text,
  file_path text,
  file_size bigint,
  storage_bucket text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  deleted_at timestamptz,
  constraint export_jobs_type_check check (export_type in ('clients','employees','locations','shifts','tours','time_entries','care_documentation','documents_metadata','billing','applicants','website_online','qm_md','activity_logs')),
  constraint export_jobs_format_check check (format in ('csv','json','pdf')),
  constraint export_jobs_status_check check (status in ('pending','processing','completed','failed','deleted'))
);

insert into storage.buckets (id, name, public)
values ('company-exports', 'company-exports', false)
on conflict (id) do update set public = false;

create index if not exists export_jobs_company_status_idx on public.export_jobs(company_id, status);
create index if not exists export_jobs_company_created_idx on public.export_jobs(company_id, created_at desc);

alter table public.export_jobs enable row level security;

drop policy if exists export_jobs_read_by_company on public.export_jobs;
create policy export_jobs_read_by_company on public.export_jobs
for select using (public.is_same_company(company_id) and public.current_profile_role() in ('admin','inhaber','pdl','verwaltung'));

drop policy if exists export_jobs_insert_by_company on public.export_jobs;
create policy export_jobs_insert_by_company on public.export_jobs
for insert with check (public.is_same_company(company_id) and public.current_profile_role() in ('admin','inhaber','pdl','verwaltung'));

drop policy if exists export_jobs_update_by_company on public.export_jobs;
create policy export_jobs_update_by_company on public.export_jobs
for update using (public.is_same_company(company_id) and public.current_profile_role() in ('admin','inhaber','pdl','verwaltung'))
with check (public.is_same_company(company_id) and public.current_profile_role() in ('admin','inhaber','pdl','verwaltung'));
