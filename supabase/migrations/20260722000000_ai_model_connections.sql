-- BuildProof BYOK model vault. Stores encrypted provider keys per user.
-- Apply through Supabase SQL editor or `supabase db push`.

create table if not exists public.ai_model_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  provider text not null check (provider in ('openai', 'openrouter', 'nebius', 'custom-openai')),
  provider_label text,
  model text not null check (char_length(trim(model)) between 1 and 200),
  base_url text not null check (char_length(trim(base_url)) between 1 and 500),
  encrypted_api_key text not null,
  key_hint text,
  status text not null default 'tested' check (status in ('tested', 'failed', 'disabled')),
  score numeric(3, 1) check (score is null or (score >= 0 and score <= 10)),
  rating text,
  is_default boolean not null default false,
  last_tested_at timestamptz,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ai_model_connections_user_default_idx
  on public.ai_model_connections (user_id)
  where is_default;

create index if not exists ai_model_connections_user_updated_idx
  on public.ai_model_connections (user_id, updated_at desc);

create index if not exists ai_model_connections_project_idx
  on public.ai_model_connections (project_id);

drop trigger if exists ai_model_connections_set_updated_at on public.ai_model_connections;
create trigger ai_model_connections_set_updated_at before update on public.ai_model_connections
for each row execute procedure public.set_updated_at();

alter table public.ai_model_connections enable row level security;

grant select, insert, update, delete on public.ai_model_connections to authenticated;

drop policy if exists "ai models: users read own" on public.ai_model_connections;
drop policy if exists "ai models: users create own" on public.ai_model_connections;
drop policy if exists "ai models: users update own" on public.ai_model_connections;
drop policy if exists "ai models: users delete own" on public.ai_model_connections;

create policy "ai models: users read own" on public.ai_model_connections
for select to authenticated
using (user_id = auth.uid());

create policy "ai models: users create own" on public.ai_model_connections
for insert to authenticated
with check (
  user_id = auth.uid()
  and (project_id is null or public.is_project_member(project_id))
);

create policy "ai models: users update own" on public.ai_model_connections
for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and (project_id is null or public.is_project_member(project_id))
);

create policy "ai models: users delete own" on public.ai_model_connections
for delete to authenticated
using (user_id = auth.uid());
