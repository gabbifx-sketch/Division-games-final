-- DIVISION database foundation for Supabase
-- Review this file, then run it in Supabase SQL Editor.
-- Never put the Supabase service_role key in browser code.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  bio text not null default '',
  role text not null default 'player' check (role in ('player','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text not null default '',
  icon text not null default '🎮',
  created_at timestamptz not null default now()
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  instructions text not null default '',
  cover_image text,
  game_url text,
  category_id uuid references public.categories(id) on delete set null,
  developer_name text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  is_featured boolean not null default false,
  is_popular boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1200),
  status text not null default 'visible' check (status in ('visible','hidden')),
  created_at timestamptz not null default now()
);

create table if not exists public.favourites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

create table if not exists public.game_likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.game_plays (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  played_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid references public.games(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reason text not null,
  details text not null default '',
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now(),
  check (game_id is not null or comment_id is not null)
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null default 'General question',
  message text not null,
  created_at timestamptz not null default now()
);

create or replace function public.is_division_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- New sign-ups receive a player profile. The user cannot choose an admin role.
create or replace function public.handle_new_division_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'username',''),
    coalesce(nullif(new.raw_user_meta_data->>'display_name',''), split_part(new.email,'@',1))
  );
  return new;
end;
$$;

drop trigger if exists on_division_auth_user_created on auth.users;
create trigger on_division_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_division_user();

-- Prevent normal users from promoting themselves by editing their profile.
create or replace function public.protect_division_profile_role()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_division_admin() then
    raise exception 'Only an existing administrator can change account roles';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_division_profile_role_trigger on public.profiles;
create trigger protect_division_profile_role_trigger
before update on public.profiles
for each row execute procedure public.protect_division_profile_role();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.games enable row level security;
alter table public.comments enable row level security;
alter table public.favourites enable row level security;
alter table public.game_likes enable row level security;
alter table public.follows enable row level security;
alter table public.game_plays enable row level security;
alter table public.reports enable row level security;
alter table public.contact_messages enable row level security;

-- Profiles: public player cards, private self-editing.
create policy "Profiles are viewable" on public.profiles for select using (true);
create policy "Users update their own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Admins manage profiles" on public.profiles for all using (public.is_division_admin()) with check (public.is_division_admin());

-- Categories and published games are public; admins manage the catalogue.
create policy "Categories are public" on public.categories for select using (true);
create policy "Admins manage categories" on public.categories for all using (public.is_division_admin()) with check (public.is_division_admin());
create policy "Published games are public" on public.games for select using (status = 'published' or public.is_division_admin());
create policy "Admins manage games" on public.games for all using (public.is_division_admin()) with check (public.is_division_admin());

-- Community content.
create policy "Visible comments are public" on public.comments for select using (status = 'visible' or public.is_division_admin());
create policy "Signed-in users create comments" on public.comments for insert to authenticated with check (auth.uid() = user_id);
create policy "Users edit own comments" on public.comments for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Admins moderate comments" on public.comments for all using (public.is_division_admin()) with check (public.is_division_admin());

create policy "Users read own favourites" on public.favourites for select to authenticated using (auth.uid() = user_id);
create policy "Users manage own favourites" on public.favourites for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users read own likes" on public.game_likes for select to authenticated using (auth.uid() = user_id);
create policy "Users manage own likes" on public.game_likes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Follows are public" on public.follows for select using (true);
create policy "Users manage own follows" on public.follows for all to authenticated using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

create policy "Signed-in users record plays" on public.game_plays for insert to authenticated with check (auth.uid() = user_id);
create policy "Users read own plays" on public.game_plays for select to authenticated using (auth.uid() = user_id or public.is_division_admin());

create policy "Users create reports" on public.reports for insert to authenticated with check (auth.uid() = reporter_id);
create policy "Users read own reports" on public.reports for select to authenticated using (auth.uid() = reporter_id or public.is_division_admin());
create policy "Admins manage reports" on public.reports for all using (public.is_division_admin()) with check (public.is_division_admin());

-- Contact form may accept anonymous submissions; only admins can read them.
create policy "Anyone can send contact message" on public.contact_messages for insert with check (
  char_length(name) between 1 and 100 and
  char_length(email) between 3 and 254 and
  char_length(message) between 1 and 5000
);
create policy "Admins read contact messages" on public.contact_messages for select using (public.is_division_admin());

-- Starter categories. Safe to run more than once.
insert into public.categories (name, slug, description, icon) values
 ('Racing','racing','Fast-paced driving games','🏎'),
 ('Action','action','Quick reflex challenges','⚔'),
 ('Puzzle','puzzle','Put your brain to work','🧩'),
 ('Sports','sports','Compete and score','🏆'),
 ('Adventure','adventure','Explore new worlds','🗺'),
 ('Arcade','arcade','Classic pick-up-and-play','👾'),
 ('Strategy','strategy','Plan your next move','🎯'),
 ('Simulation','simulation','Try something different','🎮')
on conflict (slug) do nothing;
