alter table public.profiles
  add column if not exists street text,
  add column if not exists house_number text,
  add column if not exists postal_code text,
  add column if not exists city text,
  add column if not exists profile_image_path text,
  add column if not exists notification_settings jsonb not null default '{
    "new_message": true,
    "new_tour": true,
    "shift_change": true,
    "handover_note": true,
    "document_hint": true
  }'::jsonb;

create or replace function public.staff_profile_self_update_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id and public.current_profile_role() in ('mitarbeiter', 'pflegefachkraft') then
    new.company_id := old.company_id;
    new.role := old.role;
    new.email := old.email;
    new.job_title := old.job_title;
    new.qualification := old.qualification;
    new.status := old.status;
    new.invitation_status := old.invitation_status;
    new.invited_at := old.invited_at;
    new.accepted_at := old.accepted_at;
  end if;
  return new;
end;
$$;

drop trigger if exists staff_profile_self_update_guard on public.profiles;
create trigger staff_profile_self_update_guard
before update on public.profiles
for each row execute function public.staff_profile_self_update_guard();

drop policy if exists profiles_update_owner on public.profiles;
create policy profiles_update_owner on public.profiles
for update using (
  public.is_admin()
  or (
    company_id = public.current_profile_company_id()
    and public.current_profile_role() = 'inhaber'
    and role <> 'admin'
  )
  or (
    id = auth.uid()
    and company_id = public.current_profile_company_id()
    and public.current_profile_role() in ('mitarbeiter', 'pflegefachkraft')
  )
) with check (
  public.is_admin()
  or (
    company_id = public.current_profile_company_id()
    and public.current_profile_role() = 'inhaber'
    and role <> 'admin'
  )
  or (
    id = auth.uid()
    and company_id = public.current_profile_company_id()
    and public.current_profile_role() in ('mitarbeiter', 'pflegefachkraft')
  )
);
