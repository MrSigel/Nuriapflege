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
