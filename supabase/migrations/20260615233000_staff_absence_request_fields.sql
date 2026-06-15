alter table public.employee_absences
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists start_time time,
  add column if not exists end_time time,
  add column if not exists is_full_day boolean not null default true,
  add column if not exists note text,
  add column if not exists attachment_id uuid,
  add column if not exists requested_by uuid references public.profiles(id) on delete set null,
  add column if not exists review_note text,
  add column if not exists cancelled_at timestamptz;

update public.employee_absences
set
  absence_type = case absence_type
    when 'vacation' then 'urlaub'
    when 'sick' then 'krankheit'
    when 'training' then 'fortbildung'
    when 'other' then 'sonstiges'
    else absence_type
  end,
  status = case status
    when 'submitted' then 'pending'
    else status
  end,
  user_id = coalesce(user_id, employee_id),
  requested_by = coalesce(requested_by, created_by, employee_id),
  review_note = coalesce(review_note, response_note)
where absence_type in ('vacation', 'sick', 'training', 'other')
  or status = 'submitted'
  or user_id is null
  or requested_by is null
  or review_note is null;

alter table public.employee_absences
  alter column absence_type set default 'urlaub',
  alter column status set default 'pending';

alter table public.employee_absences
  drop constraint if exists employee_absences_type_check,
  drop constraint if exists employee_absences_status_check,
  add constraint employee_absences_type_check check (absence_type in ('urlaub', 'krankheit', 'frei', 'fortbildung', 'sonstiges')),
  add constraint employee_absences_status_check check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  add constraint employee_absences_time_check check (is_full_day or (start_time is not null and end_time is not null));

create index if not exists employee_absences_company_user_idx
  on public.employee_absences(company_id, user_id, start_date);

drop policy if exists employee_absences_read_own on public.employee_absences;
drop policy if exists employee_absences_write_own on public.employee_absences;
drop policy if exists employee_absences_insert_own on public.employee_absences;
drop policy if exists employee_absences_update_own_pending on public.employee_absences;
drop policy if exists employee_absences_manage_company on public.employee_absences;

create policy employee_absences_read_own on public.employee_absences
for select using (
  public.is_admin()
  or (
    company_id = public.current_profile_company_id()
    and (
      public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung')
      or employee_id = auth.uid()
      or user_id = auth.uid()
    )
  )
);

create policy employee_absences_insert_own on public.employee_absences
for insert with check (
  company_id = public.current_profile_company_id()
  and public.current_profile_role() in ('mitarbeiter', 'pflegefachkraft')
  and employee_id = auth.uid()
  and user_id = auth.uid()
  and requested_by = auth.uid()
  and status = 'pending'
);

create policy employee_absences_update_own_pending on public.employee_absences
for update using (
  company_id = public.current_profile_company_id()
  and public.current_profile_role() in ('mitarbeiter', 'pflegefachkraft')
  and employee_id = auth.uid()
  and coalesce(user_id, employee_id) = auth.uid()
  and status = 'pending'
) with check (
  company_id = public.current_profile_company_id()
  and public.current_profile_role() in ('mitarbeiter', 'pflegefachkraft')
  and employee_id = auth.uid()
  and coalesce(user_id, employee_id) = auth.uid()
  and status = 'cancelled'
);

create policy employee_absences_manage_company on public.employee_absences
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
);
