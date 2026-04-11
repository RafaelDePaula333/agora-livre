-- supabase/schema.sql
-- Agora Livre — PostgreSQL Schema
-- Run this in your Supabase SQL editor

-- ─── Extensions ──────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Users (extends Supabase auth.users) ─────────────────────────────
create table public.profiles (
  id                  uuid references auth.users(id) on delete cascade primary key,
  name                text,
  addiction_type      text not null check (addiction_type in ('alcohol','drugs')),
  trigger_times       text[] not null default '{}',
  trigger_causes      text[] not null default '{}',
  coping_strategies   text[] not null default '{}',
  sober_since         date not null default current_date,
  daily_cost          numeric default 0,
  daily_time_waste    integer default 0,
  lang                text not null default 'pt'
                        check (lang in ('pt','en','es','nl','ro')),
  is_premium          boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── Check-ins ────────────────────────────────────────────────────────
create table public.checkins (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references public.profiles(id) on delete cascade not null,
  date            date not null default current_date,
  mood            text not null check (mood in ('good','neutral','bad')),
  emotions        text[] not null default '{}',
  urge_intensity  smallint not null check (urge_intensity between 0 and 10),
  time_investment text,
  notes           text,
  created_at      timestamptz not null default now(),
  unique (user_id, date)     -- one check-in per day
);

-- ─── Crisis Sessions ──────────────────────────────────────────────────
create table public.crisis_sessions (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references public.profiles(id) on delete cascade not null,
  started_at        timestamptz not null default now(),
  ended_at          timestamptz,
  trigger_emotions  text[] not null default '{}',
  intensity         smallint not null check (intensity between 0 and 10),
  actions_used      text[] not null default '{}',
  urge_decreased    boolean,
  timer_completed   boolean not null default false
);

-- ─── Relapses ─────────────────────────────────────────────────────────
create table public.relapses (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  occurred_at timestamptz not null default now(),
  location    text not null check (location in ('home','work','social','other')),
  emotion     text not null,
  intensity   smallint not null check (intensity between 0 and 10),
  notes       text,
  created_at  timestamptz not null default now()
);

-- ─── Subscriptions ────────────────────────────────────────────────────
create table public.subscriptions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references public.profiles(id) on delete cascade not null unique,
  plan            text not null check (plan in ('monthly','annual')),
  status          text not null check (status in ('active','cancelled','expired'))
                    default 'active',
  started_at      timestamptz not null default now(),
  expires_at      timestamptz not null,
  play_store_sku  text not null,
  purchase_token  text not null,
  updated_at      timestamptz not null default now()
);

-- ─── Row Level Security ───────────────────────────────────────────────
alter table public.profiles         enable row level security;
alter table public.checkins         enable row level security;
alter table public.crisis_sessions  enable row level security;
alter table public.relapses         enable row level security;
alter table public.subscriptions    enable row level security;

-- Users can only access their own data
create policy "own profile"        on public.profiles        for all using (auth.uid() = id);
create policy "own checkins"       on public.checkins        for all using (auth.uid() = user_id);
create policy "own crises"         on public.crisis_sessions for all using (auth.uid() = user_id);
create policy "own relapses"       on public.relapses        for all using (auth.uid() = user_id);
create policy "own subscriptions"  on public.subscriptions   for all using (auth.uid() = user_id);

-- ─── Indexes ──────────────────────────────────────────────────────────
create index on public.checkins        (user_id, date desc);
create index on public.crisis_sessions (user_id, started_at desc);
create index on public.relapses        (user_id, occurred_at desc);

-- ─── Auto-update updated_at ───────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.handle_updated_at();

-- ─── Auto-create profile on signup ───────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, addiction_type, sober_since)
  values (new.id, 'alcohol', current_date);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
