-- ================================================================
-- MENTALABS · Caso de storytelling: Mateo, 8 años, TDAH (Arequipa)
-- Datos 100 % ficticios. Reejecutable (borra y recrea el caso).
--
--   Luis Huamaní Ticona   padre (tutor)   luis.demo@mentalabs.com / 1234
--   Mateo Huamaní Flores  8 años, 3.er grado; cuenta administrada por Luis
--   Ps. Roberto Mamani    psicólogo (creado en seed_demo_tea.sql)
--
-- Recorrido (3 sesiones, 4 días): martes 18/08 consulta y esa noche el Conners 4
-- del padre desde casa → jueves 20/08 batería digital de juegos (y videollamada
-- breve con la docente) → viernes 21/08 devolución con diagnóstico (F90.0)
-- → práctica en casa con los juegos → control 10/09 → control 01/10.
-- Requiere: seed_dtep_instruments.sql, migración 20260928080000 y seed_demo_tea.sql.
-- ================================================================

do $$
declare
  v_roberto uuid := 'cccccccc-0000-0000-0000-000000000001';
  v_luis    uuid := 'cccccccc-0000-0000-0001-000000000001';
  v_mateo   uuid := 'cccccccc-0000-0000-0001-000000000002';
  s1 uuid := 'cccccccc-0000-0000-0001-0000000000a1';
  s2 uuid := 'cccccccc-0000-0000-0001-0000000000a2';
  s3 uuid := 'cccccccc-0000-0000-0001-0000000000a3';
  s4 uuid := 'cccccccc-0000-0000-0001-0000000000a4';
  s5 uuid := 'cccccccc-0000-0000-0001-0000000000a5';
  e_conners  uuid := 'cccccccc-0000-0000-0001-0000000000e1';
  e_bateria  uuid := 'cccccccc-0000-0000-0001-0000000000e2';
  e_control  uuid := 'cccccccc-0000-0000-0001-0000000000e3';
  x_conners uuid := 'dddddddd-0000-0000-0000-000000000005';
  x_bateria uuid := 'dddddddd-0000-0000-0000-000000000007';
  -- Conners 4, padre (43 ítems en orden). Total 77 = muy elevado.
  conners int[] := array[3,1,2,3,3,2,3,1,1,3,2,2,3,2,1,2,2,3,3,2,3,3,2,3,2,2,1,1,1,1,1,0,0,0,1,1,2,1,1,1,1,2,3];
  i int;
