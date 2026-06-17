-- Nuria Pflege Supabase Schema
-- Generated from supabase/migrations in chronological order.

-- 20260614193000_dashboard_overview_schema.sql
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

-- 20260614203000_locations_management.sql
do $$ begin
  create type public.company_location_type as enum (
    'hauptstandort',
    'nebenstandort',
    'verwaltungsstandort',
    'aussenstelle',
    'einsatzgebiet'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.company_location_status as enum ('active', 'inactive');
exception
  when duplicate_object then null;
end $$;

alter table public.companies
  add column if not exists street text,
  add column if not exists house_number text,
  add column if not exists postal_code text,
  add column if not exists city text,
  add column if not exists state text;

alter table public.company_locations
  add column if not exists street text,
  add column if not exists house_number text,
  add column if not exists state text,
  add column if not exists email text,
  add column if not exists contact_person text,
  add column if not exists location_type public.company_location_type not null default 'nebenstandort',
  add column if not exists is_primary boolean not null default false,
  add column if not exists status public.company_location_status not null default 'active',
  add column if not exists notes text,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

update public.company_locations
set street = address
where street is null and address is not null;

create unique index if not exists company_locations_one_primary_per_company_idx
  on public.company_locations(company_id)
  where is_primary = true;

create index if not exists company_locations_company_status_idx
  on public.company_locations(company_id, status);

create or replace function public.prevent_primary_location_downgrade()
returns trigger
language plpgsql
as $$
begin
  if old.is_primary = true and (new.is_primary = false or new.location_type <> 'hauptstandort' or new.status <> 'active') then
    raise exception 'primary location cannot be downgraded or deactivated';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_primary_location_downgrade_trigger on public.company_locations;
create trigger prevent_primary_location_downgrade_trigger
before update on public.company_locations
for each row
execute function public.prevent_primary_location_downgrade();

create or replace function public.prevent_primary_location_delete()
returns trigger
language plpgsql
as $$
begin
  if old.is_primary = true then
    raise exception 'primary location cannot be deleted';
  end if;

  return old;
end;
$$;

drop trigger if exists prevent_primary_location_delete_trigger on public.company_locations;
create trigger prevent_primary_location_delete_trigger
before delete on public.company_locations
for each row
execute function public.prevent_primary_location_delete();

create or replace function public.create_primary_location_from_company()
returns trigger
language plpgsql
as $$
begin
  if new.name is not null
    and new.postal_code is not null
    and new.city is not null
    and not exists (
      select 1 from public.company_locations where company_id = new.id and is_primary = true
    )
  then
    insert into public.company_locations (
      company_id,
      name,
      street,
      house_number,
      postal_code,
      city,
      state,
      phone,
      email,
      location_type,
      is_primary,
      status
    )
    values (
      new.id,
      new.name,
      new.street,
      new.house_number,
      new.postal_code,
      new.city,
      new.state,
      new.phone,
      new.email,
      'hauptstandort',
      true,
      'active'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists create_primary_location_from_company_trigger on public.companies;
create trigger create_primary_location_from_company_trigger
after insert on public.companies
for each row
execute function public.create_primary_location_from_company();

insert into public.company_locations (
  company_id,
  name,
  street,
  house_number,
  postal_code,
  city,
  state,
  phone,
  email,
  location_type,
  is_primary,
  status
)
select
  companies.id,
  companies.name,
  companies.street,
  companies.house_number,
  companies.postal_code,
  companies.city,
  companies.state,
  companies.phone,
  companies.email,
  'hauptstandort',
  true,
  'active'
from public.companies
where companies.name is not null
  and companies.postal_code is not null
  and companies.city is not null
  and not exists (
    select 1 from public.company_locations
    where company_locations.company_id = companies.id
      and company_locations.is_primary = true
  );

drop policy if exists company_locations_insert_owner on public.company_locations;
create policy company_locations_insert_owner on public.company_locations
for insert with check (
  public.is_admin()
  or (
    company_id = public.current_profile_company_id()
    and public.current_profile_role() = 'inhaber'
    and is_primary = false
  )
);

drop policy if exists company_locations_update_owner on public.company_locations;
create policy company_locations_update_owner on public.company_locations
for update using (
  public.is_admin()
  or (
    company_id = public.current_profile_company_id()
    and public.current_profile_role() = 'inhaber'
  )
) with check (
  public.is_admin()
  or (
    company_id = public.current_profile_company_id()
    and public.current_profile_role() = 'inhaber'
  )
);

-- 20260614213000_employee_management.sql
alter type public.nuria_user_role add value if not exists 'pflegefachkraft';

do $$ begin
  create type public.employee_status as enum ('active', 'inactive', 'invited', 'pending');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.employee_invitation_status as enum ('not_invited', 'invited', 'accepted', 'expired');
exception
  when duplicate_object then null;
end $$;

alter table public.profiles
  add column if not exists phone text,
  add column if not exists job_title text,
  add column if not exists qualification text,
  add column if not exists invitation_status public.employee_invitation_status not null default 'not_invited',
  add column if not exists invited_at timestamptz,
  add column if not exists accepted_at timestamptz;

alter table public.profiles
  alter column status drop default;

do $$ begin
  alter table public.profiles
    alter column status type public.employee_status
    using status::public.employee_status;
exception
  when invalid_text_representation then
    update public.profiles set status = 'active' where status not in ('active', 'inactive', 'invited', 'pending');
    alter table public.profiles
      alter column status type public.employee_status
      using status::public.employee_status;
  when datatype_mismatch then
    null;
end $$;

alter table public.profiles
  alter column status set default 'active';

create table if not exists public.employee_locations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  location_id uuid not null references public.company_locations(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_company_staff_code_unique_idx
  on public.profiles(company_id, staff_code)
  where staff_code is not null;

create unique index if not exists employee_locations_unique_idx
  on public.employee_locations(company_id, employee_id, location_id);

create index if not exists employee_locations_company_idx
  on public.employee_locations(company_id);

alter table public.employee_locations enable row level security;

drop policy if exists employee_locations_read_by_company on public.employee_locations;
create policy employee_locations_read_by_company on public.employee_locations
for select using (public.is_same_company(company_id));

drop policy if exists employee_locations_insert_owner on public.employee_locations;
create policy employee_locations_insert_owner on public.employee_locations
for insert with check (
  public.is_admin()
  or (
    company_id = public.current_profile_company_id()
    and public.current_profile_role() = 'inhaber'
  )
);

drop policy if exists employee_locations_delete_owner on public.employee_locations;
create policy employee_locations_delete_owner on public.employee_locations
for delete using (
  public.is_admin()
  or (
    company_id = public.current_profile_company_id()
    and public.current_profile_role() = 'inhaber'
  )
);

drop policy if exists profiles_insert_owner on public.profiles;
create policy profiles_insert_owner on public.profiles
for insert with check (
  public.is_admin()
  or (
    company_id = public.current_profile_company_id()
    and public.current_profile_role() = 'inhaber'
    and role <> 'admin'
  )
);

drop policy if exists profiles_update_owner on public.profiles;
create policy profiles_update_owner on public.profiles
for update using (
  public.is_admin()
  or (
    company_id = public.current_profile_company_id()
    and public.current_profile_role() = 'inhaber'
    and role <> 'admin'
  )
) with check (
  public.is_admin()
  or (
    company_id = public.current_profile_company_id()
    and public.current_profile_role() = 'inhaber'
    and role <> 'admin'
  )
);

-- 20260614223000_roles_permissions.sql
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  key public.nuria_user_role not null,
  name text not null,
  description text,
  is_system_role boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, key)
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  category text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  role_key public.nuria_user_role not null,
  permission_key text not null references public.permissions(key) on delete cascade,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, role_key, permission_key)
);

