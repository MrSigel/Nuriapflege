alter table public.website_leads
  add column if not exists location_id uuid references public.company_locations(id) on delete set null,
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists organization_name text,
  add column if not exists subject text,
  add column if not exists lead_type text not null default 'general',
  add column if not exists source text not null default 'website',
  add column if not exists priority text not null default 'normal',
  add column if not exists assigned_to uuid references public.profiles(id) on delete set null,
  add column if not exists last_contact_at timestamptz,
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists notes text,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_by uuid references public.profiles(id) on delete set null,
  add column if not exists archived_at timestamptz;

update public.website_leads set status = 'new' where status = 'open';
update public.website_leads set subject = coalesce(subject, name, 'Online-Anfrage') where subject is null;
alter table public.website_leads alter column status set default 'new';
alter table public.website_leads alter column subject set not null;

alter table public.website_leads drop constraint if exists website_leads_type_check;
alter table public.website_leads add constraint website_leads_type_check check (lead_type in ('general','care_request','callback_request','job_application','cooperation','complaint','other'));
alter table public.website_leads drop constraint if exists website_leads_source_check;
alter table public.website_leads add constraint website_leads_source_check check (source in ('website','contact_form','phone','email','facebook','instagram','google','recommendation','manual','other'));
alter table public.website_leads drop constraint if exists website_leads_status_check;
alter table public.website_leads add constraint website_leads_status_check check (status in ('new','in_progress','waiting','done','rejected','archived'));
alter table public.website_leads drop constraint if exists website_leads_priority_check;
alter table public.website_leads add constraint website_leads_priority_check check (priority in ('low','normal','high','urgent'));

create table if not exists public.online_presence_tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  location_id uuid references public.company_locations(id) on delete set null,
  title text not null,
  description text,
  task_type text not null default 'other',
  status text not null default 'open',
  priority text not null default 'normal',
  assigned_to uuid references public.profiles(id) on delete set null,
  due_date date,
  completed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint online_presence_tasks_type_check check (task_type in ('website_update','google_profile','social_media','content','photos','job_posting','review_management','other')),
  constraint online_presence_tasks_status_check check (status in ('open','in_progress','done','archived')),
  constraint online_presence_tasks_priority_check check (priority in ('low','normal','high','urgent'))
);

create index if not exists website_leads_company_followup_idx on public.website_leads(company_id, next_follow_up_at);
create index if not exists online_presence_tasks_company_status_idx on public.online_presence_tasks(company_id, status);
create index if not exists online_presence_tasks_company_due_idx on public.online_presence_tasks(company_id, due_date);

alter table public.online_presence_tasks enable row level security;

drop policy if exists website_leads_insert_by_company on public.website_leads;
create policy website_leads_insert_by_company on public.website_leads
for insert with check (public.is_same_company(company_id) and public.current_profile_role() in ('admin','inhaber','verwaltung'));

drop policy if exists website_leads_update_by_company on public.website_leads;
create policy website_leads_update_by_company on public.website_leads
for update using (public.is_same_company(company_id) and public.current_profile_role() in ('admin','inhaber','verwaltung'))
with check (public.is_same_company(company_id) and public.current_profile_role() in ('admin','inhaber','verwaltung'));

drop policy if exists online_presence_tasks_read_by_company on public.online_presence_tasks;
create policy online_presence_tasks_read_by_company on public.online_presence_tasks
for select using (public.is_same_company(company_id) and public.current_profile_role() in ('admin','inhaber','verwaltung'));

drop policy if exists online_presence_tasks_insert_by_company on public.online_presence_tasks;
create policy online_presence_tasks_insert_by_company on public.online_presence_tasks
for insert with check (public.is_same_company(company_id) and public.current_profile_role() in ('admin','inhaber','verwaltung'));

drop policy if exists online_presence_tasks_update_by_company on public.online_presence_tasks;
create policy online_presence_tasks_update_by_company on public.online_presence_tasks
for update using (public.is_same_company(company_id) and public.current_profile_role() in ('admin','inhaber','verwaltung'))
with check (public.is_same_company(company_id) and public.current_profile_role() in ('admin','inhaber','verwaltung'));
