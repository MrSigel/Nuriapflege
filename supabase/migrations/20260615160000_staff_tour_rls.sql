alter table public.time_entries
  drop constraint if exists time_entries_tour_stop_employee_unique;

create unique index if not exists time_entries_tour_stop_employee_unique
  on public.time_entries(company_id, employee_id, tour_stop_id)
  where tour_stop_id is not null;

create or replace function public.can_read_tour_record(record_company_id uuid, record_tour_id uuid, record_employee_id uuid)
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
        public.current_profile_role() in ('inhaber', 'pdl')
        or record_employee_id = auth.uid()
      )
    )
$$;

create or replace function public.can_read_tour_stop_record(record_company_id uuid, record_tour_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.tours
      where tours.id = record_tour_id
        and public.can_read_tour_record(tours.company_id, tours.id, tours.employee_id)
    )
$$;

drop policy if exists tours_read_by_role on public.tours;
create policy tours_read_by_role on public.tours
for select using (public.can_read_tour_record(company_id, id, employee_id));

drop policy if exists tours_write_owner on public.tours;
create policy tours_write_owner on public.tours
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
  or (company_id = public.current_profile_company_id() and employee_id = auth.uid())
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
  or (company_id = public.current_profile_company_id() and employee_id = auth.uid())
);

drop policy if exists tour_stops_read_by_company on public.tour_stops;
create policy tour_stops_read_by_company on public.tour_stops
for select using (public.can_read_tour_stop_record(company_id, tour_id));

drop policy if exists tour_stops_write_owner on public.tour_stops;
create policy tour_stops_write_owner on public.tour_stops
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
  or public.can_read_tour_stop_record(company_id, tour_id)
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
  or public.can_read_tour_stop_record(company_id, tour_id)
);

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
  or (company_id = public.current_profile_company_id() and employee_id = auth.uid())
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung'))
  or (company_id = public.current_profile_company_id() and employee_id = auth.uid())
);

drop policy if exists care_documentation_read_by_company on public.care_documentation;
create policy care_documentation_read_by_company on public.care_documentation
for select using (
  public.is_admin()
  or (
    company_id = public.current_profile_company_id()
    and (
      public.current_profile_role() in ('inhaber', 'pdl')
      or employee_id = auth.uid()
      or created_by = auth.uid()
    )
  )
);

drop policy if exists care_documentation_write_owner on public.care_documentation;
create policy care_documentation_write_owner on public.care_documentation
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
  or (company_id = public.current_profile_company_id() and (employee_id = auth.uid() or created_by = auth.uid()))
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber', 'pdl'))
  or (
    company_id = public.current_profile_company_id()
    and employee_id = auth.uid()
    and created_by = auth.uid()
    and public.can_read_client_for_current_user(company_id, client_id)
  )
);