create table if not exists public.user_permissions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  permission_key text not null references public.permissions(key) on delete cascade,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, user_id, permission_key)
);

create table if not exists public.permission_audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  changed_by uuid references public.profiles(id) on delete set null,
  target_user_id uuid references public.profiles(id) on delete set null,
  target_role public.nuria_user_role,
  permission_key text,
  old_value boolean,
  new_value boolean,
  created_at timestamptz not null default now()
);

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_permissions enable row level security;
alter table public.permission_audit_logs enable row level security;

drop policy if exists roles_read_by_company on public.roles;
create policy roles_read_by_company on public.roles
for select using (public.is_admin() or company_id = public.current_profile_company_id());

drop policy if exists permissions_read_authenticated on public.permissions;
create policy permissions_read_authenticated on public.permissions
for select using (auth.uid() is not null);

drop policy if exists role_permissions_read_by_company on public.role_permissions;
create policy role_permissions_read_by_company on public.role_permissions
for select using (public.is_same_company(company_id));

drop policy if exists role_permissions_write_owner on public.role_permissions;
create policy role_permissions_write_owner on public.role_permissions
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() = 'inhaber')
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() = 'inhaber')
);

drop policy if exists user_permissions_read_by_company on public.user_permissions;
create policy user_permissions_read_by_company on public.user_permissions
for select using (public.is_same_company(company_id));

drop policy if exists user_permissions_write_owner on public.user_permissions;
create policy user_permissions_write_owner on public.user_permissions
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() = 'inhaber')
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() = 'inhaber')
);

drop policy if exists permission_audit_logs_read_by_company on public.permission_audit_logs;
create policy permission_audit_logs_read_by_company on public.permission_audit_logs
for select using (public.is_same_company(company_id));

drop policy if exists permission_audit_logs_insert_owner on public.permission_audit_logs;
create policy permission_audit_logs_insert_owner on public.permission_audit_logs
for insert with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() = 'inhaber')
);

-- 20260614233000_company_settings.sql
alter table public.companies
  add column if not exists legal_name text,
  add column if not exists website text,
  add column if not exists country text,
  add column if not exists ik_number text,
  add column if not exists tax_number text,
  add column if not exists billing_email text,
  add column if not exists billing_interval text;

create table if not exists public.company_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  timezone text not null default 'Europe/Berlin',
  date_format text not null default 'DD.MM.YYYY',
  week_start text not null default 'monday',
  default_language text not null default 'de',
  allow_pdl_manage_employees boolean not null default false,
  allow_pdl_manage_roles boolean not null default false,
  allow_pdl_export boolean not null default false,
  allow_verwaltung_export boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  theme text not null default 'system',
  notifications_enabled boolean not null default true,
  email_notifications boolean not null default true,
  internal_system_notifications boolean not null default true,
  payment_status_notifications boolean not null default true,
  new_message_notifications boolean not null default true,
  new_document_notifications boolean not null default true,
  new_application_notifications boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, company_id)
);

alter table public.user_settings
  add column if not exists internal_system_notifications boolean not null default true,
  add column if not exists payment_status_notifications boolean not null default true,
  add column if not exists new_message_notifications boolean not null default true,
  add column if not exists new_document_notifications boolean not null default true,
  add column if not exists new_application_notifications boolean not null default true;

alter table public.user_settings
  drop constraint if exists user_settings_theme_check;

alter table public.user_settings
  add constraint user_settings_theme_check check (theme in ('light', 'dark', 'system'));

alter table public.company_settings enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists company_settings_read_by_company on public.company_settings;
create policy company_settings_read_by_company on public.company_settings
for select using (public.is_same_company(company_id));

drop policy if exists company_settings_write_owner on public.company_settings;
create policy company_settings_write_owner on public.company_settings
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() = 'inhaber')
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() = 'inhaber')
);

drop policy if exists user_settings_read_by_owner on public.user_settings;
create policy user_settings_read_by_owner on public.user_settings
for select using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and user_id = auth.uid())
);

drop policy if exists user_settings_write_owner on public.user_settings;
create policy user_settings_write_owner on public.user_settings
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and user_id = auth.uid())
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and user_id = auth.uid())
);

-- 20260615000000_clients_management.sql
alter table public.clients
  add column if not exists client_number text,
  add column if not exists date_of_birth date,
  add column if not exists gender text,
  add column if not exists street text,
  add column if not exists house_number text,
  add column if not exists postal_code text,
  add column if not exists city text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists care_level text not null default 'unknown',
  add column if not exists insurance_provider text,
  add column if not exists insurance_number text,
  add column if not exists primary_contact_name text,
  add column if not exists primary_contact_phone text,
  add column if not exists primary_contact_email text,
  add column if not exists primary_contact_relation text,
  add column if not exists notes text,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

alter table public.clients
  alter column first_name set not null,
  alter column last_name set not null;

alter table public.clients
  drop constraint if exists clients_status_check;

alter table public.clients
  add constraint clients_status_check check (status in ('active', 'inactive', 'paused'));

alter table public.clients
  drop constraint if exists clients_care_level_check;

alter table public.clients
  add constraint clients_care_level_check check (care_level in ('none', '1', '2', '3', '4', '5', 'applied', 'unknown'));

create table if not exists public.client_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  relation text,
  phone text,
  email text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  note text not null,
  visibility text not null default 'internal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_company_status_idx on public.clients(company_id, status);
create index if not exists clients_company_location_idx on public.clients(company_id, location_id);
create index if not exists client_contacts_company_client_idx on public.client_contacts(company_id, client_id);
create index if not exists client_notes_company_client_idx on public.client_notes(company_id, client_id);

alter table public.client_contacts enable row level security;
alter table public.client_notes enable row level security;

drop policy if exists clients_write_owner on public.clients;
create policy clients_write_owner on public.clients
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
);

drop policy if exists client_contacts_read_by_company on public.client_contacts;
create policy client_contacts_read_by_company on public.client_contacts
for select using (public.is_same_company(company_id));

drop policy if exists client_contacts_write_owner on public.client_contacts;
create policy client_contacts_write_owner on public.client_contacts
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
);

drop policy if exists client_notes_read_by_company on public.client_notes;
create policy client_notes_read_by_company on public.client_notes
for select using (public.is_same_company(company_id));

drop policy if exists client_notes_write_owner on public.client_notes;
create policy client_notes_write_owner on public.client_notes
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
);

-- 20260615010000_shift_planning.sql
alter table public.shifts
  add column if not exists title text,
  add column if not exists shift_type text not null default 'pflegeeinsatz',
  add column if not exists notes text,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

