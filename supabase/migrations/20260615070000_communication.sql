alter table public.conversations
  add column if not exists conversation_type text not null default 'group',
  add column if not exists status text not null default 'active',
  add column if not exists last_message_at timestamptz,
  add column if not exists archived_at timestamptz;

update public.conversations set conversation_type = type where conversation_type is null and type is not null;

alter table public.conversations drop constraint if exists conversations_type_check;
alter table public.conversations add constraint conversations_type_check check (conversation_type in ('direct','group','announcement','support'));
alter table public.conversations drop constraint if exists conversations_status_check;
alter table public.conversations add constraint conversations_status_check check (status in ('active','archived'));

create table if not exists public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  is_muted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (conversation_id, user_id)
);

alter table public.messages
  add column if not exists message_type text not null default 'text',
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz;

alter table public.messages drop constraint if exists messages_type_check;
alter table public.messages add constraint messages_type_check check (message_type in ('text','system'));

create table if not exists public.message_read_receipts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (message_id, user_id)
);

create table if not exists public.conversation_audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  changed_by uuid references public.profiles(id) on delete set null,
  action text not null,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

create index if not exists conversations_company_last_idx on public.conversations(company_id, last_message_at);
create index if not exists conversation_participants_company_conversation_idx on public.conversation_participants(company_id, conversation_id);
create index if not exists messages_company_conversation_idx on public.messages(company_id, conversation_id, created_at);

alter table public.conversation_participants enable row level security;
alter table public.message_read_receipts enable row level security;
alter table public.conversation_audit_logs enable row level security;

drop policy if exists conversations_write_owner on public.conversations;
create policy conversations_write_owner on public.conversations for all using (public.is_admin() or company_id = public.current_profile_company_id()) with check (public.is_admin() or company_id = public.current_profile_company_id());
drop policy if exists messages_write_company on public.messages;
create policy messages_write_company on public.messages for all using (public.is_admin() or company_id = public.current_profile_company_id()) with check (public.is_admin() or company_id = public.current_profile_company_id());
drop policy if exists conversation_participants_read_by_company on public.conversation_participants;
create policy conversation_participants_read_by_company on public.conversation_participants for select using (public.is_same_company(company_id));
drop policy if exists conversation_participants_write_owner on public.conversation_participants;
create policy conversation_participants_write_owner on public.conversation_participants for all using (public.is_admin() or company_id = public.current_profile_company_id()) with check (public.is_admin() or company_id = public.current_profile_company_id());
drop policy if exists message_read_receipts_read_by_company on public.message_read_receipts;
create policy message_read_receipts_read_by_company on public.message_read_receipts for select using (public.is_same_company(company_id));
drop policy if exists message_read_receipts_write_company on public.message_read_receipts;
create policy message_read_receipts_write_company on public.message_read_receipts for all using (public.is_admin() or company_id = public.current_profile_company_id()) with check (public.is_admin() or company_id = public.current_profile_company_id());
drop policy if exists conversation_audit_logs_read_by_company on public.conversation_audit_logs;
create policy conversation_audit_logs_read_by_company on public.conversation_audit_logs for select using (public.is_same_company(company_id));
drop policy if exists conversation_audit_logs_write_company on public.conversation_audit_logs;
create policy conversation_audit_logs_write_company on public.conversation_audit_logs for all using (public.is_admin() or company_id = public.current_profile_company_id()) with check (public.is_admin() or company_id = public.current_profile_company_id());
