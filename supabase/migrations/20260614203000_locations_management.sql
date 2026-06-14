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