update public.shifts
set title = 'Dienst'
where title is null;

alter table public.shifts
  alter column title set not null;

alter table public.shifts
  drop constraint if exists shifts_status_check;

alter table public.shifts
  add constraint shifts_status_check check (status in ('planned', 'in_progress', 'completed', 'cancelled'));

alter table public.shifts
  drop constraint if exists shifts_shift_type_check;

alter table public.shifts
  add constraint shifts_shift_type_check check (shift_type in ('pflegeeinsatz', 'hauswirtschaft', 'beratung', 'verwaltung', 'bereitschaft', 'sonstiges'));

create table if not exists public.shift_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  shift_id uuid not null references public.shifts(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  role_in_shift text,
  created_at timestamptz not null default now()
);

create table if not exists public.shift_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  shift_id uuid not null references public.shifts(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shifts_company_status_idx on public.shifts(company_id, status);
create index if not exists shifts_company_employee_idx on public.shifts(company_id, employee_id);
create index if not exists shifts_company_client_idx on public.shifts(company_id, client_id);
create index if not exists shift_assignments_company_shift_idx on public.shift_assignments(company_id, shift_id);
create index if not exists shift_notes_company_shift_idx on public.shift_notes(company_id, shift_id);

alter table public.shift_assignments enable row level security;
alter table public.shift_notes enable row level security;

drop policy if exists shifts_write_owner on public.shifts;
create policy shifts_write_owner on public.shifts
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
);

drop policy if exists shift_assignments_read_by_company on public.shift_assignments;
create policy shift_assignments_read_by_company on public.shift_assignments
for select using (public.is_same_company(company_id));

drop policy if exists shift_assignments_write_owner on public.shift_assignments;
create policy shift_assignments_write_owner on public.shift_assignments
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
);

drop policy if exists shift_notes_read_by_company on public.shift_notes;
create policy shift_notes_read_by_company on public.shift_notes
for select using (public.is_same_company(company_id));

drop policy if exists shift_notes_write_owner on public.shift_notes;
create policy shift_notes_write_owner on public.shift_notes
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
);

-- 20260615020000_tour_planning.sql
alter table public.tours
  add column if not exists location_id uuid references public.company_locations(id) on delete set null,
  add column if not exists title text,
  add column if not exists tour_date date,
  add column if not exists suggested_start_time time,
  add column if not exists suggested_end_time time,
  add column if not exists notes text,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

update public.tours set tour_date = date where tour_date is null;
update public.tours set title = 'Tour' where title is null;

alter table public.tours
  alter column title set not null,
  alter column tour_date set not null;

alter table public.tours
  drop constraint if exists tours_status_check;

alter table public.tours
  add constraint tours_status_check check (status in ('planned', 'in_progress', 'completed', 'cancelled'));

alter table public.tour_stops
  add column if not exists shift_id uuid references public.shifts(id) on delete set null,
  add column if not exists tasks text,
  add column if not exists notes text,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz;

alter table public.tour_stops
  drop constraint if exists tour_stops_status_check;

alter table public.tour_stops
  add constraint tour_stops_status_check check (status in ('planned', 'in_progress', 'completed', 'skipped', 'cancelled'));

create table if not exists public.tour_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  tour_id uuid not null references public.tours(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tours_company_tour_date_idx on public.tours(company_id, tour_date);
create index if not exists tours_company_status_idx on public.tours(company_id, status);
create index if not exists tour_stops_company_tour_order_idx on public.tour_stops(company_id, tour_id, sort_order);
create index if not exists tour_notes_company_tour_idx on public.tour_notes(company_id, tour_id);

alter table public.tour_notes enable row level security;

drop policy if exists tours_write_owner on public.tours;
create policy tours_write_owner on public.tours
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
);

drop policy if exists tour_stops_write_owner on public.tour_stops;
create policy tour_stops_write_owner on public.tour_stops
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
);

drop policy if exists tour_notes_read_by_company on public.tour_notes;
create policy tour_notes_read_by_company on public.tour_notes
for select using (public.is_same_company(company_id));

drop policy if exists tour_notes_write_owner on public.tour_notes;
create policy tour_notes_write_owner on public.tour_notes
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
);

-- 20260615030000_time_tracking.sql
create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  location_id uuid references public.company_locations(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  tour_id uuid references public.tours(id) on delete set null,
  tour_stop_id uuid references public.tour_stops(id) on delete set null,
  shift_id uuid references public.shifts(id) on delete set null,
  entry_date date not null,
  start_time time not null,
  end_time time not null,
  break_minutes integer not null default 0,
  duration_minutes integer not null default 0,
  entry_type text not null default 'work_time',
  status text not null default 'draft',
  source text not null default 'manual',
  notes text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.time_entries
  add column if not exists location_id uuid references public.company_locations(id) on delete set null,
  add column if not exists client_id uuid references public.clients(id) on delete set null,
  add column if not exists tour_id uuid references public.tours(id) on delete set null,
  add column if not exists tour_stop_id uuid references public.tour_stops(id) on delete set null,
  add column if not exists shift_id uuid references public.shifts(id) on delete set null,
  add column if not exists break_minutes integer not null default 0,
  add column if not exists duration_minutes integer not null default 0,
  add column if not exists entry_type text not null default 'work_time',
  add column if not exists source text not null default 'manual',
  add column if not exists notes text,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

alter table public.time_entries drop constraint if exists time_entries_status_check;
alter table public.time_entries add constraint time_entries_status_check check (status in ('draft', 'submitted', 'approved', 'rejected', 'corrected'));
alter table public.time_entries drop constraint if exists time_entries_type_check;
alter table public.time_entries add constraint time_entries_type_check check (entry_type in ('work_time', 'client_visit', 'tour_time', 'break', 'admin_time', 'other'));
alter table public.time_entries drop constraint if exists time_entries_source_check;
alter table public.time_entries add constraint time_entries_source_check check (source in ('manual', 'tour_wizard', 'system'));

create table if not exists public.time_entry_audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  time_entry_id uuid not null references public.time_entries(id) on delete cascade,
  changed_by uuid references public.profiles(id) on delete set null,
  action text not null,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

create index if not exists time_entries_company_date_idx on public.time_entries(company_id, entry_date);
create index if not exists time_entries_company_employee_idx on public.time_entries(company_id, employee_id);
create index if not exists time_entries_company_status_idx on public.time_entries(company_id, status);
create index if not exists time_entry_audit_logs_company_entry_idx on public.time_entry_audit_logs(company_id, time_entry_id);

alter table public.time_entries enable row level security;
alter table public.time_entry_audit_logs enable row level security;

drop policy if exists time_entries_read_by_company on public.time_entries;
create policy time_entries_read_by_company on public.time_entries
for select using (public.is_same_company(company_id));

drop policy if exists time_entries_write_owner on public.time_entries;
create policy time_entries_write_owner on public.time_entries
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
);

drop policy if exists time_entry_audit_logs_read_by_company on public.time_entry_audit_logs;
create policy time_entry_audit_logs_read_by_company on public.time_entry_audit_logs
for select using (public.is_same_company(company_id));

