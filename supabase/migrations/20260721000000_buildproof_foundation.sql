-- BuildProof multi-tenant foundation. Apply through the Supabase SQL editor or
-- `supabase db push`; this migration contains no credentials or seeded users.

create extension if not exists pgcrypto;

create type public.project_role as enum ('owner', 'admin', 'member', 'viewer');
create type public.audit_run_status as enum ('queued', 'planning', 'running', 'completed', 'failed', 'canceled');
create type public.release_verdict as enum ('ship', 'review', 'hold', 'incomplete');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 120),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, slug)
);

create table public.project_memberships (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.project_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table public.audit_targets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  repository_url text not null,
  repository_ref text not null default 'main',
  staging_url text not null,
  environment text not null default 'staging' check (environment in ('preview', 'staging', 'production')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified', 'pending', 'verified', 'rejected')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  audit_target_id uuid not null references public.audit_targets(id) on delete restrict,
  requested_by uuid not null references auth.users(id) on delete restrict,
  status public.audit_run_status not null default 'queued',
  selected_domains jsonb not null default '[]'::jsonb check (jsonb_typeof(selected_domains) = 'array'),
  product_intent text,
  policy_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(policy_snapshot) = 'object'),
  runner_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(runner_metadata) = 'object'),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  audit_run_id uuid not null references public.audit_runs(id) on delete cascade,
  event_type text not null,
  actor_type text not null default 'system' check (actor_type in ('user', 'system', 'agent', 'runner')),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now()
);

create table public.findings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  audit_run_id uuid not null references public.audit_runs(id) on delete cascade,
  domain text not null check (domain in ('product', 'experience', 'engineering', 'security', 'ai-launch')),
  severity text not null check (severity in ('critical', 'high', 'medium', 'low', 'info')),
  status text not null default 'open' check (status in ('open', 'acknowledged', 'in_progress', 'resolved', 'accepted_risk')),
  title text not null,
  summary text not null,
  recommendation text,
  fingerprint text,
  confidence numeric(3, 2) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.finding_evidence (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  finding_id uuid not null references public.findings(id) on delete cascade,
  evidence_kind text not null check (evidence_kind in ('source', 'request', 'response', 'screenshot', 'trace', 'scanner', 'artifact')),
  artifact_path text,
  summary text not null,
  redacted boolean not null default true,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now()
);

