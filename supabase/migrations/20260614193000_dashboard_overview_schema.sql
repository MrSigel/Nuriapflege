create extension if not exists pgcrypto;

do $$ begin
  create type public.nuria_user_role as enum ('admin', 'inhaber', 'pdl', 'verwaltung', 'mitarbeiter');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.nuria_payment_status as enum ('pending_payment', 'payment_marked_as_sent', 'active', 'payment_overdue', 'locked');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  status text not null default 'active',
  package_id text,
  payment_status public.nuria_payment_status not null default 'pending_payment',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_locations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  address text,
  city text,
  postal_code text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key,
  company_id uuid references public.companies(id) on delete set null,
  role public.nuria_user_role not null,
  first_name text,
  last_name text,
  email text,
  staff_code text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  location_id uuid references public.company_locations(id) on delete set null,
  first_name text,
  last_name text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid references public.profiles(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  location_id uuid references public.company_locations(id) on delete set null,
  date date not null,
  suggested_start_time time,
  suggested_end_time time,
  status text not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tours (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid references public.profiles(id) on delete set null,
  date date not null,
  status text not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tour_stops (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  tour_id uuid not null references public.tours(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  sort_order integer not null default 0,
  suggested_time time,
  status text not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'open',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  document_type text,
  file_url text,
  file_name text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  status text not null default 'open',
  amount numeric(12,2),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  status text not null default 'open',
  amount numeric(12,2),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.qm_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  category text,
  status text not null default 'open',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.applicants (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  first_name text,
  last_name text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.website_leads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text,
  email text,
  phone text,
  message text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text,
  type text not null default 'internal',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.nuria_news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  target_role public.nuria_user_role,
  company_id uuid references public.companies(id) on delete cascade,
  is_global boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists company_locations_company_id_idx on public.company_locations(company_id);
create index if not exists profiles_company_id_idx on public.profiles(company_id);
create index if not exists clients_company_id_idx on public.clients(company_id);
create index if not exists shifts_company_date_idx on public.shifts(company_id, date);
create index if not exists tours_company_date_idx on public.tours(company_id, date);
create index if not exists tour_stops_company_tour_idx on public.tour_stops(company_id, tour_id);
create index if not exists tasks_company_status_idx on public.tasks(company_id, status);
create index if not exists documents_company_status_idx on public.documents(company_id, status);
create index if not exists billing_items_company_status_idx on public.billing_items(company_id, status);
create index if not exists invoices_company_status_idx on public.invoices(company_id, status);
create index if not exists qm_items_company_status_idx on public.qm_items(company_id, status);
create index if not exists applicants_company_status_idx on public.applicants(company_id, status);
create index if not exists website_leads_company_status_idx on public.website_leads(company_id, status);
create index if not exists conversations_company_id_idx on public.conversations(company_id);
create index if not exists messages_company_read_idx on public.messages(company_id, read_at, created_at);
create index if not exists nuria_news_visibility_idx on public.nuria_news(company_id, target_role, is_global, published_at);

alter table public.companies enable row level security;
alter table public.company_locations enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.shifts enable row level security;
alter table public.tours enable row level security;
alter table public.tour_stops enable row level security;
alter table public.tasks enable row level security;
alter table public.documents enable row level security;
alter table public.billing_items enable row level security;
alter table public.invoices enable row level security;
alter table public.qm_items enable row level security;
alter table public.applicants enable row level security;
alter table public.website_leads enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.nuria_news enable row level security;

create or replace function public.current_profile_role()
returns public.nuria_user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.current_profile_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_profile_role() = 'admin'
$$;

create or replace function public.is_same_company(record_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or record_company_id = public.current_profile_company_id()
$$;

create or replace function public.can_read_employee_record(record_company_id uuid, employee_id uuid)
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
        or employee_id = auth.uid()
      )
    )
$$;

create or replace function public.can_read_news(record_company_id uuid, record_target_role public.nuria_user_role, record_is_global boolean)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or (
      (record_is_global or record_company_id = public.current_profile_company_id())
      and (record_target_role is null or record_target_role = public.current_profile_role())
    )
$$;

drop policy if exists companies_read_by_role on public.companies;
create policy companies_read_by_role on public.companies
for select using (public.is_admin() or id = public.current_profile_company_id());

drop policy if exists company_locations_read_by_company on public.company_locations;
create policy company_locations_read_by_company on public.company_locations
for select using (public.is_same_company(company_id));

drop policy if exists profiles_read_by_company on public.profiles;
create policy profiles_read_by_company on public.profiles
for select using (public.is_admin() or company_id = public.current_profile_company_id() or id = auth.uid());

drop policy if exists clients_read_by_company on public.clients;
create policy clients_read_by_company on public.clients
for select using (public.is_same_company(company_id));

drop policy if exists shifts_read_by_role on public.shifts;
create policy shifts_read_by_role on public.shifts
for select using (public.can_read_employee_record(company_id, employee_id));

drop policy if exists tours_read_by_role on public.tours;
create policy tours_read_by_role on public.tours
for select using (public.can_read_employee_record(company_id, employee_id));

drop policy if exists tour_stops_read_by_company on public.tour_stops;
create policy tour_stops_read_by_company on public.tour_stops
for select using (public.is_same_company(company_id));

drop policy if exists tasks_read_by_role on public.tasks;
create policy tasks_read_by_role on public.tasks
for select using (public.can_read_employee_record(company_id, assigned_to));

drop policy if exists documents_read_by_role on public.documents;
create policy documents_read_by_role on public.documents
for select using (public.can_read_employee_record(company_id, uploaded_by));

drop policy if exists billing_items_read_by_company on public.billing_items;
create policy billing_items_read_by_company on public.billing_items
for select using (public.is_same_company(company_id) and public.current_profile_role() in ('admin', 'inhaber', 'verwaltung'));

drop policy if exists invoices_read_by_company on public.invoices;
create policy invoices_read_by_company on public.invoices
for select using (public.is_same_company(company_id) and public.current_profile_role() in ('admin', 'inhaber', 'verwaltung'));

drop policy if exists qm_items_read_by_company on public.qm_items;
create policy qm_items_read_by_company on public.qm_items
for select using (public.is_same_company(company_id) and public.current_profile_role() in ('admin', 'inhaber', 'pdl'));

drop policy if exists applicants_read_by_company on public.applicants;
create policy applicants_read_by_company on public.applicants
for select using (public.is_same_company(company_id) and public.current_profile_role() in ('admin', 'inhaber', 'pdl', 'verwaltung'));

drop policy if exists website_leads_read_by_company on public.website_leads;
create policy website_leads_read_by_company on public.website_leads
for select using (public.is_same_company(company_id) and public.current_profile_role() in ('admin', 'inhaber', 'verwaltung'));

drop policy if exists conversations_read_by_company on public.conversations;
create policy conversations_read_by_company on public.conversations
for select using (public.is_same_company(company_id));

drop policy if exists messages_read_by_company on public.messages;
create policy messages_read_by_company on public.messages
for select using (public.is_same_company(company_id));

drop policy if exists nuria_news_read_by_visibility on public.nuria_news;
create policy nuria_news_read_by_visibility on public.nuria_news
for select using (public.can_read_news(company_id, target_role, is_global));
