alter table public.companies
  add column if not exists onboarding_status text not null default 'in_progress',
  add column if not exists payment_due_until timestamptz;

alter table public.companies drop constraint if exists companies_onboarding_status_check;
alter table public.companies
  add constraint companies_onboarding_status_check check (onboarding_status in ('in_progress','completed'));

create index if not exists companies_onboarding_payment_idx
  on public.companies(onboarding_status, payment_status, payment_due_until);
