-- ================================================================
-- MENTALABS · Caso demo (Demo Day): niño con sospecha de TEA
-- Datos 100 % ficticios. Reejecutable: borra y recrea el caso, así la demo
-- vuelve al punto de partida antes de cada presentación.
--
-- Personajes (basados en el perfil de usuario del Entregable 1):
--   Mariana Quispe Ccama   tutora   mariana.demo@mentalabs.com   / 1234
--   Thiago Quispe Ccama    paciente administrado por Mariana (sin login), 2 a 4 m
--   Ps. Roberto Mamani     psicólogo infantil, Arequipa   roberto.demo@mentalabs.com / 1234
--
-- Requiere: migraciones hasta 20260928040000 y seed_dtep_instruments.sql.
-- ================================================================

do $$
declare
  v_roberto uuid := 'cccccccc-0000-0000-0000-000000000001';
  v_mariana uuid := 'cccccccc-0000-0000-0000-000000000002';
  v_thiago  uuid := 'cccccccc-0000-0000-0000-000000000003';
  v_a1 uuid := 'cccccccc-0000-0000-0000-0000000000a1'; -- 1.ª consulta (firmada)
  v_a2 uuid := 'cccccccc-0000-0000-0000-0000000000a2'; -- observación CARS-2 (borrador)
  v_a3 uuid := 'cccccccc-0000-0000-0000-0000000000a3'; -- devolución (próxima)
  v_mchat_att uuid := 'cccccccc-0000-0000-0000-0000000000e1';
  v_cars_att  uuid := 'cccccccc-0000-0000-0000-0000000000e2';
  v_mchat uuid := 'dddddddd-0000-0000-0000-000000000001';
  v_cars  uuid := 'dddddddd-0000-0000-0000-000000000006';
  -- M-CHAT: ítems que "fallan" (puntúan 1). Total 11 = riesgo alto.
  mchat_fail int[] := array[2, 5, 6, 7, 9, 10, 14, 15, 16, 17, 19];
  -- CARS-2 en medios puntos ×2 (ver seed_dtep_instruments). Suma 66 = CARS-2 33.
  cars_scores int[] := array[5, 4, 5, 4, 4, 5, 4, 4, 3, 4, 6, 5, 4, 4, 5];
  i int;
