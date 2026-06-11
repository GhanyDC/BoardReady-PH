-- Fix: column reference "group_id" is ambiguous in join_group_with_invite
--
-- The function returns table(group_id uuid, ...), so inside the body
-- "group_id" is ambiguous between the PL/pgSQL output variable and the
-- table column. Replace the positional ON CONFLICT clause with an explicit
-- constraint reference to eliminate the ambiguity.
--
-- Constraint: group_members_group_id_user_id_key (auto-named unique(group_id, user_id))

create or replace function public.join_group_with_invite(
  p_invite_code text,
  p_full_name text
)
returns table (
  group_id uuid,
  group_name text,
  exam_program_id uuid,
  exam_program_name text,
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
  target_exam_program public.exam_programs%rowtype;
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

  select *
  into target_exam_program
  from public.exam_programs ep
  where ep.id = target_group.exam_program_id
    and ep.is_active = true;

  if target_exam_program.id is null then
    raise exception 'This group is not connected to an active exam track.';
  end if;

  insert into public.profiles (
    id,
    full_name,
    onboarding_completed,
    current_group_id
  )
  values (
    auth.uid(),
    normalized_name,
    true,
    target_group.id
  )
  on conflict (id) do update
  set full_name = excluded.full_name,
      onboarding_completed = true,
      current_group_id = excluded.current_group_id,
      updated_at = now();

  insert into public.group_members (group_id, user_id, role)
  values (target_group.id, auth.uid(), 'reviewer'::public.app_role)
  on conflict on constraint group_members_group_id_user_id_key do nothing;

  select gm.role
  into member_role
  from public.group_members gm
  where gm.group_id = target_group.id
    and gm.user_id = auth.uid();

  return query
  select
    target_group.id,
    target_group.name,
    target_exam_program.id,
    target_exam_program.name,
    member_role;
end;
$$;