drop policy if exists time_entry_audit_logs_write_owner on public.time_entry_audit_logs;
create policy time_entry_audit_logs_write_owner on public.time_entry_audit_logs
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
);

-- 20260615040000_care_documentation.sql
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

-- 20260615050000_billing_management.sql
alter table public.billing_items
  add column if not exists employee_id uuid references public.profiles(id) on delete set null,
  add column if not exists shift_id uuid references public.shifts(id) on delete set null,
  add column if not exists tour_id uuid references public.tours(id) on delete set null,
  add column if not exists tour_stop_id uuid references public.tour_stops(id) on delete set null,
  add column if not exists time_entry_id uuid references public.time_entries(id) on delete set null,
  add column if not exists service_date date,
  add column if not exists service_type text not null default 'sonstiges',
  add column if not exists description text,
  add column if not exists quantity numeric(12,2) not null default 1,
  add column if not exists unit text not null default 'flat',
  add column if not exists unit_price numeric(12,2) not null default 0,
  add column if not exists total_amount numeric(12,2) not null default 0,
  add column if not exists payer_type text not null default 'sonstiges',
  add column if not exists payer_name text,
  add column if not exists notes text,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

update public.billing_items set service_date = created_at::date where service_date is null;
update public.billing_items set description = 'Abrechnungsposition' where description is null;
update public.billing_items set total_amount = quantity * unit_price where total_amount = 0;

alter table public.billing_items alter column service_date set not null, alter column description set not null;
alter table public.billing_items drop constraint if exists billing_items_service_type_check;
alter table public.billing_items add constraint billing_items_service_type_check check (service_type in ('grundpflege','behandlungspflege','hauswirtschaft','betreuung','beratung','fahrtkosten','sonstiges'));
alter table public.billing_items drop constraint if exists billing_items_unit_check;
alter table public.billing_items add constraint billing_items_unit_check check (unit in ('minute','hour','visit','piece','flat'));
alter table public.billing_items drop constraint if exists billing_items_payer_type_check;
alter table public.billing_items add constraint billing_items_payer_type_check check (payer_type in ('pflegekasse','krankenkasse','privat','sozialamt','sonstiges'));
alter table public.billing_items drop constraint if exists billing_items_status_check;
alter table public.billing_items add constraint billing_items_status_check check (status in ('draft','ready','billed','paid','cancelled'));

alter table public.invoices
  add column if not exists invoice_number text,
  add column if not exists invoice_date date,
  add column if not exists billing_period_start date,
  add column if not exists billing_period_end date,
  add column if not exists recipient_name text,
  add column if not exists recipient_email text,
  add column if not exists recipient_address text,
  add column if not exists subtotal_amount numeric(12,2) not null default 0,
  add column if not exists tax_amount numeric(12,2) not null default 0,
  add column if not exists total_amount numeric(12,2) not null default 0,
  add column if not exists payment_status text not null default 'open',
  add column if not exists notes text,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

update public.invoices set invoice_date = created_at::date where invoice_date is null;
alter table public.invoices drop constraint if exists invoices_status_check;
alter table public.invoices add constraint invoices_status_check check (status in ('draft','issued','cancelled'));
alter table public.invoices drop constraint if exists invoices_payment_status_check;
alter table public.invoices add constraint invoices_payment_status_check check (payment_status in ('open','partially_paid','paid','overdue','cancelled'));

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  billing_item_id uuid not null references public.billing_items(id) on delete cascade,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit text not null,
  unit_price numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  record_type text not null,
  record_id uuid not null,
  changed_by uuid references public.profiles(id) on delete set null,
  action text not null,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

create index if not exists billing_items_company_date_idx on public.billing_items(company_id, service_date);
create index if not exists invoices_company_date_idx on public.invoices(company_id, invoice_date);
create index if not exists invoice_items_company_invoice_idx on public.invoice_items(company_id, invoice_id);

alter table public.invoice_items enable row level security;
alter table public.billing_audit_logs enable row level security;

drop policy if exists billing_items_write_owner on public.billing_items;
create policy billing_items_write_owner on public.billing_items for all using (public.is_admin() or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber','verwaltung'))) with check (public.is_admin() or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber','verwaltung')));
drop policy if exists invoices_write_owner on public.invoices;
create policy invoices_write_owner on public.invoices for all using (public.is_admin() or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber','verwaltung'))) with check (public.is_admin() or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber','verwaltung')));
drop policy if exists invoice_items_read_by_company on public.invoice_items;
create policy invoice_items_read_by_company on public.invoice_items for select using (public.is_same_company(company_id));
drop policy if exists invoice_items_write_owner on public.invoice_items;
create policy invoice_items_write_owner on public.invoice_items for all using (public.is_admin() or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber','verwaltung'))) with check (public.is_admin() or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber','verwaltung')));
drop policy if exists billing_audit_logs_read_by_company on public.billing_audit_logs;
create policy billing_audit_logs_read_by_company on public.billing_audit_logs for select using (public.is_same_company(company_id));
drop policy if exists billing_audit_logs_write_owner on public.billing_audit_logs;
create policy billing_audit_logs_write_owner on public.billing_audit_logs for all using (public.is_admin() or company_id = public.current_profile_company_id()) with check (public.is_admin() or company_id = public.current_profile_company_id());

-- 20260615060000_documents_management.sql
insert into storage.buckets (id, name, public)
values ('company-documents', 'company-documents', false)
on conflict (id) do nothing;

alter table public.documents
  add column if not exists employee_id uuid references public.profiles(id) on delete set null,
  add column if not exists shift_id uuid references public.shifts(id) on delete set null,
  add column if not exists tour_id uuid references public.tours(id) on delete set null,
  add column if not exists tour_stop_id uuid references public.tour_stops(id) on delete set null,
  add column if not exists invoice_id uuid references public.invoices(id) on delete set null,
  add column if not exists billing_item_id uuid references public.billing_items(id) on delete set null,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists category text not null default 'sonstiges',
  add column if not exists visibility text not null default 'management',
  add column if not exists file_path text,
  add column if not exists file_type text,
  add column if not exists mime_type text,
  add column if not exists file_size bigint not null default 0,
  add column if not exists storage_bucket text not null default 'company-documents',
  add column if not exists uploaded_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz;

update public.documents set title = coalesce(title, file_name, 'Dokument') where title is null;
update public.documents set file_path = coalesce(file_path, file_url) where file_path is null;

alter table public.documents alter column title set not null;
alter table public.documents drop constraint if exists documents_category_check;
alter table public.documents add constraint documents_category_check check (category in ('verordnung','vertrag','pflegeakte','abrechnung','qualifikation','nachweis','bild','sonstiges'));
alter table public.documents drop constraint if exists documents_status_check;
alter table public.documents add constraint documents_status_check check (status in ('active','archived','pending_review','deleted'));
alter table public.documents drop constraint if exists documents_visibility_check;
alter table public.documents add constraint documents_visibility_check check (visibility in ('management','care_team','employee_private','client_related'));

create table if not exists public.document_audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  changed_by uuid references public.profiles(id) on delete set null,
  action text not null,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