begin
  -- ── Limpieza ──
  delete from public.interactive_sessions where patient_id = v_mateo;
  delete from public.diagnostics where attempt_id in (e_conners, e_bateria, e_control);
  delete from public.attempt_answers where attempt_id in (e_conners, e_bateria, e_control);
  delete from public.exam_attempts where patient_id = v_mateo;
  delete from public.clinical_records where patient_id = v_mateo;
  delete from public.appointments where patient_id = v_mateo;
  delete from public.specialist_patient_assignments where patient_id = v_mateo;
  delete from public.tutor_patient_links where patient_id = v_mateo;
  delete from auth.users where id in (v_luis, v_mateo);

  -- ── Cuentas ──
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change)
  values
    (v_luis, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'luis.demo@mentalabs.com', extensions.crypt('1234', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"],"role":"tutor"}',
      '{"full_name":"Luis Huamaní Ticona"}', '2026-08-15', now(), '', '', '', ''),
    (v_mateo, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      null, null, null,
      jsonb_build_object('role', 'paciente', 'managed', true, 'guardian_id', v_luis),
      '{"full_name":"Mateo Huamaní Flores"}', '2026-08-15', now(), '', '', '', '');

  update public.profiles set birth_date = '2018-04-11', dni = '81234567' where id = v_mateo;
  update public.profiles set phone = '951 408 226', dni = '42761903' where id = v_luis;
  insert into public.tutor_patient_links (tutor_id, patient_id, created_at) values (v_luis, v_mateo, '2026-08-15');
  update public.patients set status = 'in_treatment', clinical_history_summary =
    'Niño de 8 años, 3.er grado. TDAH presentación combinada, moderado (F90.0), diagnosticado el 21/08/2026 en 3 sesiones. En entrenamiento a padres y con adaptaciones escolares; control quincenal.'
  where id = v_mateo;

  insert into public.specialist_patient_assignments (specialist_id, patient_id, assigned_by, assigned_at, notes)
  values (v_roberto, v_mateo, v_roberto, '2026-08-15', 'Reservado por el padre desde el marketplace.');

  -- ── Citas (hora de Lima; martes y jueves por la tarde) ──
  insert into public.appointments (id, specialist_id, patient_id, start_time, end_time, status, attention_type, created_at) values
    (s1, v_roberto, v_mateo, '2026-08-18 16:00-05', '2026-08-18 17:00-05', 'completed', 'Primera consulta', '2026-08-15 22:41-05'),
    (s2, v_roberto, v_mateo, '2026-08-20 16:00-05', '2026-08-20 17:00-05', 'completed', 'Evaluación neuropsicológica', '2026-08-18 17:02-05'),
    (s3, v_roberto, v_mateo, '2026-08-21 10:00-05', '2026-08-21 11:00-05', 'completed', 'Devolución y diagnóstico', '2026-08-20 17:05-05'),
    (s4, v_roberto, v_mateo, '2026-09-10 16:00-05', '2026-09-10 17:00-05', 'completed', 'Control 1', '2026-08-21 11:10-05'),
    (s5, v_roberto, v_mateo, '2026-10-01 16:00-05', '2026-10-01 17:00-05', 'confirmed', 'Control 2', '2026-09-10 17:04-05');

  -- ── Historia clínica ──
  insert into public.clinical_records (appointment_id, patient_id, specialist_id, status, created_at, signed_at,
    consultation_reason, medical_history, symptom_onset, prenatal_perinatal, psychomotor_development, habits_behavior, school_history,
    clinical_evolution, observations, treatment_plan, diagnostic_codes, intervention_codes)
  values
  (s1, v_mateo, v_roberto, 'signed_and_locked', '2026-08-18 16:05-05', '2026-08-18 17:08-05',
    'El padre consulta porque la docente de 3.er grado reporta que Mateo no termina las tareas en clase, se levanta constantemente, interrumpe y pierde sus útiles. El colegio pide una evaluación antes del cierre del III bimestre.',
    'Sin enfermedades crónicas. Agudeza visual y auditiva evaluadas en el colegio (mayo 2026): normales. No toma medicación.',
    'Desde el nido lo describían como "muy movido". Las dificultades se hicieron evidentes en 1.er grado, al aumentar las exigencias de lectura y escritura.',
    'Embarazo controlado. Cesárea a las 38 semanas por presentación podálica, 3.100 kg, sin complicaciones.',
    'Marcha a los 11 meses. Lenguaje dentro de lo esperado. Motricidad fina con letra poco legible y desordenada.',
    'En casa necesita que le repitan las indicaciones 3 o 4 veces. Las tareas toman más de 2 horas y terminan en discusiones. Duerme 9 horas. Videojuegos 2 horas al día. Buen vínculo con su hermana menor.',
    'IE pública en Cayma, 3.er grado. Logro "en proceso" en Comunicación y Matemática, aunque comprende los contenidos de forma oral. Notas por conducta en la agenda casi a diario.',
    'Amable y conversador. Durante la entrevista se levanta 5 veces, manipula objetos del escritorio y responde antes de que termine la pregunta. Se asigna al padre la escala Conners 4 para responder esta noche y se programa la batería digital para el jueves.',
    'El padre es taxista con turnos rotativos y la madre trabaja en el mercado: valoran responder cuestionarios desde casa sin pedir permisos. Se coordina una videollamada breve con la docente.',
    '1) Conners 4 para padres desde la plataforma (esta noche). 2) Batería digital de atención y funciones ejecutivas el jueves 20/08. 3) Videollamada con la docente. 4) Devolución el viernes 21/08.',
    '["Z03.2"]', '["COO-01"]'),
  (s2, v_mateo, v_roberto, 'signed_and_locked', '2026-08-20 16:02-05', '2026-08-20 17:12-05',
    'Evaluación neuropsicológica con la batería digital (Stroop, D2-R, CARAS-R y Torre de Londres) e información escolar.',
    null, null, null, null, null, null,
    'Completa las cuatro pruebas en 26 minutos con dos pausas. Stroop: índice de interferencia −8,0 con 7 errores en la fase de interferencia. D2-R: 24,6 % de errores (17 omisiones, 12 comisiones) y alta variación entre filas (VAR 11). CARAS-R: ICI 41 %, estilo impulsivo (31 aciertos, 13 errores). Torre de Londres: resuelve 6 de 8 niveles, solo 2 en el mínimo de movimientos, con 1,4 s de planificación antes de mover.',
    'Conners 4 del padre (18/08, 22:14): 77 puntos brutos, rango muy elevado, con mayor peso en inatención e hiperactividad. Videollamada con la docente (Prof. Elena Chambi, 20/08 por la mañana): le cuesta sostener la atención más de 10 minutos, olvida materiales, se levanta sin permiso y responde antes de tiempo; conductas presentes en casa y en el colegio desde antes de los 7 años. Criterios DSM-5 observados: inatención 7 de 9; hiperactividad e impulsividad 6 de 9.',
    'Preparar la devolución a la familia y el informe para el colegio (viernes 21/08).',
    '["Z03.2"]', '["COO-02", "COO-16"]'),
  (s3, v_mateo, v_roberto, 'signed_and_locked', '2026-08-21 10:04-05', '2026-08-21 11:15-05',
    'Devolución de resultados y diagnóstico a los padres.',
    null, null, null, null, null, null,
    'Integrando la historia del desarrollo, la escala Conners 4 (77, muy elevado), la batería digital (control inhibitorio, atención selectiva, impulsividad y planificación por debajo de lo esperado) y la información escolar (criterios presentes en dos contextos), se concluye: Trastorno por Déficit de Atención e Hiperactividad, presentación combinada, grado moderado. El funcionamiento intelectual observado es acorde a la edad; las dificultades no se explican mejor por otro trastorno.',
    'Los padres reciben el diagnóstico con alivio: "por fin sabemos que no es flojera". Se explica el TDAH con material visual y se resuelven dudas sobre la medicación.',
    '1) Psicoeducación y entrenamiento a padres (8 sesiones quincenales). 2) Entrenamiento en organización y autorregulación para Mateo. 3) Informe para el colegio con adaptaciones: ubicación cerca de la docente, instrucciones en pasos cortos, tiempo extra y pausas activas. 4) Derivación a neuropediatría para valorar tratamiento farmacológico. 5) Práctica en casa con los juegos de atención los sábados. 6) Control en 3 semanas.',
    '["F90.0"]', '["COO-04", "COO-14", "COO-15", "COO-16"]'),
  (s4, v_mateo, v_roberto, 'signed_and_locked', '2026-09-10 16:03-05', '2026-09-10 17:06-05',
    'Primer control tras la devolución.',
    null, null, null, null, null, null,
    'El padre refiere que con el horario visual las tareas bajaron de más de 2 horas a 1 hora y 15 minutos. La docente ubicó a Mateo cerca de la pizarra y reporta menos interrupciones. En los juegos de casa, el ICI de CARAS-R subió de 41 % a 65 %. Cita en neuropediatría el 15/10.',
    'Mateo cuenta con orgullo que "ya gana" en la cara diferente. Aún pierde materiales con frecuencia.',
    'Continuar el entrenamiento a padres (sesión 2 de 8). Introducir una lista de verificación para la mochila. Conners 4 de seguimiento antes del próximo control.',
    '["F90.0"]', '["COO-11", "COO-14"]');

  -- ── Evaluaciones ──
  insert into public.exam_attempts (id, patient_id, exam_id, assigned_by, status, total_score, assigned_at, completed_at) values
    (e_conners, v_mateo, x_conners, v_roberto, 'completed', 77, '2026-08-18 16:58-05', '2026-08-18 22:14-05'),
    (e_bateria, v_mateo, x_bateria, v_roberto, 'completed', 0,  '2026-08-18 17:00-05', '2026-08-20 16:34-05'),
    (e_control, v_mateo, x_conners, v_roberto, 'pending',  null, '2026-09-10 17:00-05', null);

  for i in 1..43 loop
    insert into public.attempt_answers (attempt_id, question_id, selected_score, created_at)
    values (e_conners, md5('conners4-' || i)::uuid, conners[i], '2026-08-18 22:14-05');
  end loop;

  insert into public.diagnostics (attempt_id, rule_id, generated_subcategory, recommendations, created_at)
  select e_conners, r.id, r.subcategory, r.recommendations, timestamptz '2026-08-18 22:14-05'
  from public.diagnostic_rules r where r.id = md5('conners4-rule-4')::uuid;

  -- ── Juegos: batería en consulta (20/08) ──
  insert into public.interactive_sessions (patient_id, attempt_id, game_type, session_start, session_end, metrics) values
    (v_mateo, e_bateria, 'stroop', '2026-08-20 16:08-05', '2026-08-20 16:11-05',
      '{"P":52,"C":38,"PC":14,"errores_P":1,"errores_C":3,"errores_PC":7,"tr_P_ms":812,"tr_C_ms":1044,"tr_PC_ms":1693,"interferencia":-8.0,"segundos_por_fase":45}'),
    (v_mateo, e_bateria, 'd2r', '2026-08-20 16:13-05', '2026-08-20 16:16-05',
      '{"TR":118,"TA":38,"O":17,"C":12,"TOT":89,"CON":26,"VAR":11,"errores_pct":24.6,"lineas":6,"segundos_por_linea":20}'),
    (v_mateo, e_bateria, 'caras_r', '2026-08-20 16:19-05', '2026-08-20 16:22-05',
      '{"A":31,"E":13,"A_menos_E":18,"ICI":41,"respondidos":44,"omisiones":16,"tr_medio_ms":3190,"segundos":180}'),
    (v_mateo, e_bateria, 'tower_london', '2026-08-20 16:25-05', '2026-08-20 16:34-05',
      '{"niveles":8,"resueltos":6,"resueltos_en_minimo":2,"movimientos_totales":52,"movimientos_extra":17,"planificacion_media_ms":1420,"violaciones_regla":5}'),
  -- ── Juegos: práctica en casa desde el portal del padre ──
    (v_mateo, null, 'caras_r', '2026-08-29 10:20-05', '2026-08-29 10:23-05',
      '{"A":34,"E":11,"A_menos_E":23,"ICI":51,"respondidos":45,"omisiones":15,"tr_medio_ms":3050,"segundos":180}'),
    (v_mateo, null, 'caras_r', '2026-09-05 10:05-05', '2026-09-05 10:08-05',
      '{"A":38,"E":8,"A_menos_E":30,"ICI":65,"respondidos":46,"omisiones":14,"tr_medio_ms":3310,"segundos":180}');
end $$;
