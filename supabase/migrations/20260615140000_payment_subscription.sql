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