create index if not exists documents_company_category_idx on public.documents(company_id, category);
create index if not exists documents_company_deleted_idx on public.documents(company_id, deleted_at);
create index if not exists document_audit_logs_company_doc_idx on public.document_audit_logs(company_id, document_id);

alter table public.document_audit_logs enable row level security;

drop policy if exists documents_write_owner on public.documents;
create policy documents_write_owner on public.documents for all using (public.is_admin() or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber','pdl','verwaltung'))) with check (public.is_admin() or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber','pdl','verwaltung')));
drop policy if exists document_audit_logs_read_by_company on public.document_audit_logs;
create policy document_audit_logs_read_by_company on public.document_audit_logs for select using (public.is_same_company(company_id));
drop policy if exists document_audit_logs_write_owner on public.document_audit_logs;
create policy document_audit_logs_write_owner on public.document_audit_logs for all using (public.is_admin() or company_id = public.current_profile_company_id()) with check (public.is_admin() or company_id = public.current_profile_company_id());

-- 20260615070000_communication.sql
alter table public.conversations
  add column if not exists conversation_type text not null default 'group',
  add column if not exists status text not null default 'active',
  add column if not exists last_message_at timestamptz,
  add column if not exists archived_at timestamptz;

update public.conversations set conversation_type = type where conversation_type is null and type is not null;

alter table public.conversations drop constraint if exists conversations_type_check;
alter table public.conversations add constraint conversations_type_check check (conversation_type in ('direct','group','announcement','support'));
alter table public.conversations drop constraint if exists conversations_status_check;
alter table public.conversations add constraint conversations_status_check check (status in ('active','archived'));

create table if not exists public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  is_muted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (conversation_id, user_id)
);

alter table public.messages
  add column if not exists message_type text not null default 'text',
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz;

alter table public.messages drop constraint if exists messages_type_check;
alter table public.messages add constraint messages_type_check check (message_type in ('text','system'));

create table if not exists public.message_read_receipts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (message_id, user_id)
);

create table if not exists public.conversation_audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  changed_by uuid references public.profiles(id) on delete set null,
  action text not null,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

create index if not exists conversations_company_last_idx on public.conversations(company_id, last_message_at);
create index if not exists conversation_participants_company_conversation_idx on public.conversation_participants(company_id, conversation_id);
create index if not exists messages_company_conversation_idx on public.messages(company_id, conversation_id, created_at);

alter table public.conversation_participants enable row level security;
alter table public.message_read_receipts enable row level security;
alter table public.conversation_audit_logs enable row level security;

drop policy if exists conversations_write_owner on public.conversations;
create policy conversations_write_owner on public.conversations for all using (public.is_admin() or company_id = public.current_profile_company_id()) with check (public.is_admin() or company_id = public.current_profile_company_id());
drop policy if exists messages_write_company on public.messages;
create policy messages_write_company on public.messages for all using (public.is_admin() or company_id = public.current_profile_company_id()) with check (public.is_admin() or company_id = public.current_profile_company_id());
drop policy if exists conversation_participants_read_by_company on public.conversation_participants;
create policy conversation_participants_read_by_company on public.conversation_participants for select using (public.is_same_company(company_id));
drop policy if exists conversation_participants_write_owner on public.conversation_participants;
create policy conversation_participants_write_owner on public.conversation_participants for all using (public.is_admin() or company_id = public.current_profile_company_id()) with check (public.is_admin() or company_id = public.current_profile_company_id());
drop policy if exists message_read_receipts_read_by_company on public.message_read_receipts;
create policy message_read_receipts_read_by_company on public.message_read_receipts for select using (public.is_same_company(company_id));
drop policy if exists message_read_receipts_write_company on public.message_read_receipts;
create policy message_read_receipts_write_company on public.message_read_receipts for all using (public.is_admin() or company_id = public.current_profile_company_id()) with check (public.is_admin() or company_id = public.current_profile_company_id());
drop policy if exists conversation_audit_logs_read_by_company on public.conversation_audit_logs;
create policy conversation_audit_logs_read_by_company on public.conversation_audit_logs for select using (public.is_same_company(company_id));
drop policy if exists conversation_audit_logs_write_company on public.conversation_audit_logs;
create policy conversation_audit_logs_write_company on public.conversation_audit_logs for all using (public.is_admin() or company_id = public.current_profile_company_id()) with check (public.is_admin() or company_id = public.current_profile_company_id());

-- 20260615080000_applicants_management.sql
alter table public.applicants
  add column if not exists location_id uuid references public.company_locations(id) on delete set null,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists desired_position text not null default 'sonstiges',
  add column if not exists qualification text,
  add column if not exists availability text,
  add column if not exists source text not null default 'manual',
  add column if not exists rating text not null default 'none',
  add column if not exists notes text,
  add column if not exists last_contact_at timestamptz,
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_by uuid references public.profiles(id) on delete set null,
  add column if not exists archived_at timestamptz;

update public.applicants set status = 'new' where status = 'open';
update public.applicants set first_name = 'Unbekannt' where first_name is null;
update public.applicants set last_name = 'Unbekannt' where last_name is null;
alter table public.applicants alter column status set default 'new';
alter table public.applicants alter column first_name set not null;
alter table public.applicants alter column last_name set not null;

alter table public.applicants
  drop constraint if exists applicants_status_check,
  add constraint applicants_status_check check (status in ('new','contacted','interview_planned','interview_done','offer_sent','hired','rejected','archived'));

alter table public.applicants
  drop constraint if exists applicants_rating_check,
  add constraint applicants_rating_check check (rating in ('none','interesting','strong','not_suitable'));

alter table public.applicants
  drop constraint if exists applicants_source_check,
  add constraint applicants_source_check check (source in ('manual','website','facebook','instagram','recommendation','job_portal','phone','email','other'));

alter table public.applicants
  drop constraint if exists applicants_desired_position_check,
  add constraint applicants_desired_position_check check (desired_position in ('pflegefachkraft','pflegehelfer','hauswirtschaft','betreuungskraft','verwaltung','pdl','azubi','quereinsteiger','sonstiges'));

create index if not exists applicants_company_followup_idx on public.applicants(company_id, next_follow_up_at);
create index if not exists applicants_company_location_idx on public.applicants(company_id, location_id);
create index if not exists applicants_company_archived_idx on public.applicants(company_id, archived_at);

drop policy if exists applicants_insert_by_company on public.applicants;
create policy applicants_insert_by_company on public.applicants
for insert with check (
  public.is_same_company(company_id)
  and public.current_profile_role() in ('admin', 'inhaber', 'pdl', 'verwaltung')
);

drop policy if exists applicants_update_by_company on public.applicants;
create policy applicants_update_by_company on public.applicants
for update using (
  public.is_same_company(company_id)
  and public.current_profile_role() in ('admin', 'inhaber', 'pdl', 'verwaltung')
)
with check (
  public.is_same_company(company_id)
  and public.current_profile_role() in ('admin', 'inhaber', 'pdl', 'verwaltung')
);

-- 20260615090000_website_online_presence.sql
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

