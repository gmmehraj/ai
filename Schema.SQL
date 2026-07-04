-- ============================================
-- AXIOM — Supabase schema
-- Run this once in your Supabase project:
-- Dashboard → SQL Editor → New query → paste all → Run
-- ============================================

-- ---- Profiles ----
-- One row per user, auto-created on signup via the trigger below.
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free','pro','max')),
  credits integer not null default 500,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ---- Auto-create a profile row whenever someone signs up ----
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---- Generations ----
-- One row per playground generation (chat/image/video/voice/code),
-- used to populate "Recent generations" on the dashboard.
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  tool text not null check (tool in ('chat','image','video','voice','code')),
  prompt text,
  thumbnail_gradient text,
  created_at timestamptz not null default now()
);

alter table public.generations enable row level security;

create policy "Users can view their own generations"
  on public.generations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own generations"
  on public.generations for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own generations"
  on public.generations for delete
  using (auth.uid() = user_id);

create index if not exists generations_user_id_created_at_idx
  on public.generations (user_id, created_at desc);