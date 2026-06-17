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