-- 20260615100000_qm_md_management.sql
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

-- 20260615110000_export_jobs.sql
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

-- 20260615120000_activity_logs.sql
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

-- 20260615130000_compliance_management.sql
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

-- 20260615140000_payment_subscription.sql
alter table public.companies
  add column if not exists billing_interval text,
  add column if not exists payment_marked_at timestamptz,
  add column if not exists payment_due_check_at timestamptz,
  add column if not exists admin_confirmed_at timestamptz,
  add column if not exists locked_at timestamptz,
  add column if not exists legal_name text,
  add column if not exists street text,
  add column if not exists house_number text,
  add column if not exists postal_code text,
  add column if not exists city text,
  add column if not exists country text,
  add column if not exists billing_email text;

create table if not exists public.company_subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  package_id text not null,
  package_name text not null,
  monthly_price numeric(12,2) not null,
  billing_interval text not null,
  discount_percent numeric(5,2) not null default 0,
  subtotal_amount numeric(12,2) not null,
  total_amount numeric(12,2) not null,
  currency text not null default 'EUR',
  status text not null default 'pending',
  started_at timestamptz not null default now(),
  current_period_start date,
  current_period_end date,
  is_legacy_plan boolean not null default false,
  plan_version text not null default '2026-start',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_subscriptions_status_check check (status in ('pending','payment_marked_as_sent','active','overdue','locked','cancelled')),
  constraint company_subscriptions_interval_check check (billing_interval in ('monthly','quarterly','half_yearly','yearly'))
);

create table if not exists public.company_payment_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  subscription_id uuid references public.company_subscriptions(id) on delete set null,
  amount numeric(12,2) not null,
  currency text not null default 'EUR',
  billing_interval text not null,
  payment_method text not null default 'bank_transfer',
  status text not null default 'pending',
  marked_by uuid references public.profiles(id) on delete set null,
  marked_at timestamptz,
  confirmed_by uuid references public.profiles(id) on delete set null,
  confirmed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_payment_logs_method_check check (payment_method in ('bank_transfer')),
  constraint company_payment_logs_status_check check (status in ('pending','marked_as_sent','confirmed','rejected','overdue'))
);

create index if not exists company_subscriptions_company_idx on public.company_subscriptions(company_id, status);
create index if not exists company_payment_logs_company_idx on public.company_payment_logs(company_id, created_at desc);

alter table public.company_subscriptions enable row level security;
alter table public.company_payment_logs enable row level security;

drop policy if exists company_subscriptions_read_by_company on public.company_subscriptions;
create policy company_subscriptions_read_by_company on public.company_subscriptions for select using (public.is_same_company(company_id));
drop policy if exists company_subscriptions_insert_by_company on public.company_subscriptions;
create policy company_subscriptions_insert_by_company on public.company_subscriptions for insert with check (public.is_same_company(company_id));
drop policy if exists company_subscriptions_update_by_company on public.company_subscriptions;
create policy company_subscriptions_update_by_company on public.company_subscriptions for update using (public.is_same_company(company_id)) with check (public.is_same_company(company_id));
drop policy if exists company_payment_logs_read_by_company on public.company_payment_logs;
create policy company_payment_logs_read_by_company on public.company_payment_logs for select using (public.is_same_company(company_id));
drop policy if exists company_payment_logs_insert_by_company on public.company_payment_logs;
create policy company_payment_logs_insert_by_company on public.company_payment_logs for insert with check (public.is_same_company(company_id));

-- 20260615150000_staff_schedule_rls.sql
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

-- 20260615160000_staff_tour_rls.sql
alter table public.time_entries
  drop constraint if exists time_entries_tour_stop_employee_unique;

create unique index if not exists time_entries_tour_stop_employee_unique
  on public.time_entries(company_id, employee_id, tour_stop_id)
  where tour_stop_id is not null;

create or replace function public.can_read_tour_record(record_company_id uuid, record_tour_id uuid, record_employee_id uuid)
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
        public.current_profile_role() in ('inhaber', 'pdl')
        or record_employee_id = auth.uid()
      )
    )
$$;

create or replace function public.can_read_tour_stop_record(record_company_id uuid, record_tour_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.tours
      where tours.id = record_tour_id
        and public.can_read_tour_record(tours.company_id, tours.id, tours.employee_id)
    )
$$;

drop policy if exists tours_read_by_role on public.tours;
create policy tours_read_by_role on public.tours
for select using (public.can_read_tour_record(company_id, id, employee_id));

drop policy if exists tours_write_owner on public.tours;
create policy tours_write_owner on public.tours
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
  or (company_id = public.current_profile_company_id() and employee_id = auth.uid())
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
  or (company_id = public.current_profile_company_id() and employee_id = auth.uid())
);

drop policy if exists tour_stops_read_by_company on public.tour_stops;
create policy tour_stops_read_by_company on public.tour_stops
for select using (public.can_read_tour_stop_record(company_id, tour_id));

drop policy if exists tour_stops_write_owner on public.tour_stops;
create policy tour_stops_write_owner on public.tour_stops
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
  or public.can_read_tour_stop_record(company_id, tour_id)
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
  or public.can_read_tour_stop_record(company_id, tour_id)
);

drop policy if exists time_entries_read_by_company on public.time_entries;
create policy time_entries_read_by_company on public.time_entries
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

drop policy if exists time_entries_write_owner on public.time_entries;
create policy time_entries_write_owner on public.time_entries
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
  or (company_id = public.current_profile_company_id() and employee_id = auth.uid())
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
  or (company_id = public.current_profile_company_id() and employee_id = auth.uid())
);

drop policy if exists care_documentation_read_by_company on public.care_documentation;
create policy care_documentation_read_by_company on public.care_documentation
for select using (
  public.is_admin()
  or (
    company_id = public.current_profile_company_id()
    and (
      public.current_profile_role() in ('inhaber', 'pdl')
      or employee_id = auth.uid()
      or created_by = auth.uid()
    )
  )
);

drop policy if exists care_documentation_write_owner on public.care_documentation;
create policy care_documentation_write_owner on public.care_documentation
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
  or (company_id = public.current_profile_company_id() and (employee_id = auth.uid() or created_by = auth.uid()))
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
  or (
    company_id = public.current_profile_company_id()
    and employee_id = auth.uid()
    and created_by = auth.uid()
    and public.can_read_client_for_current_user(company_id, client_id)
  )
);

-- 20260615170000_staff_client_access.sql
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

-- 20260615180000_staff_notes_rls.sql
alter table public.care_documentation drop constraint if exists care_documentation_category_check;
alter table public.care_documentation add constraint care_documentation_category_check
  check (category in ('pflegebericht', 'uebergabe', 'beobachtung', 'hinweis', 'massnahme', 'vitalwerte', 'wunde', 'medikation', 'ereignis', 'sonstiges'));

drop policy if exists care_documentation_read_by_company on public.care_documentation;
create policy care_documentation_read_by_company on public.care_documentation
for select using (
  public.is_admin()
  or (
    company_id = public.current_profile_company_id()
    and (
      public.current_profile_role() in ('inhaber', 'pdl')
      or employee_id = auth.uid()
      or created_by = auth.uid()
      or (
        visibility = 'care_team'
        and public.can_read_client_for_current_user(company_id, client_id)
      )
    )
  )
);

