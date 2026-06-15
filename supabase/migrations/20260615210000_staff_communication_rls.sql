alter table public.conversations drop constraint if exists conversations_type_check;
alter table public.conversations add constraint conversations_type_check
  check (conversation_type in ('direct','group','team','announcement','support','handover','tour','client_related'));

alter table public.messages drop constraint if exists messages_type_check;
alter table public.messages add constraint messages_type_check
  check (message_type in ('text','image','file','system'));

create or replace function public.can_access_conversation(record_company_id uuid, record_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or (
      record_company_id = public.current_profile_company_id()
      and (
        public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung')
        or exists (
          select 1
          from public.conversation_participants
          where conversation_participants.company_id = record_company_id
            and conversation_participants.conversation_id = record_conversation_id
            and conversation_participants.user_id = auth.uid()
        )
      )
    )
$$;

drop policy if exists conversations_read_by_company on public.conversations;
create policy conversations_read_by_company on public.conversations
for select using (public.can_access_conversation(company_id, id));

drop policy if exists conversations_write_owner on public.conversations;
create policy conversations_write_owner on public.conversations
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
  or public.can_access_conversation(company_id, id)
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
  or company_id = public.current_profile_company_id()
);

drop policy if exists conversation_participants_read_by_company on public.conversation_participants;
create policy conversation_participants_read_by_company on public.conversation_participants
for select using (public.can_access_conversation(company_id, conversation_id));

drop policy if exists conversation_participants_write_owner on public.conversation_participants;
create policy conversation_participants_write_owner on public.conversation_participants
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
  or (company_id = public.current_profile_company_id() and user_id = auth.uid())
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
  or (company_id = public.current_profile_company_id() and user_id = auth.uid())
);

drop policy if exists messages_read_by_company on public.messages;
create policy messages_read_by_company on public.messages
for select using (public.can_access_conversation(company_id, conversation_id));

drop policy if exists messages_write_company on public.messages;
create policy messages_write_company on public.messages
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
  or (
    company_id = public.current_profile_company_id()
    and sender_id = auth.uid()
    and public.can_access_conversation(company_id, conversation_id)
  )
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
  or (
    company_id = public.current_profile_company_id()
    and sender_id = auth.uid()
    and public.can_access_conversation(company_id, conversation_id)
  )
);
