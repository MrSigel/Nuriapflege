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