drop policy if exists care_documentation_write_owner on public.care_documentation;
create policy care_documentation_write_owner on public.care_documentation
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
  or (company_id = public.current_profile_company_id() and (employee_id = auth.uid() or created_by = auth.uid()))
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
  or (
    company_id = public.current_profile_company_id()
    and employee_id = auth.uid()
    and created_by = auth.uid()
    and public.can_read_client_for_current_user(company_id, client_id)
  )
);

-- 20260615190000_staff_document_uploads.sql
alter table public.documents drop constraint if exists documents_category_check;
alter table public.documents add constraint documents_category_check
  check (category in ('verordnung','arztbrief','pflegeunterlage','foto','vertrag','pflegeakte','abrechnung','qualifikation','nachweis','bild','sonstiges'));

drop policy if exists documents_read_by_role on public.documents;
create policy documents_read_by_role on public.documents
for select using (
  public.is_admin()
  or (
    company_id = public.current_profile_company_id()
    and (
      public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung')
      or uploaded_by = auth.uid()
      or employee_id = auth.uid()
      or (
        visibility = 'care_team'
        and client_id is not null
        and public.can_read_client_for_current_user(company_id, client_id)
      )
    )
  )
);

drop policy if exists documents_write_owner on public.documents;
create policy documents_write_owner on public.documents
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber','pdl','verwaltung'))
  or (
    company_id = public.current_profile_company_id()
    and uploaded_by = auth.uid()
    and employee_id = auth.uid()
  )
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber','pdl','verwaltung'))
  or (
    company_id = public.current_profile_company_id()
    and uploaded_by = auth.uid()
    and employee_id = auth.uid()
    and client_id is not null
    and public.can_read_client_for_current_user(company_id, client_id)
  )
);

drop policy if exists company_documents_staff_insert on storage.objects;
create policy company_documents_staff_insert on storage.objects
for insert with check (
  bucket_id = 'company-documents'
  and auth.uid() is not null
  and split_part(name, '/', 1)::uuid = public.current_profile_company_id()
  and public.can_read_client_for_current_user(split_part(name, '/', 1)::uuid, split_part(name, '/', 2)::uuid)
);

drop policy if exists company_documents_staff_read on storage.objects;
create policy company_documents_staff_read on storage.objects
for select using (
  bucket_id = 'company-documents'
  and auth.uid() is not null
  and split_part(name, '/', 1)::uuid = public.current_profile_company_id()
  and exists (
    select 1
    from public.documents
    where documents.storage_bucket = storage.objects.bucket_id
      and documents.file_path = storage.objects.name
      and documents.deleted_at is null
      and documents.status <> 'deleted'
      and (
        public.current_profile_role() in ('inhaber','pdl','verwaltung')
        or documents.uploaded_by = auth.uid()
        or documents.employee_id = auth.uid()
        or (
          documents.visibility = 'care_team'
          and documents.client_id is not null
          and public.can_read_client_for_current_user(documents.company_id, documents.client_id)
        )
      )
  )
);

-- 20260615200000_staff_time_tracking.sql
alter table public.time_entries
  alter column end_time drop not null;

alter table public.time_entries drop constraint if exists time_entries_status_check;
alter table public.time_entries add constraint time_entries_status_check
  check (status in ('draft', 'running', 'submitted', 'approved', 'rejected', 'corrected'));

alter table public.time_entries drop constraint if exists time_entries_type_check;
alter table public.time_entries add constraint time_entries_type_check
  check (entry_type in ('work_time', 'break', 'client_visit', 'tour_time', 'shift_time', 'manual_correction', 'admin_time', 'other'));

alter table public.time_entries drop constraint if exists time_entries_source_check;
alter table public.time_entries add constraint time_entries_source_check
  check (source in ('manual', 'manual_employee', 'tour_wizard', 'system'));

create unique index if not exists time_entries_one_running_work_entry
  on public.time_entries(company_id, employee_id)
  where status = 'running' and entry_type = 'work_time';

drop policy if exists time_entries_read_by_company on public.time_entries;
create policy time_entries_read_by_company on public.time_entries
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

drop policy if exists time_entries_write_owner on public.time_entries;
create policy time_entries_write_owner on public.time_entries
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
  or (
    company_id = public.current_profile_company_id()
    and employee_id = auth.uid()
    and status in ('running', 'submitted')
  )
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
  or (
    company_id = public.current_profile_company_id()
    and employee_id = auth.uid()
    and created_by = auth.uid()
    and status in ('running', 'submitted')
  )
);

-- 20260615210000_staff_communication_rls.sql
alter table public.conversations drop constraint if exists conversations_type_check;
alter table public.conversations add constraint conversations_type_check
  check (conversation_type in ('direct','group','team','announcement','support','handover','tour','client_related'));

alter table public.messages drop constraint if exists messages_type_check;
alter table public.messages add constraint messages_type_check
  check (message_type in ('text','image','file','system'));

create or replace function public.can_access_conversation(record_company_id uuid, record_conversation_id uuid)
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
          from public.conversation_participants
          where conversation_participants.company_id = record_company_id
            and conversation_participants.conversation_id = record_conversation_id
            and conversation_participants.user_id = auth.uid()
        )
      )
    )
$$;

drop policy if exists conversations_read_by_company on public.conversations;
create policy conversations_read_by_company on public.conversations
for select using (public.can_access_conversation(company_id, id));

drop policy if exists conversations_write_owner on public.conversations;
create policy conversations_write_owner on public.conversations
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
  or public.can_access_conversation(company_id, id)
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
  or company_id = public.current_profile_company_id()
);

drop policy if exists conversation_participants_read_by_company on public.conversation_participants;
create policy conversation_participants_read_by_company on public.conversation_participants
for select using (public.can_access_conversation(company_id, conversation_id));

drop policy if exists conversation_participants_write_owner on public.conversation_participants;
create policy conversation_participants_write_owner on public.conversation_participants
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
  or (company_id = public.current_profile_company_id() and user_id = auth.uid())
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
  or (company_id = public.current_profile_company_id() and user_id = auth.uid())
);

drop policy if exists messages_read_by_company on public.messages;
create policy messages_read_by_company on public.messages
for select using (public.can_access_conversation(company_id, conversation_id));

drop policy if exists messages_write_company on public.messages;
create policy messages_write_company on public.messages
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
  or (
    company_id = public.current_profile_company_id()
    and sender_id = auth.uid()
    and public.can_access_conversation(company_id, conversation_id)
  )
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
  or (
    company_id = public.current_profile_company_id()
    and sender_id = auth.uid()
    and public.can_access_conversation(company_id, conversation_id)
  )
);

-- 20260615220000_staff_profile_self_service.sql
alter table public.profiles
  add column if not exists street text,
  add column if not exists house_number text,
  add column if not exists postal_code text,
  add column if not exists city text,
  add column if not exists profile_image_path text,
  add column if not exists notification_settings jsonb not null default '{
    "new_message": true,
    "new_tour": true,
    "shift_change": true,
    "handover_note": true,
    "document_hint": true
  }'::jsonb;

