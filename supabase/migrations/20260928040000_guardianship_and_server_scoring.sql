-- ================================================================
-- Tutela: una sola cuenta (madre/padre/tutor) administra a sus hijos
-- menores de 18. El hijo existe como paciente (profiles + patients) pero
-- NO tiene credenciales: es un usuario de auth sin email ni contraseña,
-- así que no puede iniciar sesión. Todo lo hace el tutor vinculado en
-- tutor_patient_links.
-- ================================================================

-- ¿El usuario actual es tutor de este paciente?
create or replace function public.is_guardian_of(p_patient uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.tutor_patient_links l
    where l.tutor_id = (select auth.uid()) and l.patient_id = p_patient
  )
$$;

create index if not exists tutor_patient_links_tutor_idx on public.tutor_patient_links (tutor_id, patient_id);
create unique index if not exists tutor_patient_links_pair_uniq on public.tutor_patient_links (tutor_id, patient_id);

-- Alta de un hijo/a administrado. SECURITY DEFINER porque crea el usuario en
-- auth; el rol queda fijado en "paciente" y solo un tutor puede llamarla.
create or replace function public.create_dependent(p_full_name text, p_birth_date date, p_dni text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  guardian uuid := (select auth.uid());
  child uuid := gen_random_uuid();
  v_name text := nullif(trim(p_full_name), '');
begin
  if guardian is null or public."current_role"() <> 'tutor' then
    raise exception 'Solo una cuenta de tutor puede registrar hijos' using errcode = '42501';
  end if;
  if v_name is null or length(v_name) > 120 then
    raise exception 'Nombre inválido' using errcode = '22023';
  end if;
  if p_birth_date is null or p_birth_date > current_date or p_birth_date <= (current_date - interval '18 years') then
    raise exception 'La cuenta administrada es para menores de 18 años' using errcode = '22023';
  end if;
  if (select count(*) from public.tutor_patient_links where tutor_id = guardian) >= 8 then
    raise exception 'Límite de perfiles alcanzado' using errcode = '54000';
  end if;

  insert into auth.users (
    id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    child, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', null,
    jsonb_build_object('role', 'paciente', 'managed', true, 'guardian_id', guardian),
    jsonb_build_object('full_name', v_name),
    now(), now(), '', '', '', ''
  );
  -- on_auth_user_created ya creó profiles + patients.
  update public.profiles set birth_date = p_birth_date, dni = nullif(trim(p_dni), '') where id = child;
  insert into public.tutor_patient_links (tutor_id, patient_id) values (guardian, child);
  return child;
end;
$$;

revoke all on function public.create_dependent(text, date, text) from public, anon;
grant execute on function public.create_dependent(text, date, text) to authenticated;

-- Permisos del tutor sobre sus hijos (además de los que ya tenía de lectura).
drop policy if exists profiles_select_guardian on public.profiles;
create policy profiles_select_guardian on public.profiles
  for select to authenticated using (public.is_guardian_of(id));

drop policy if exists appointments_insert_guardian on public.appointments;
create policy appointments_insert_guardian on public.appointments
  for insert to authenticated with check (public.is_guardian_of(patient_id));

drop policy if exists appointments_update_guardian on public.appointments;
create policy appointments_update_guardian on public.appointments
  for update to authenticated
  using (public.is_guardian_of(patient_id))
  with check (public.is_guardian_of(patient_id));

drop policy if exists attempt_answers_select_guardian on public.attempt_answers;
create policy attempt_answers_select_guardian on public.attempt_answers
  for select to authenticated
  using (exists (select 1 from public.exam_attempts ea where ea.id = attempt_id and public.is_guardian_of(ea.patient_id)));

drop policy if exists interactive_sessions_insert_guardian on public.interactive_sessions;
create policy interactive_sessions_insert_guardian on public.interactive_sessions
  for insert to authenticated with check (public.is_guardian_of(patient_id));

-- La familia ve el informe solo cuando el especialista lo firmó.
drop policy if exists clinical_records_select_guardian_signed on public.clinical_records;
create policy clinical_records_select_guardian_signed on public.clinical_records
  for select to authenticated using (status = 'signed_and_locked' and public.is_guardian_of(patient_id));

-- ================================================================
-- Corrección en el servidor. Antes el navegador enviaba el puntaje total;
-- ahora se envían las respuestas y la BD valida cada puntaje contra las
-- opciones de la pregunta, suma, y aplica la regla diagnóstica por edad.
-- ================================================================

-- Puntajes válidos de una pregunta según su tipo.
create or replace function private.allowed_scores(p_options jsonb)
returns int[]
language sql
immutable
set search_path = ''
as $$
  select case
    when jsonb_typeof(p_options) = 'array' then
      array(select (c ->> 'score')::int from jsonb_array_elements(p_options) c)
    when p_options ->> 'type' in ('likert', 'single_choice') then
      array(select (c ->> 'score')::int from jsonb_array_elements(p_options -> 'choices') c)
    when p_options ->> 'type' = 'yesno' then
      array[(p_options ->> 'yes_score')::int, (p_options ->> 'no_score')::int]
    when p_options ->> 'type' = 'vas' then
      array(select generate_series(coalesce((p_options ->> 'min')::int, 0), coalesce((p_options ->> 'max')::int, 10)))
    else array[]::int[]
  end
$$;

create or replace function public.submit_attempt(p_attempt uuid, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  att public.exam_attempts;
  q record;
  score int;
  total int := 0;
  v_age int;
  rule public.diagnostic_rules;
begin
  select * into att from public.exam_attempts where id = p_attempt for update;
  if not found then
    raise exception 'Evaluación no encontrada' using errcode = 'P0002';
  end if;
  -- Responde el paciente, su tutor (cuestionarios para padres) o el
  -- especialista que la asignó (escalas de observación clínica como CARS-2).
  if not (att.patient_id = me or att.assigned_by = me or public.is_guardian_of(att.patient_id)) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if att.status = 'completed' then
    raise exception 'Esta evaluación ya fue enviada' using errcode = '23505';
  end if;

  for q in select id, options from public.questions where exam_id = att.exam_id loop
    if p_answers ? q.id::text and jsonb_typeof(p_answers -> q.id::text) = 'number' then
      score := (p_answers ->> q.id::text)::int;
      if not score = any (private.allowed_scores(q.options)) then
        raise exception 'Respuesta inválida en la pregunta %', q.id using errcode = '22023';
      end if;
      insert into public.attempt_answers (attempt_id, question_id, selected_score) values (att.id, q.id, score);
      total := total + score;
    end if;
  end loop;

  update public.exam_attempts
  set status = 'completed', total_score = total, completed_at = now()
  where id = att.id;

  select extract(year from age(current_date, p.birth_date))::int into v_age
  from public.profiles p where p.id = att.patient_id;

  select * into rule from public.diagnostic_rules r
  where r.exam_id = att.exam_id and coalesce(r.is_active, true)
    and total between r.min_score and r.max_score
    and (v_age is null or v_age between coalesce(r.min_age, 0) and coalesce(r.max_age, 120))
  order by r.min_score desc
  limit 1;

  if found then
    insert into public.diagnostics (attempt_id, rule_id, generated_subcategory, recommendations)
    values (att.id, rule.id, rule.subcategory, rule.recommendations);
  end if;

  return jsonb_build_object('total', total, 'subcategory', rule.subcategory);
end;
$$;

revoke all on function public.submit_attempt(uuid, jsonb) from public, anon;
grant execute on function public.submit_attempt(uuid, jsonb) to authenticated;
