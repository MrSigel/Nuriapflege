alter table public.documents drop constraint if exists documents_category_check;
alter table public.documents add constraint documents_category_check
  check (category in ('verordnung','arztbrief','pflegeunterlage','foto','vertrag','pflegeakte','abrechnung','qualifikation','nachweis','bild','sonstiges'));

drop policy if exists documents_read_by_role on public.documents;
create policy documents_read_by_role on public.documents
for select using (
  public.is_admin()
  or (
    company_id = public.current_profile_company_id()
    and (
      public.current_profile_role() in ('inhaber', 'pdl', 'verwaltung')
      or uploaded_by = auth.uid()
      or employee_id = auth.uid()
      or (
        visibility = 'care_team'
        and client_id is not null
        and public.can_read_client_for_current_user(company_id, client_id)
      )
    )
  )
);

drop policy if exists documents_write_owner on public.documents;
create policy documents_write_owner on public.documents
for all using (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber','pdl','verwaltung'))
  or (
    company_id = public.current_profile_company_id()
    and uploaded_by = auth.uid()
    and employee_id = auth.uid()
  )
) with check (
  public.is_admin()
  or (company_id = public.current_profile_company_id() and public.current_profile_role() in ('inhaber','pdl','verwaltung'))
  or (
    company_id = public.current_profile_company_id()
    and uploaded_by = auth.uid()
    and employee_id = auth.uid()
    and client_id is not null
    and public.can_read_client_for_current_user(company_id, client_id)
  )
);

drop policy if exists company_documents_staff_insert on storage.objects;
create policy company_documents_staff_insert on storage.objects
for insert with check (
  bucket_id = 'company-documents'
  and auth.uid() is not null
  and split_part(name, '/', 1)::uuid = public.current_profile_company_id()
  and public.can_read_client_for_current_user(split_part(name, '/', 1)::uuid, split_part(name, '/', 2)::uuid)
);

drop policy if exists company_documents_staff_read on storage.objects;
create policy company_documents_staff_read on storage.objects
for select using (
  bucket_id = 'company-documents'
  and auth.uid() is not null
  and split_part(name, '/', 1)::uuid = public.current_profile_company_id()
  and exists (
    select 1
    from public.documents
    where documents.storage_bucket = storage.objects.bucket_id
      and documents.file_path = storage.objects.name
      and documents.deleted_at is null
      and documents.status <> 'deleted'
      and (
        public.current_profile_role() in ('inhaber','pdl','verwaltung')
        or documents.uploaded_by = auth.uid()
        or documents.employee_id = auth.uid()
        or (
          documents.visibility = 'care_team'
          and documents.client_id is not null
          and public.can_read_client_for_current_user(documents.company_id, documents.client_id)
        )
      )
  )
);
