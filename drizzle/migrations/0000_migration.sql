
create type public.app_role as enum ('admin', 'user');
create type public.family_role as enum ('owner', 'parent', 'caregiver', 'readonly');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Ma famille',
  created_by uuid not null,
  created_at timestamptz not null default now()
);
grant select, update on public.families to authenticated;
grant all on public.families to service_role;
alter table public.families enable row level security;

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null,
  role public.family_role not null,
  created_at timestamptz not null default now(),
  unique (family_id, user_id)
);
create index on public.family_members(user_id);
grant select, update, delete on public.family_members to authenticated;
grant all on public.family_members to service_role;
alter table public.family_members enable row level security;

create table public.babies (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 60),
  birth_date date not null,
  diversification_start date,
  allergies text check (char_length(allergies) <= 1000),
  notes text check (char_length(notes) <= 2000),
  avatar_path text,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.babies(family_id);
grant select, insert, update, delete on public.babies to authenticated;
grant all on public.babies to service_role;
alter table public.babies enable row level security;

-- helpers
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_family_member(_family_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.family_members where family_id = _family_id and user_id = auth.uid())
$$;

create or replace function public.can_edit_family(_family_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.family_members where family_id = _family_id and user_id = auth.uid() and role in ('owner','parent','caregiver'))
$$;

create or replace function public.is_family_owner(_family_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.family_members where family_id = _family_id and user_id = auth.uid() and role = 'owner')
$$;

-- policies
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());

create policy "own roles read" on public.user_roles for select to authenticated using (user_id = auth.uid());

create policy "members read family" on public.families for select to authenticated using (public.is_family_member(id));
create policy "owner updates family" on public.families for update to authenticated using (public.is_family_owner(id)) with check (public.is_family_owner(id));

create policy "members read members" on public.family_members for select to authenticated using (public.is_family_member(family_id));
create policy "owner updates members" on public.family_members for update to authenticated using (public.is_family_owner(family_id) and user_id <> auth.uid()) with check (public.is_family_owner(family_id) and role <> 'owner');
create policy "owner removes members or self leave" on public.family_members for delete to authenticated using ((public.is_family_owner(family_id) and user_id <> auth.uid()) or (user_id = auth.uid() and role <> 'owner'));

create policy "members read babies" on public.babies for select to authenticated using (public.is_family_member(family_id));
create policy "editors add babies" on public.babies for insert to authenticated with check (public.can_edit_family(family_id) and created_by = auth.uid());
create policy "editors update babies" on public.babies for update to authenticated using (public.can_edit_family(family_id)) with check (public.can_edit_family(family_id));
create policy "owner deletes babies" on public.babies for delete to authenticated using (public.is_family_owner(family_id));

-- signup: profile + personal family
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  insert into public.families (name, created_by) values ('Ma famille', new.id) returning id into fid;
  insert into public.family_members (family_id, user_id, role) values (fid, new.id, 'owner');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$ begin new.updated_at = now(); return new; end; $$;
create trigger babies_touch before update on public.babies for each row execute function public.touch_updated_at();
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
