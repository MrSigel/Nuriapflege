alter table public.qm_items
  add column if not exists location_id uuid references public.company_locations(id) on delete set null,
  add column if not exists description text,
  add column if not exists priority text not null default 'normal',
  add column if not exists responsible_user_id uuid references public.profiles(id) on delete set null,
  add column if not exists due_date date,
  add column if not exists completed_at timestamptz,
  add column if not exists last_checked_at date,
  add column if not exists notes text,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_by uuid references public.profiles(id) on delete set null,
  add column if not exists archived_at timestamptz;

update public.qm_items set status = 'open' where status is null;
update public.qm_items set category = 'sonstiges' where category is null;
alter table public.qm_items alter column category set default 'sonstiges';
alter table public.qm_items alter column status set default 'open';

alter table public.qm_items drop constraint if exists qm_items_category_check;
alter table public.qm_items add constraint qm_items_category_check check (category in ('organisation','pflegeprozess','dokumentation','mitarbeiter','hygiene','medikamente','notfallmanagement','datenschutz','abrechnung','fortbildungen','beschwerden','md_vorbereitung','sonstiges'));
alter table public.qm_items drop constraint if exists qm_items_status_check;
alter table public.qm_items add constraint qm_items_status_check check (status in ('open','in_progress','waiting','completed','overdue','archived'));
alter table public.qm_items drop constraint if exists qm_items_priority_check;
alter table public.qm_items add constraint qm_items_priority_check check (priority in ('low','normal','high','urgent'));

create table if not exists public.qm_measures (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  qm_item_id uuid not null references public.qm_items(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'open',
  priority text not null default 'normal',
  responsible_user_id uuid references public.profiles(id) on delete set null,
  due_date date,
  completed_at timestamptz,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint qm_measures_status_check check (status in ('open','in_progress','completed','cancelled')),
  constraint qm_measures_priority_check check (priority in ('low','normal','high','urgent'))
);

create table if not exists public.qm_evidence (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  qm_item_id uuid not null references public.qm_items(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  title text not null,
  description text,
  evidence_type text not null default 'note',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint qm_evidence_type_check check (evidence_type in ('document','note','check','photo','other'))
);

create index if not exists qm_items_company_due_idx on public.qm_items(company_id, due_date);
create index if not exists qm_measures_company_item_idx on public.qm_measures(company_id, qm_item_id);
create index if not exists qm_measures_company_due_idx on public.qm_measures(company_id, due_date);
create index if not exists qm_evidence_company_item_idx on public.qm_evidence(company_id, qm_item_id);

alter table public.qm_measures enable row level security;
alter table public.qm_evidence enable row level security;

drop policy if exists qm_items_insert_by_company on public.qm_items;
create policy qm_items_insert_by_company on public.qm_items for insert with check (public.is_same_company(company_id) and public.current_profile_role() in ('admin','inhaber','pdl'));
drop policy if exists qm_items_update_by_company on public.qm_items;
create policy qm_items_update_by_company on public.qm_items for update using (public.is_same_company(company_id) and public.current_profile_role() in ('admin','inhaber','pdl')) with check (public.is_same_company(company_id) and public.current_profile_role() in ('admin','inhaber','pdl'));
drop policy if exists qm_measures_read_by_company on public.qm_measures;
create policy qm_measures_read_by_company on public.qm_measures for select using (public.is_same_company(company_id) and public.current_profile_role() in ('admin','inhaber','pdl'));
drop policy if exists qm_measures_insert_by_company on public.qm_measures;
create policy qm_measures_insert_by_company on public.qm_measures for insert with check (public.is_same_company(company_id) and public.current_profile_role() in ('admin','inhaber','pdl'));
drop policy if exists qm_measures_update_by_company on public.qm_measures;
create policy qm_measures_update_by_company on public.qm_measures for update using (public.is_same_company(company_id) and public.current_profile_role() in ('admin','inhaber','pdl')) with check (public.is_same_company(company_id) and public.current_profile_role() in ('admin','inhaber','pdl'));
drop policy if exists qm_evidence_read_by_company on public.qm_evidence;
create policy qm_evidence_read_by_company on public.qm_evidence for select using (public.is_same_company(company_id) and public.current_profile_role() in ('admin','inhaber','pdl'));
drop policy if exists qm_evidence_insert_by_company on public.qm_evidence;
create policy qm_evidence_insert_by_company on public.qm_evidence for insert with check (public.is_same_company(company_id) and public.current_profile_role() in ('admin','inhaber','pdl'));
