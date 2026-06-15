create table if not exists public.compliance_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  location_id uuid references public.company_locations(id) on delete set null,
  title text not null,
  description text,
  category text not null default 'sonstiges',
  status text not null default 'open',
  priority text not null default 'normal',
  responsible_user_id uuid references public.profiles(id) on delete set null,
  due_date date,
  completed_at timestamptz,
  last_checked_at date,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint compliance_items_category_check check (category in ('datenschutz','zugriffskontrolle','rollen_rechte','exporte','loeschungen','dokumentation','aufbewahrung','technische_massnahmen','organisatorische_massnahmen','mitarbeiterzugriff','pruefprotokolle','sonstiges')),
  constraint compliance_items_status_check check (status in ('open','in_progress','waiting','completed','overdue','archived')),
  constraint compliance_items_priority_check check (priority in ('low','normal','high','urgent'))
);
create table if not exists public.compliance_evidence (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  compliance_item_id uuid not null references public.compliance_items(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  title text not null,
  description text,
  evidence_type text not null default 'note',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint compliance_evidence_type_check check (evidence_type in ('document','note','check','export_log','access_log','deletion_log','other'))
);
create index if not exists compliance_items_company_status_idx on public.compliance_items(company_id,status);
create index if not exists compliance_items_company_due_idx on public.compliance_items(company_id,due_date);
create index if not exists compliance_evidence_company_item_idx on public.compliance_evidence(company_id,compliance_item_id);
alter table public.compliance_items enable row level security;
alter table public.compliance_evidence enable row level security;
drop policy if exists compliance_items_read_by_company on public.compliance_items;
create policy compliance_items_read_by_company on public.compliance_items for select using (public.is_same_company(company_id) and public.current_profile_role() in ('admin','inhaber','pdl'));
drop policy if exists compliance_items_insert_by_company on public.compliance_items;
create policy compliance_items_insert_by_company on public.compliance_items for insert with check (public.is_same_company(company_id) and public.current_profile_role() in ('admin','inhaber','pdl'));
drop policy if exists compliance_items_update_by_company on public.compliance_items;
create policy compliance_items_update_by_company on public.compliance_items for update using (public.is_same_company(company_id) and public.current_profile_role() in ('admin','inhaber','pdl')) with check (public.is_same_company(company_id) and public.current_profile_role() in ('admin','inhaber','pdl'));
drop policy if exists compliance_evidence_read_by_company on public.compliance_evidence;
create policy compliance_evidence_read_by_company on public.compliance_evidence for select using (public.is_same_company(company_id) and public.current_profile_role() in ('admin','inhaber','pdl'));
drop policy if exists compliance_evidence_insert_by_company on public.compliance_evidence;
create policy compliance_evidence_insert_by_company on public.compliance_evidence for insert with check (public.is_same_company(company_id) and public.current_profile_role() in ('admin','inhaber','pdl'));