begin
  -- ── Limpieza (orden por dependencias) ──
  delete from public.diagnostics where attempt_id in (v_mchat_att, v_cars_att);
  delete from public.attempt_answers where attempt_id in (v_mchat_att, v_cars_att);
  delete from public.exam_attempts where patient_id = v_thiago;
  delete from public.clinical_records where patient_id = v_thiago;
  delete from public.appointments where patient_id = v_thiago;
  delete from public.specialist_patient_assignments where patient_id = v_thiago;
  delete from public.tutor_patient_links where patient_id = v_thiago;
  delete from public.specialist_schedules where specialist_id = v_roberto;
  delete from auth.users where id in (v_roberto, v_mariana, v_thiago);

  -- ── Cuentas (el trigger on_auth_user_created crea profiles/patients/specialists) ──
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change)
  values
    (v_roberto, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'roberto.demo@mentalabs.com', extensions.crypt('1234', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"],"role":"especialista"}',
      '{"full_name":"Ps. Roberto Mamani Condori"}', '2026-06-01', now(), '', '', '', ''),
    (v_mariana, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'mariana.demo@mentalabs.com', extensions.crypt('1234', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"],"role":"tutor"}',
      '{"full_name":"Mariana Quispe Ccama"}', '2026-09-01', now(), '', '', '', ''),
    -- Hijo administrado: igual que public.create_dependent (sin email ni contraseña).
    (v_thiago, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      null, null, null,
      jsonb_build_object('role', 'paciente', 'managed', true, 'guardian_id', v_mariana),
      '{"full_name":"Thiago Quispe Ccama"}', '2026-09-01', now(), '', '', '', '');

  update public.profiles set birth_date = '2024-05-18', dni = '90876543' where id = v_thiago;
  update public.profiles set phone = '959 214 873', dni = '45128790' where id = v_mariana;
  insert into public.tutor_patient_links (tutor_id, patient_id, created_at) values (v_mariana, v_thiago, '2026-09-01');
  update public.patients set clinical_history_summary =
    'Niño de 2 años 4 meses derivado por el nido: no responde a su nombre, no señala y usa pocas palabras. M-CHAT-R/F con riesgo alto y CARS-2 en rango leve a moderado.'
  where id = v_thiago;

  update public.specialists set
    status = 'active', specialty = 'Psicología Clínica', title = 'Psicólogo infantil, neurodesarrollo',
    city = 'Arequipa', license_number = 'CPsP 27315 (demo)', years_experience = 9, rating = 4.9,
    review_count = 41, sessions_count = 730, hourly_rate = 110,
    focus_areas = array['Autismo (TEA)', 'TDAH/TDA', 'Desarrollo Infantil'],
    approaches = array['Cognitivo-conductual', 'Modelo Denver (ESDM)'],
    age_groups = array['Niños'], modalities = array['online', 'presencial'], languages = array['Español', 'Quechua'],
    bio = 'Evaluación del neurodesarrollo en niños de 1 a 11 años. Trabajo con la familia y el nido o colegio para que el informe sirva para empezar la intervención cuanto antes.'
  where id = v_roberto;

  insert into public.specialist_schedules (specialist_id, day_of_week, start_time, end_time, is_active)
  select v_roberto, d::int2, time '09:00', time '13:00', true from generate_series(1, 5) d
  union all select v_roberto, d::int2, time '15:00', time '18:00', true from unnest(array[2, 4]) d;

  insert into public.specialist_patient_assignments (specialist_id, patient_id, assigned_by, assigned_at, notes)
  values (v_roberto, v_thiago, v_roberto, '2026-09-02', 'Reservado por la madre desde el marketplace.');

  -- ── Citas (hora de Lima) ──
  insert into public.appointments (id, specialist_id, patient_id, start_time, end_time, status, attention_type, created_at) values
    (v_a1, v_roberto, v_thiago, '2026-09-08 10:00-05', '2026-09-08 11:00-05', 'completed', 'Primera consulta', '2026-09-02 21:14-05'),
    (v_a2, v_roberto, v_thiago, '2026-09-19 10:00-05', '2026-09-19 11:00-05', 'completed', 'Evaluación', '2026-09-10 21:30-05'),
    (v_a3, v_roberto, v_thiago, '2026-10-02 10:00-05', '2026-10-02 11:00-05', 'confirmed', 'Devolución de resultados', '2026-09-19 11:05-05');

  -- ── Historia clínica: 1.ª consulta (firmada) ──
  insert into public.clinical_records (appointment_id, patient_id, specialist_id, status, created_at, signed_at,
    consultation_reason, medical_history, symptom_onset, prenatal_perinatal, psychomotor_development,
    habits_behavior, school_history, clinical_evolution, observations, treatment_plan, diagnostic_codes, intervention_codes)
  values (v_a1, v_thiago, v_roberto, 'signed_and_locked', '2026-09-08 10:05-05', '2026-09-08 11:10-05',
    'La madre refiere que Thiago no responde a su nombre, no señala para pedir ni para mostrar y usa pocas palabras ("mamá", "agua"). Se tapa los oídos con la licuadora. La docente del nido sugirió una evaluación.',
    'Sin antecedentes médicos relevantes. Potenciales evocados auditivos normales (agosto 2026), solicitados por pediatría.',
    'Desde los 15 meses los padres notan menos interés en juegos de imitación y poco contacto visual.',
    'Embarazo controlado. Parto eutócico a las 39 semanas, 3.250 kg, sin complicaciones neonatales.',
    'Sostén cefálico 3 m, sedestación 6 m, marcha independiente 13 m. Primeras palabras a los 18 m; sin frases de dos palabras.',
    'Alinea juguetes por color y gira las ruedas de sus carritos por periodos largos. Sueño irregular. Selectividad alimentaria (acepta unos 8 alimentos).',
    'Asiste a un PRONOEI en Cerro Colorado desde marzo de 2026, 3 horas al día. Juega en paralelo; no se integra a las actividades grupales.',
    'Primera consulta. Contacto visual fugaz; no responde a su nombre en 3 de 3 intentos; juego repetitivo con bloques. Se asigna el M-CHAT-R/F a la madre desde la plataforma.',
    'Madre colaboradora y muy preocupada por la exigencia del nido. Refiere haber esperado 2 meses por una cita en su establecimiento de salud.',
    '1) M-CHAT-R/F respondido por la madre en casa. 2) Observación estructurada con CARS-2 en la próxima sesión. 3) Pautas iniciales de estimulación del lenguaje en casa.',
    '["R62.0"]', '["COO-01"]');

  -- ── Historia clínica: sesión de observación (borrador para firmar en vivo) ──
  insert into public.clinical_records (appointment_id, patient_id, specialist_id, status, created_at,
    consultation_reason, clinical_evolution, observations, treatment_plan, diagnostic_codes, intervention_codes)
  values (v_a2, v_thiago, v_roberto, 'draft', '2026-09-19 10:02-05',
    'Observación clínica estructurada y aplicación de CARS-2.',
    'M-CHAT-R/F respondido por la madre el 10/09: 11 puntos (riesgo alto). CARS-2: 33 puntos, rango leve a moderado. Mayor compromiso en comunicación verbal, imitación y relación con las personas. Juego funcional limitado; buena respuesta a rutinas visuales.',
    'Los resultados de ambos instrumentos son consistentes con la historia del desarrollo. Pendiente: devolución a la familia e informe para el nido.',
    'Impresión diagnóstica: TEA, nivel 1 a 2 de apoyo, a confirmar en la devolución. Derivar a terapia de lenguaje y a terapia ocupacional (integración sensorial). Programa de intervención temprana con participación de la familia. Informe para el PRONOEI con adaptaciones. Control en 3 meses.',
    '["F84.0", "F80.1"]', '["COO-01", "COO-02"]');

  -- ── Evaluaciones ──
  insert into public.exam_attempts (id, patient_id, exam_id, assigned_by, status, total_score, assigned_at, completed_at) values
    (v_mchat_att, v_thiago, v_mchat, v_roberto, 'completed', 11, '2026-09-08 11:12-05', '2026-09-10 20:47-05'),
    (v_cars_att,  v_thiago, v_cars,  v_roberto, 'completed', 66, '2026-09-19 10:05-05', '2026-09-19 10:52-05');

  for i in 1..20 loop
    insert into public.attempt_answers (attempt_id, question_id, selected_score, created_at)
    values (v_mchat_att, md5('mchat-' || i)::uuid, case when i = any (mchat_fail) then 1 else 0 end, '2026-09-10 20:47-05');
  end loop;
  for i in 1..15 loop
    insert into public.attempt_answers (attempt_id, question_id, selected_score, created_at)
    values (v_cars_att, md5('cars2-' || i)::uuid, cars_scores[i], '2026-09-19 10:52-05');
  end loop;

  insert into public.diagnostics (attempt_id, rule_id, generated_subcategory, recommendations, created_at)
  select v_mchat_att, r.id, r.subcategory, r.recommendations, timestamptz '2026-09-10 20:47-05' from public.diagnostic_rules r where r.id = md5('mchat-rule-3')::uuid
  union all
  select v_cars_att, r.id, r.subcategory, r.recommendations, timestamptz '2026-09-19 10:52-05' from public.diagnostic_rules r where r.id = md5('cars2-rule-2')::uuid;
end $$;