create table public.audit_reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  audit_run_id uuid not null unique references public.audit_runs(id) on delete cascade,
  verdict public.release_verdict not null default 'incomplete',
  overall_score smallint check (overall_score is null or (overall_score >= 0 and overall_score <= 100)),
  report jsonb not null default '{}'::jsonb check (jsonb_typeof(report) = 'object'),
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_owner_id_idx on public.projects(owner_id);
create index project_memberships_user_id_idx on public.project_memberships(user_id);
create index audit_targets_project_id_idx on public.audit_targets(project_id);
create index audit_runs_project_created_idx on public.audit_runs(project_id, created_at desc);
create index audit_events_run_created_idx on public.audit_events(audit_run_id, created_at asc);
create index findings_run_severity_idx on public.findings(audit_run_id, severity, created_at desc);
create index findings_project_status_idx on public.findings(project_id, status, created_at desc);
create index finding_evidence_finding_id_idx on public.finding_evidence(finding_id);
create index audit_reports_project_id_idx on public.audit_reports(project_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects
for each row execute procedure public.set_updated_at();
create trigger audit_targets_set_updated_at before update on public.audit_targets
for each row execute procedure public.set_updated_at();
create trigger audit_runs_set_updated_at before update on public.audit_runs
for each row execute procedure public.set_updated_at();
create trigger findings_set_updated_at before update on public.findings
for each row execute procedure public.set_updated_at();
create trigger audit_reports_set_updated_at before update on public.audit_reports
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.add_project_owner_membership()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.project_memberships (project_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (project_id, user_id) do update set role = 'owner';
  return new;
end;
$$;

create trigger projects_add_owner_membership
after insert on public.projects
for each row execute procedure public.add_project_owner_membership();

create or replace function public.prevent_project_owner_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'Project ownership transfers must use an explicit ownership workflow';
  end if;
  return new;
end;
$$;

create trigger projects_prevent_owner_change
before update on public.projects
for each row execute procedure public.prevent_project_owner_change();

create or replace function public.protect_last_project_owner()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'DELETE' and old.role = 'owner' and not exists (
    select 1 from public.project_memberships
    where project_id = old.project_id and role = 'owner' and user_id <> old.user_id
  ) then
    raise exception 'A project must retain at least one owner';
  end if;

  if tg_op = 'UPDATE' and old.role = 'owner' and new.role <> 'owner' and not exists (
    select 1 from public.project_memberships
    where project_id = old.project_id and role = 'owner' and user_id <> old.user_id
  ) then
    raise exception 'A project must retain at least one owner';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger project_memberships_protect_last_owner
before update or delete on public.project_memberships
for each row execute procedure public.protect_last_project_owner();

-- Security-definer helpers keep RLS policies short and avoid recursive policy checks.
create or replace function public.is_project_member(target_project_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.project_memberships
    where project_id = target_project_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_project_admin(target_project_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.project_memberships
    where project_id = target_project_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

revoke all on function public.is_project_member(uuid) from public;
revoke all on function public.is_project_admin(uuid) from public;
grant execute on function public.is_project_member(uuid) to authenticated;
grant execute on function public.is_project_admin(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_memberships enable row level security;
alter table public.audit_targets enable row level security;
alter table public.audit_runs enable row level security;
alter table public.audit_events enable row level security;
alter table public.findings enable row level security;
alter table public.finding_evidence enable row level security;
alter table public.audit_reports enable row level security;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.project_memberships to authenticated;
grant select, insert, update, delete on public.audit_targets to authenticated;
grant select, insert on public.audit_runs to authenticated;
grant select on public.audit_events to authenticated;
grant select on public.findings to authenticated;
grant select on public.finding_evidence to authenticated;
grant select on public.audit_reports to authenticated;

create policy "profiles: read own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles: insert own" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles: update own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "projects: members can read" on public.projects for select to authenticated using (public.is_project_member(id));
create policy "projects: users can create owned" on public.projects for insert to authenticated with check (owner_id = auth.uid());
create policy "projects: admins can update" on public.projects for update to authenticated using (public.is_project_admin(id)) with check (public.is_project_admin(id));
create policy "projects: admins can delete" on public.projects for delete to authenticated using (public.is_project_admin(id));

create policy "memberships: members can read" on public.project_memberships for select to authenticated using (public.is_project_member(project_id));
create policy "memberships: admins can add" on public.project_memberships for insert to authenticated with check (public.is_project_admin(project_id));
create policy "memberships: admins can change" on public.project_memberships for update to authenticated using (public.is_project_admin(project_id)) with check (public.is_project_admin(project_id));
create policy "memberships: admins can remove" on public.project_memberships for delete to authenticated using (public.is_project_admin(project_id));

create policy "targets: members can read" on public.audit_targets for select to authenticated using (public.is_project_member(project_id));
create policy "targets: members can create" on public.audit_targets for insert to authenticated with check (public.is_project_member(project_id) and created_by = auth.uid());
create policy "targets: admins can update" on public.audit_targets for update to authenticated using (public.is_project_admin(project_id)) with check (public.is_project_admin(project_id));
create policy "targets: admins can delete" on public.audit_targets for delete to authenticated using (public.is_project_admin(project_id));

create policy "runs: members can read" on public.audit_runs for select to authenticated using (public.is_project_member(project_id));
create policy "runs: members can create" on public.audit_runs for insert to authenticated with check (
  public.is_project_member(project_id)
  and requested_by = auth.uid()
  and exists (
    select 1 from public.audit_targets
    where id = audit_target_id and project_id = audit_runs.project_id
  )
);

create policy "events: members can read" on public.audit_events for select to authenticated using (public.is_project_member(project_id));
create policy "findings: members can read" on public.findings for select to authenticated using (public.is_project_member(project_id));
create policy "evidence: members can read" on public.finding_evidence for select to authenticated using (public.is_project_member(project_id));
create policy "reports: members can read" on public.audit_reports for select to authenticated using (public.is_project_member(project_id));
