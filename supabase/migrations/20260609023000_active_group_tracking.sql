alter table public.profiles
add column if not exists current_group_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_current_group_id_fkey'
  ) then
    alter table public.profiles
    add constraint profiles_current_group_id_fkey
    foreign key (current_group_id)
    references public.groups(id)
    on delete set null;
  end if;
end
$$;

create index if not exists profiles_current_group_id_idx
on public.profiles using btree (current_group_id);

comment on column public.profiles.current_group_id is
  'Active group context for the user. Active exam program is derived from groups.exam_program_id.';
