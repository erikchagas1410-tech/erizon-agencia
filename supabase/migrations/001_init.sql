create extension if not exists "pgcrypto";

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  voice_tone text not null,
  personality text not null,
  core_values text not null,
  main_objective text not null,
  post_sign_off text not null,
  value_proposition text not null,
  content_style text not null,
  visual_aesthetic text not null,
  reason_to_exist text not null,
  content_pillars text[] not null default '{}'::text[],
  brand_character text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  request text not null,
  results jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists clients_user_id_idx on public.clients(user_id);
create index if not exists campaigns_user_id_idx on public.campaigns(user_id);
create index if not exists campaigns_client_id_idx on public.campaigns(client_id);
create index if not exists campaigns_created_at_idx on public.campaigns(created_at desc);

alter table public.clients enable row level security;
alter table public.campaigns enable row level security;

grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.campaigns to authenticated;

drop policy if exists "Users can view their own clients" on public.clients;
create policy "Users can view their own clients"
on public.clients
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their own clients" on public.clients;
create policy "Users can create their own clients"
on public.clients
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own clients" on public.clients;
create policy "Users can update their own clients"
on public.clients
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own clients" on public.clients;
create policy "Users can delete their own clients"
on public.clients
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view their own campaigns" on public.campaigns;
create policy "Users can view their own campaigns"
on public.campaigns
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their own campaigns" on public.campaigns;
create policy "Users can create their own campaigns"
on public.campaigns
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.clients
    where clients.id = client_id
      and clients.user_id = auth.uid()
  )
);

drop policy if exists "Users can update their own campaigns" on public.campaigns;
create policy "Users can update their own campaigns"
on public.campaigns
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own campaigns" on public.campaigns;
create policy "Users can delete their own campaigns"
on public.campaigns
for delete
to authenticated
using (auth.uid() = user_id);
