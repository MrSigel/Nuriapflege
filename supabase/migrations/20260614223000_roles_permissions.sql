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
