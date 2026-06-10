create or replace function public.submit_mock_exam_attempt(
  target_mock_exam_attempt_id uuid,
  submitted_answers jsonb,
  target_time_spent_seconds integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_attempt public.mock_exam_attempts%rowtype;
  answer jsonb;
  answer_question_id uuid;
  answer_choice_id uuid;
  answer_time_spent_seconds integer;
  selected_correct boolean;
  correct_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  select *
  into target_attempt
  from public.mock_exam_attempts mea
  where mea.id = target_mock_exam_attempt_id
  for update;

  if target_attempt.id is null
    or target_attempt.user_id <> auth.uid()
    or not public.is_active_group_member_for_exam(
      target_attempt.group_id,
      target_attempt.exam_program_id
    ) then
    raise exception 'Mock exam attempt was not found for the current user.';
  end if;

  if target_attempt.status <> 'in_progress' then
    raise exception 'Mock exam attempt has already been submitted.';
  end if;

  if jsonb_typeof(coalesce(submitted_answers, '[]'::jsonb)) <> 'array' then
    raise exception 'Submitted answers must be an array.';
  end if;

  for answer in
    select value
    from jsonb_array_elements(coalesce(submitted_answers, '[]'::jsonb))
  loop
    answer_question_id := (answer->>'question_id')::uuid;
    answer_choice_id := (answer->>'selected_choice_id')::uuid;
    answer_time_spent_seconds := nullif(answer->>'time_spent_seconds', '')::integer;

    select c.is_correct
    into selected_correct
    from public.mock_exam_items mei
    join public.choices c
      on c.question_id = mei.question_id
     and c.id = answer_choice_id
    where mei.mock_exam_id = target_attempt.mock_exam_id
      and mei.question_id = answer_question_id;

    if selected_correct is null then
      raise exception 'Selected choice must belong to the mock exam question.';
    end if;

    insert into public.mock_exam_answers (
      mock_exam_attempt_id,
      question_id,
      selected_choice_id,
      is_correct,
      time_spent_seconds
    )
    values (
      target_attempt.id,
      answer_question_id,
      answer_choice_id,
      selected_correct,
      answer_time_spent_seconds
    );

    if selected_correct then
      correct_count := correct_count + 1;
    end if;
  end loop;

  update public.mock_exam_attempts
  set status = 'submitted',
      submitted_at = now(),
      time_spent_seconds = greatest(0, coalesce(target_time_spent_seconds, 0)),
      score = correct_count
  where id = target_attempt.id;

  return target_attempt.id;
end;
$$;

grant execute on function public.submit_mock_exam_attempt(uuid, jsonb, integer)
to authenticated;
