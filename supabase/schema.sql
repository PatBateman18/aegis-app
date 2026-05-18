-- ══════════════════════════════════════════
-- AEGIS — Supabase Schema
-- Colle ce SQL dans ton Supabase SQL Editor
-- ══════════════════════════════════════════

-- Profiles (étend auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  avatar_url text,
  cal_target integer default 2300,
  prot_target integer default 180,
  notif_morning boolean default false,
  notif_evening boolean default false,
  created_at timestamptz default now()
);

-- Données quotidiennes
create table public.daily_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  -- Nutrition
  calories integer,
  protein integer,
  weight numeric(5,2),
  cardio_min integer,
  -- Habitudes
  workout_done boolean default false,
  workout_type text,
  calories_ok boolean default false,
  learning_done boolean default false,
  morning_water boolean default false,
  outfit_ok boolean default false,
  -- Skincare
  m_face boolean default false,
  m_hydra boolean default false,
  m_skin boolean default false,
  e_face boolean default false,
  e_hydra boolean default false,
  e_skin boolean default false,
  -- Journal
  focus text,
  journal text,
  daily_goal text,
  -- Style
  style_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

-- Objectifs long terme
create table public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  vision text,
  physical_goal text,
  mental_goal text,
  style_goal text,
  timeline text,
  rules text,
  last_haircut date,
  updated_at timestamptz default now()
);

-- RLS (Row Level Security) — chaque user voit seulement ses données
alter table public.profiles enable row level security;
alter table public.daily_logs enable row level security;
alter table public.goals enable row level security;

create policy "Users see own profile" on public.profiles
  for all using (auth.uid() = id);

create policy "Users see own logs" on public.daily_logs
  for all using (auth.uid() = user_id);

create policy "Users see own goals" on public.goals
  for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'name');
  insert into public.goals (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Index pour les perf
create index daily_logs_user_date on public.daily_logs(user_id, date desc);

-- ══════════════════════════════════════════
-- Migration: Notifications push (2026-05-08)
-- ══════════════════════════════════════════
alter table public.profiles
  add column if not exists onboarding_done     boolean default false,
  add column if not exists notif_morning_hour   smallint default 7,
  add column if not exists notif_morning_minute smallint default 30,
  add column if not exists notif_evening_hour   smallint default 21,
  add column if not exists notif_evening_minute smallint default 0,
  add column if not exists push_token          text;