create or replace function public.staff_profile_self_update_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id and public.current_profile_role() in ('mitarbeiter', 'pflegefachkraft') then
    new.company_id := old.company_id;
    new.role := old.role;
    new.email := old.email;
    new.job_title := old.job_title;
    new.qualification := old.qualification;
    new.status := old.status;
    new.invitation_status := old.invitation_status;
    new.invited_at := old.invited_at;
    new.accepted_at := old.accepted_at;
  end if;
  return new;
end;
$$;

drop trigger if exists staff_profile_self_update_guard on public.profiles;
create trigger staff_profile_self_update_guard
before update on public.profiles
for each row execute function public.staff_profile_self_update_guard();

drop policy if exists profiles_update_owner on public.profiles;
create policy profiles_update_owner on public.profiles
for update using (
  public.is_admin()
  or (
    company_id = public.current_profile_company_id()
    and public.current_profile_role() = 'inhaber'
    and role <> 'admin'
  )
  or (
    id = auth.uid()
    and company_id = public.current_profile_company_id()
    and public.current_profile_role() in ('mitarbeiter', 'pflegefachkraft')
  )
) with check (
  public.is_admin()
  or (
    company_id = public.current_profile_company_id()
    and public.current_profile_role() = 'inhaber'
    and role <> 'admin'
  )
  or (
    id = auth.uid()
    and company_id = public.current_profile_company_id()
    and public.current_profile_role() in ('mitarbeiter', 'pflegefachkraft')
  )
);

-- 20260615230000_staff_absences.sql
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

-- 20260615233000_staff_absence_request_fields.sql
alter table public.employee_absences
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists start_time time,
  add column if not exists end_time time,
  add column if not exists is_full_day boolean not null default true,
  add column if not exists note text,
  add column if not exists attachment_id uuid,
  add column if not exists requested_by uuid references public.profiles(id) on delete set null,
  add column if not exists review_note text,
  add column if not exists cancelled_at timestamptz;

update public.employee_absences
set
  absence_type = case absence_type
    when 'vacation' then 'urlaub'
    when 'sick' then 'krankheit'
    when 'training' then 'fortbildung'
    when 'other' then 'sonstiges'
    else absence_type
  end,
  status = case status
    when 'submitted' then 'pending'
    else status
  end,
  user_id = coalesce(user_id, employee_id),
  requested_by = coalesce(requested_by, created_by, employee_id),
  review_note = coalesce(review_note, response_note)
where absence_type in ('vacation', 'sick', 'training', 'other')
  or status = 'submitted'
  or user_id is null
  or requested_by is null
  or review_note is null;

alter table public.employee_absences
  alter column absence_type set default 'urlaub',
  alter column status set default 'pending';

alter table public.employee_absences
  drop constraint if exists employee_absences_type_check,
  drop constraint if exists employee_absences_status_check,
  add constraint employee_absences_type_check check (absence_type in ('urlaub', 'krankheit', 'frei', 'fortbildung', 'sonstiges')),
  add constraint employee_absences_status_check check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  add constraint employee_absences_time_check check (is_full_day or (start_time is not null and end_time is not null));

create index if not exists employee_absences_company_user_idx
  on public.employee_absences(company_id, user_id, start_date);

drop policy if exists employee_absences_read_own on public.employee_absences;
drop policy if exists employee_absences_write_own on public.employee_absences;
drop policy if exists employee_absences_insert_own on public.employee_absences;
drop policy if exists employee_absences_update_own_pending on public.employee_absences;
drop policy if exists employee_absences_manage_company on public.employee_absences;

create policy employee_absences_read_own on public.employee_absences
for select using (
  public.is_admin()
  or (
    company_id = public.current_profile_company_id()
    and (
      public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung')
      or employee_id = auth.uid()
      or user_id = auth.uid()
    )
  )
);

create policy employee_absences_insert_own on public.employee_absences
for insert with check (
  company_id = public.current_profile_company_id()
  and public.current_profile_role() in ('mitarbeiter', 'pflegefachkraft')
  and employee_id = auth.uid()
  and user_id = auth.uid()
  and requested_by = auth.uid()
  and status = 'pending'
);

create policy employee_absences_update_own_pending on public.employee_absences
for update using (
  company_id = public.current_profile_company_id()
  and public.current_profile_role() in ('mitarbeiter', 'pflegefachkraft')
  and employee_id = auth.uid()
  and coalesce(user_id, employee_id) = auth.uid()
  and status = 'pending'
) with check (
  company_id = public.current_profile_company_id()
  and public.current_profile_role() in ('mitarbeiter', 'pflegefachkraft')
  and employee_id = auth.uid()
  and coalesce(user_id, employee_id) = auth.uid()
  and status = 'cancelled'
);

create policy employee_absences_manage_company on public.employee_absences
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
);

-- 20260616110000_onboarding_access_control.sql
alter table public.companies
  add column if not exists onboarding_status text not null default 'in_progress',
  add column if not exists payment_due_until timestamptz;

alter table public.companies drop constraint if exists companies_onboarding_status_check;
alter table public.companies
  add constraint companies_onboarding_status_check check (onboarding_status in ('in_progress','completed'));

create index if not exists companies_onboarding_payment_idx
  on public.companies(onboarding_status, payment_status, payment_due_until);

-- 20260617120000_nuria_internal_admin.sql
alter table public.companies
  add column if not exists confirmed_by uuid references public.profiles(id) on delete set null;

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  name text,
  email text,
  subject text not null,
  message text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_requests_status_check check (status in ('open','in_progress','done'))
);

create table if not exists public.support_replies (
  id uuid primary key default gen_random_uuid(),
  support_request_id uuid not null references public.support_requests(id) on delete cascade,
  admin_user_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  admin_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists support_requests_status_idx on public.support_requests(status, created_at desc);
create index if not exists support_replies_request_idx on public.support_replies(support_request_id, created_at);
create index if not exists admin_logs_created_idx on public.admin_logs(created_at desc);

alter table public.support_requests enable row level security;
alter table public.support_replies enable row level security;
alter table public.admin_logs enable row level security;

drop policy if exists support_requests_admin_all on public.support_requests;
create policy support_requests_admin_all on public.support_requests
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists support_replies_admin_all on public.support_replies;
create policy support_replies_admin_all on public.support_replies
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_logs_admin_read on public.admin_logs;
create policy admin_logs_admin_read on public.admin_logs
for select using (public.is_admin());

drop policy if exists admin_logs_admin_insert on public.admin_logs;
create policy admin_logs_admin_insert on public.admin_logs
for insert with check (public.is_admin());

-- 20260617130000_employee_invitation_tokens.sql
alter table public.profiles
  add column if not exists invited_by uuid references public.profiles(id) on delete set null,
  add column if not exists invitation_token_hash text,
  add column if not exists invitation_expires_at timestamptz,
  add column if not exists invitation_sent_at timestamptz;

create index if not exists profiles_invitation_token_hash_idx
  on public.profiles(invitation_token_hash)
  where invitation_token_hash is not null;
