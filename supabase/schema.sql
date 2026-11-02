
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null, college text not null, department text not null, year text not null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, college, department, year)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name','Participant'),
    coalesce(new.raw_user_meta_data->>'college',''), coalesce(new.raw_user_meta_data->>'department',''),
    coalesce(new.raw_user_meta_data->>'year','')) on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(), name text not null unique,
  category text not null check (category in ('Technical','Non-Technical')),
  description text not null default '', is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.events (name,category,description) values
('Paper Presentation','Technical','Present an idea, research topic or innovation with clarity.'),
('Project Presentation','Technical','Showcase a working model, prototype or software solution.'),
('Technical Quiz','Technical','Test your technical awareness and quick thinking.'),
('Coding Challenge','Technical','Solve programming problems against the clock.'),
('Debugging','Technical','Find errors, fix the logic and get the code running.'),
('Web Design Challenge','Technical','Turn a creative brief into a clean web experience.'),
('Connections','Non-Technical','Connect clues and discover the hidden answer.'),
('Treasure Hunt','Non-Technical','Follow clues, collaborate and reach the finish.'),
('Photography','Non-Technical','Capture a story through your lens.'),
('Meme Creation','Non-Technical','Bring humour and originality together.'),
('Cinema Quiz','Non-Technical','Put your movie knowledge to the test.'),
('Fun Games','Non-Technical','Quick challenges, teamwork and good energy.')
on conflict (name) do nothing;

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id),
  team_name text, created_at timestamptz not null default now(),
  unique(user_id,event_id)
);

-- Enforce the three-event maximum inside PostgreSQL. Advisory lock prevents concurrent requests
-- from racing past the limit for the same participant.
create or replace function public.enforce_three_event_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare current_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));
  select count(*) into current_count from public.event_registrations where user_id = new.user_id;
  if current_count >= 3 then
    raise exception 'maximum of 3 event registrations reached' using errcode = '23514';
  end if;
  return new;
end; $$;
drop trigger if exists limit_three_event_registrations on public.event_registrations;
create trigger limit_three_event_registrations before insert on public.event_registrations
for each row execute function public.enforce_three_event_limit();

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;

drop policy if exists "Participants can read own profile" on public.profiles;
create policy "Participants can read own profile" on public.profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "Participants can update own profile" on public.profiles;
create policy "Participants can update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "Anyone can read active events" on public.events;
create policy "Anyone can read active events" on public.events for select to anon, authenticated using (is_active = true);
drop policy if exists "Participants can read own registrations" on public.event_registrations;
create policy "Participants can read own registrations" on public.event_registrations for select to authenticated using (auth.uid() = user_id);
create or replace function public.is_verified_participant() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from auth.users u where u.id = auth.uid()
    and u.email_confirmed_at is not null and u.phone_confirmed_at is not null);
$$;
revoke all on function public.is_verified_participant() from public;
grant execute on function public.is_verified_participant() to authenticated;

drop policy if exists "Verified participants can register" on public.event_registrations;
create policy "Verified participants can register" on public.event_registrations for insert to authenticated
with check (auth.uid() = user_id and public.is_verified_participant());
drop policy if exists "Participants can cancel own registrations" on public.event_registrations;
create policy "Participants can cancel own registrations" on public.event_registrations for delete to authenticated using (auth.uid() = user_id);

