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
