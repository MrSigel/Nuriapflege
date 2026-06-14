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
