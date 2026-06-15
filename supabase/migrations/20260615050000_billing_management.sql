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
