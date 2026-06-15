alter table public.care_documentation drop constraint if exists care_documentation_category_check;
alter table public.care_documentation add constraint care_documentation_category_check
  check (category in ('pflegebericht', 'uebergabe', 'beobachtung', 'hinweis', 'massnahme', 'vitalwerte', 'wunde', 'medikation', 'ereignis', 'sonstiges'));

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
      or (
        visibility = 'care_team'
        and public.can_read_client_for_current_user(company_id, client_id)
      )
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
