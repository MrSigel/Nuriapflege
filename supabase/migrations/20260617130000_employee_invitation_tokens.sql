alter table public.profiles
  add column if not exists invited_by uuid references public.profiles(id) on delete set null,
  add column if not exists invitation_token_hash text,
  add column if not exists invitation_expires_at timestamptz,
  add column if not exists invitation_sent_at timestamptz;

create index if not exists profiles_invitation_token_hash_idx
  on public.profiles(invitation_token_hash)
  where invitation_token_hash is not null;
