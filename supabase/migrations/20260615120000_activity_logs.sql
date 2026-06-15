create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  actor_name text,
  actor_role text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  entity_label text,
  severity text not null default 'info',
  status text not null default 'success',
  message text,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  constraint activity_logs_action_check check (action in ('created','updated','deleted','archived','restored','status_changed','role_changed','permission_changed','uploaded','downloaded','exported','login','logout','failed_login','viewed','approved','rejected','completed','error')),
  constraint activity_logs_entity_type_check check (entity_type in ('client','employee','location','shift','tour','time_entry','care_documentation','document','billing_item','invoice','conversation','message','applicant','website_lead','online_presence_task','qm_item','qm_measure','export_job','role_permission','company_settings','user_settings','system')),
  constraint activity_logs_severity_check check (severity in ('info','warning','error','critical')),
  constraint activity_logs_status_check check (status in ('success','failed','pending'))
);

create index if not exists activity_logs_company_created_idx on public.activity_logs(company_id, created_at desc);
create index if not exists activity_logs_company_action_idx on public.activity_logs(company_id, action);
create index if not exists activity_logs_company_entity_idx on public.activity_logs(company_id, entity_type);

alter table public.activity_logs enable row level security;

drop policy if exists activity_logs_read_by_company on public.activity_logs;
create policy activity_logs_read_by_company on public.activity_logs
for select using (public.is_same_company(company_id) and public.current_profile_role() in ('admin','inhaber','pdl'));

drop policy if exists activity_logs_insert_by_company on public.activity_logs;
create policy activity_logs_insert_by_company on public.activity_logs
for insert with check (public.is_same_company(company_id));
