create extension if not exists pgcrypto with schema extensions;

do $$
begin
  create type public.app_role as enum ('reviewer', 'admin', 'super_admin');
exception
  when duplicate_object then null;
end
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text check (
    full_name is null
    or char_length(btrim(full_name)) between 2 and 160
  ),
  avatar_url text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  invite_code text not null unique check (
    invite_code = upper(invite_code)
    and invite_code ~ '^[A-Z0-9-]{6,32}$'
  ),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'reviewer',
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 120),
  board_weight integer not null default 0 check (board_weight between 0 and 100),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, name),
  unique (id, group_id)
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  subject_id uuid not null,
  name text not null check (char_length(btrim(name)) between 2 and 140),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_id, name),
  foreign key (subject_id, group_id)
    references public.subjects(id, group_id)
    on delete cascade
);

create index profiles_full_name_idx on public.profiles using btree (full_name);
create index group_members_user_id_idx on public.group_members using btree (user_id);
create index group_members_group_id_idx on public.group_members using btree (group_id);
create index subjects_group_id_idx on public.subjects using btree (group_id);
create index topics_group_id_idx on public.topics using btree (group_id);
create index topics_subject_id_idx on public.topics using btree (subject_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_groups_updated_at
before update on public.groups
for each row execute function public.set_updated_at();

create trigger set_group_members_updated_at
before update on public.group_members
for each row execute function public.set_updated_at();

create trigger set_subjects_updated_at
before update on public.subjects
for each row execute function public.set_updated_at();

create trigger set_topics_updated_at
before update on public.topics
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(btrim(coalesce(new.raw_user_meta_data->>'full_name', '')), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_group_member(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = target_group_id
      and gm.user_id = auth.uid()
  );
$$;

create or replace function public.is_group_admin(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = target_group_id
      and gm.user_id = auth.uid()
      and gm.role in ('admin', 'super_admin')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.user_id = auth.uid()
      and gm.role = 'super_admin'
  );
$$;

create or replace function public.join_group_with_invite(
  p_invite_code text,
  p_full_name text
)
returns table (
  group_id uuid,
  group_name text,
  role public.app_role
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text;
  normalized_name text;
  target_group public.groups%rowtype;
  member_role public.app_role;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  normalized_code := upper(btrim(coalesce(p_invite_code, '')));
  normalized_name := regexp_replace(btrim(coalesce(p_full_name, '')), '\s+', ' ', 'g');

  if char_length(normalized_name) < 2 then
    raise exception 'Full name is required.';
  end if;

  select *
  into target_group
  from public.groups g
  where g.invite_code = normalized_code;

  if target_group.id is null then
    raise exception 'Invalid group invite code.';
  end if;

  insert into public.profiles (id, full_name, onboarding_completed)
  values (auth.uid(), normalized_name, true)
  on conflict (id) do update
  set full_name = excluded.full_name,
      onboarding_completed = true,
      updated_at = now();

  insert into public.group_members (group_id, user_id, role)
  values (target_group.id, auth.uid(), 'reviewer')
  on conflict (group_id, user_id) do nothing;

  select gm.role
  into member_role
  from public.group_members gm
  where gm.group_id = target_group.id
    and gm.user_id = auth.uid();

  return query
  select target_group.id, target_group.name, member_role;
end;
$$;

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.subjects enable row level security;
alter table public.topics enable row level security;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Members can read their groups"
on public.groups
for select
to authenticated
using (public.is_group_member(id) or public.is_super_admin());

create policy "Super admins can create groups"
on public.groups
for insert
to authenticated
with check (public.is_super_admin());

create policy "Super admins can update groups"
on public.groups
for update
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "Super admins can delete groups"
on public.groups
for delete
to authenticated
using (public.is_super_admin());

create policy "Users can read their own memberships"
on public.group_members
for select
to authenticated
using (user_id = auth.uid());

create policy "Admins can read group memberships"
on public.group_members
for select
to authenticated
using (public.is_group_admin(group_id) or public.is_super_admin());

create policy "Super admins can manage memberships"
on public.group_members
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "Group members can read subjects"
on public.subjects
for select
to authenticated
using (public.is_group_member(group_id) or public.is_super_admin());

create policy "Admins can create subjects"
on public.subjects
for insert
to authenticated
with check (public.is_group_admin(group_id) or public.is_super_admin());

create policy "Admins can update subjects"
on public.subjects
for update
to authenticated
using (public.is_group_admin(group_id) or public.is_super_admin())
with check (public.is_group_admin(group_id) or public.is_super_admin());

create policy "Admins can delete subjects"
on public.subjects
for delete
to authenticated
using (public.is_group_admin(group_id) or public.is_super_admin());

create policy "Group members can read topics"
on public.topics
for select
to authenticated
using (public.is_group_member(group_id) or public.is_super_admin());

create policy "Admins can create topics"
on public.topics
for insert
to authenticated
with check (public.is_group_admin(group_id) or public.is_super_admin());

create policy "Admins can update topics"
on public.topics
for update
to authenticated
using (public.is_group_admin(group_id) or public.is_super_admin())
with check (public.is_group_admin(group_id) or public.is_super_admin());

create policy "Admins can delete topics"
on public.topics
for delete
to authenticated
using (public.is_group_admin(group_id) or public.is_super_admin());

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.groups to authenticated;
grant select, insert, update, delete on public.group_members to authenticated;
grant select, insert, update, delete on public.subjects to authenticated;
grant select, insert, update, delete on public.topics to authenticated;
grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.is_group_admin(uuid) to authenticated;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.join_group_with_invite(text, text) to authenticated;

insert into public.groups (id, name, invite_code)
values (
  '00000000-0000-0000-0000-000000000001',
  'PsyPass Founding Review Group',
  'PSYPASS-FOUNDING'
)
on conflict (id) do update
set name = excluded.name,
    invite_code = excluded.invite_code,
    updated_at = now();

insert into public.subjects (id, group_id, name, board_weight, sort_order)
values
  (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000001',
    'Psychological Assessment',
    40,
    1
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000001',
    'Developmental Psychology',
    20,
    2
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000001',
    'Abnormal Psychology',
    20,
    3
  ),
  (
    '00000000-0000-0000-0000-000000000104',
    '00000000-0000-0000-0000-000000000001',
    'Industrial-Organizational Psychology',
    20,
    4
  )
on conflict (id) do update
set name = excluded.name,
    board_weight = excluded.board_weight,
    sort_order = excluded.sort_order,
    updated_at = now();
