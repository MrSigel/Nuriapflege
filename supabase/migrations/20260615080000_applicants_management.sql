alter table public.applicants
  add column if not exists location_id uuid references public.company_locations(id) on delete set null,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists desired_position text not null default 'sonstiges',
  add column if not exists qualification text,
  add column if not exists availability text,
  add column if not exists source text not null default 'manual',
  add column if not exists rating text not null default 'none',
  add column if not exists notes text,
  add column if not exists last_contact_at timestamptz,
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_by uuid references public.profiles(id) on delete set null,
  add column if not exists archived_at timestamptz;

update public.applicants set status = 'new' where status = 'open';
update public.applicants set first_name = 'Unbekannt' where first_name is null;
update public.applicants set last_name = 'Unbekannt' where last_name is null;
alter table public.applicants alter column status set default 'new';
alter table public.applicants alter column first_name set not null;
alter table public.applicants alter column last_name set not null;

alter table public.applicants
  drop constraint if exists applicants_status_check,
  add constraint applicants_status_check check (status in ('new','contacted','interview_planned','interview_done','offer_sent','hired','rejected','archived'));

alter table public.applicants
  drop constraint if exists applicants_rating_check,
  add constraint applicants_rating_check check (rating in ('none','interesting','strong','not_suitable'));

alter table public.applicants
  drop constraint if exists applicants_source_check,
  add constraint applicants_source_check check (source in ('manual','website','facebook','instagram','recommendation','job_portal','phone','email','other'));

alter table public.applicants
  drop constraint if exists applicants_desired_position_check,
  add constraint applicants_desired_position_check check (desired_position in ('pflegefachkraft','pflegehelfer','hauswirtschaft','betreuungskraft','verwaltung','pdl','azubi','quereinsteiger','sonstiges'));

create index if not exists applicants_company_followup_idx on public.applicants(company_id, next_follow_up_at);
create index if not exists applicants_company_location_idx on public.applicants(company_id, location_id);
create index if not exists applicants_company_archived_idx on public.applicants(company_id, archived_at);

drop policy if exists applicants_insert_by_company on public.applicants;
create policy applicants_insert_by_company on public.applicants
for insert with check (
  public.is_same_company(company_id)
  and public.current_profile_role() in ('admin', 'inhaber', 'pdl', 'verwaltung')
);

drop policy if exists applicants_update_by_company on public.applicants;
create policy applicants_update_by_company on public.applicants
for update using (
  public.is_same_company(company_id)
  and public.current_profile_role() in ('admin', 'inhaber', 'pdl', 'verwaltung')
)
with check (
  public.is_same_company(company_id)
  and public.current_profile_role() in ('admin', 'inhaber', 'pdl', 'verwaltung')
);
