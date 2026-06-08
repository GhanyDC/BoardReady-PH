alter table public.study_preferences
add constraint study_preferences_rest_days_allowed_check
check (
  rest_days is null
  or rest_days <@ array[
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday'
  ]::text[]
);
