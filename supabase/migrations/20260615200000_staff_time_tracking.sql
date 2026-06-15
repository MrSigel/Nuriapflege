alter table public.time_entries
  alter column end_time drop not null;

alter table public.time_entries drop constraint if exists time_entries_status_check;
alter table public.time_entries add constraint time_entries_status_check
  check (status in ('draft', 'running', 'submitted', 'approved', 'rejected', 'corrected'));

alter table public.time_entries drop constraint if exists time_entries_type_check;
alter table public.time_entries add constraint time_entries_type_check
  check (entry_type in ('work_time', 'break', 'client_visit', 'tour_time', 'shift_time', 'manual_correction', 'admin_time', 'other'));

alter table public.time_entries drop constraint if exists time_entries_source_check;
alter table public.time_entries add constraint time_entries_source_check
  check (source in ('manual', 'manual_employee', 'tour_wizard', 'system'));

create unique index if not exists time_entries_one_running_work_entry
  on public.time_entries(company_id, employee_id)
  where status = 'running' and entry_type = 'work_time';

drop policy if exists time_entries_read_by_company on public.time_entries;
create policy time_entries_read_by_company on public.time_entries
for select using (
  public.is_admin()
  or (
    company_id = public.current_profile_company_id()
    and (
      public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung')
      or employee_id = auth.uid()
    )
  )
);

drop policy if exists time_entries_write_owner on public.time_entries;
create policy time_entries_write_owner on public.time_entries
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
  or (
    company_id = public.current_profile_company_id()
    and employee_id = auth.uid()
    and status in ('running', 'submitted')
  )
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
  or (
    company_id = public.current_profile_company_id()
    and employee_id = auth.uid()
    and created_by = auth.uid()
    and status in ('running', 'submitted')
  )
);
