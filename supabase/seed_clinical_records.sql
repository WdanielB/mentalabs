-- ================================================================
-- MENTALABS: Seed de catálogos clínicos y registros de prueba
-- Prerequisito: seed_auth.sql ya ejecutado (usuarios de prueba)
-- Ejecuta en: Supabase Dashboard → SQL Editor → New query
-- ================================================================

-- ── 1. Códigos de intervención psicológica ───────────────────────
INSERT INTO psychological_intervention_codes (code, name, category) VALUES
  ('COO-01', 'Evaluación psicológica inicial',                 'Evaluación'),
  ('COO-02', 'Evaluación neuropsicológica',                    'Evaluación'),
  ('COO-03', 'Psicoeducación al paciente',                     'Psicoeducación'),
  ('COO-04', 'Psicoeducación familiar',                        'Psicoeducación'),
  ('COO-05', 'Técnicas cognitivo-conductuales (TCC)',          'Intervención TCC'),
  ('COO-06', 'Reestructuración cognitiva',                     'Intervención TCC'),
  ('COO-07', 'Entrenamiento en habilidades sociales',          'Intervención conductual'),
  ('COO-08', 'Entrenamiento en autorregulación emocional',     'Intervención conductual'),
  ('COO-09', 'Mindfulness y atención plena',                   'Regulación emocional'),
  ('COO-10', 'Técnicas de relajación',                         'Regulación emocional'),
  ('COO-11', 'Entrenamiento en organización y gestión del tiempo', 'Funciones ejecutivas'),
  ('COO-12', 'Entrenamiento en memoria de trabajo',            'Funciones ejecutivas'),
  ('COO-13', 'Terapia familiar sistémica',                     'Intervención familiar'),
  ('COO-14', 'Orientación a padres / cuidadores',              'Intervención familiar'),
  ('COO-15', 'Plan de intervención individualizado (PII)',     'Planificación'),
  ('COO-16', 'Coordinación con equipo multidisciplinar',       'Coordinación'),
  ('COO-17', 'Intervención en conductas desafiantes',          'Intervención conductual'),
  ('COO-18', 'Apoyo en habilidades de vida diaria',            'Habilitación')
ON CONFLICT (code) DO NOTHING;

-- ── 2. Categorías diagnósticas ───────────────────────────────────
INSERT INTO diagnosis_categories (condition, type_label, age_group, cie_code, dsm_code) VALUES
  -- TEA
  ('TEA', 'Nivel 1 – Necesita apoyo',                    'Niños (3–12 años)',        'F84.0', '299.00'),
  ('TEA', 'Nivel 2 – Necesita apoyo sustancial',         'Niños (3–12 años)',        'F84.0', '299.00'),
  ('TEA', 'Nivel 3 – Necesita apoyo muy sustancial',     'Niños (3–12 años)',        'F84.0', '299.00'),
  ('TEA', 'Nivel 1 – Necesita apoyo',                    'Adolescentes (12–18 años)','F84.0', '299.00'),
  ('TEA', 'Nivel 2 – Necesita apoyo sustancial',         'Adolescentes (12–18 años)','F84.0', '299.00'),
  ('TEA', 'Nivel 1 – Necesita apoyo',                    'Adultos (18+ años)',       'F84.0', '299.00'),
  -- TDAH
  ('TDAH', 'Tipo Combinado',                             'Niños (6–12 años)',        'F90.0', '314.01'),
  ('TDAH', 'Tipo Inatento Predominante',                 'Niños (6–12 años)',        'F90.0', '314.00'),
  ('TDAH', 'Tipo Hiperactivo-Impulsivo Predominante',    'Niños (6–12 años)',        'F90.1', '314.01'),
  ('TDAH', 'Tipo Combinado',                             'Adolescentes (12–18 años)','F90.0', '314.01'),
  ('TDAH', 'Tipo Inatento Predominante',                 'Adolescentes (12–18 años)','F90.0', '314.00'),
  ('TDAH', 'Tipo Combinado',                             'Adultos (18+ años)',       'F90.0', '314.01'),
  ('TDAH', 'Tipo Inatento Predominante',                 'Adultos (18+ años)',       'F90.0', '314.00'),
  -- Discapacidad Intelectual
  ('DI', 'Leve (CI 50–70)',                              'Niños (3–12 años)',        'F70',   '317'),
  ('DI', 'Moderada (CI 35–49)',                          'Niños (3–12 años)',        'F71',   '318.0'),
  ('DI', 'Grave (CI 20–34)',                             'Niños (3–12 años)',        'F72',   '318.1'),
  ('DI', 'Leve (CI 50–70)',                              'Adolescentes (12–18 años)','F70',   '317'),
  ('DI', 'Moderada (CI 35–49)',                          'Adolescentes (12–18 años)','F71',   '318.0')
ON CONFLICT DO NOTHING;

-- ── 3. Registros clínicos de prueba (Juan Pérez Test / Dra. Ana García Test)
-- NOTA: los UUIDs de los usuarios se obtienen dinámicamente
DO $$
DECLARE
  v_paciente_id     uuid;
  v_especialista_id uuid;
  v_admin_id        uuid;

  v_appt_1 uuid := 'a0000001-cafe-4000-8000-000000000001';
  v_appt_2 uuid := 'a0000002-cafe-4000-8000-000000000002';
  v_appt_3 uuid := 'a0000003-cafe-4000-8000-000000000003';
  v_appt_4 uuid := 'a0000004-cafe-4000-8000-000000000004';
  v_appt_5 uuid := 'a0000005-cafe-4000-8000-000000000005';
BEGIN
  SELECT id INTO v_paciente_id     FROM profiles WHERE email = 'paciente.test@mentalabs.com';
  SELECT id INTO v_especialista_id FROM profiles WHERE email = 'especialista.test@mentalabs.com';
  SELECT id INTO v_admin_id        FROM profiles WHERE email = 'admin.test@mentalabs.com';

  IF v_paciente_id IS NULL OR v_especialista_id IS NULL THEN
    RAISE EXCEPTION 'Usuarios de prueba no encontrados. Ejecuta seed_auth.sql primero.';
  END IF;

  -- Asignación especialista → paciente
  INSERT INTO specialist_patient_assignments (specialist_id, patient_id, assigned_by, notes)
  VALUES (v_especialista_id, v_paciente_id, v_admin_id,
          'Asignación para evaluación y seguimiento de TDAH en adulto.')
  ON CONFLICT (patient_id, specialist_id) DO NOTHING;

  -- Citas
  INSERT INTO appointments (id, specialist_id, patient_id, start_time, end_time, status) VALUES
    (v_appt_1, v_especialista_id, v_paciente_id,
     NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days' + INTERVAL '1 hour', 'completed'),
    (v_appt_2, v_especialista_id, v_paciente_id,
     NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days' + INTERVAL '1 hour', 'completed'),
    (v_appt_3, v_especialista_id, v_paciente_id,
     NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days' + INTERVAL '1 hour', 'completed'),
    (v_appt_4, v_especialista_id, v_paciente_id,
     NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days' + INTERVAL '1 hour', 'completed'),
    (v_appt_5, v_especialista_id, v_paciente_id,
     NOW() + INTERVAL '7 days',  NOW() + INTERVAL '7 days'  + INTERVAL '1 hour', 'scheduled')
  ON CONFLICT (id) DO NOTHING;

  -- Registro #1 — Consulta inicial — FIRMADO
  INSERT INTO clinical_records (
    appointment_id, patient_id, specialist_id,
    consultation_reason, clinical_evolution, diagnostic_codes,
    treatment_plan, intervention_codes, observations, status, signed_at
  ) VALUES (
    v_appt_1, v_paciente_id, v_especialista_id,
    'Primera consulta de evaluación. Paciente refiere dificultades significativas en atención sostenida, impulsividad y desorganización desde la infancia con impacto en funcionamiento laboral y académico.',
    'Paciente de 25 años acude remitido por médico de cabecera. Refiere desde la infancia dificultades para mantener atención en tareas prolongadas, pérdida frecuente de objetos y problemas para seguir instrucciones complejas. Trabaja como técnico informático; los síntomas afectan su rendimiento. Sin antecedentes psiquiátricos. Niega consumo de sustancias e ideación autolítica. Se aplica ASRS-v1.1: puntuación 28/36, indicativa de alta probabilidad de TDAH. Exploración neurológica sin hallazgos. Buen contacto terapéutico establecido.',
    '["F90.0", "Z03.89"]'::jsonb,
    '1) Psicoeducación sobre TDAH en el adulto. 2) Entrenamiento en organización y gestión del tiempo. 3) TCC para regulación emocional e impulsividad. 4) Coordinación con psiquiatría. 5) Sesiones quincenales durante 3 meses.',
    '["COO-01", "COO-03", "COO-11"]'::jsonb,
    'Completar batería neuropsicológica antes de la segunda sesión. Se sugiere psicoeducación familiar.',
    'signed_and_locked', NOW() - INTERVAL '89 days'
  ) ON CONFLICT (appointment_id) DO NOTHING;

  -- Registro #2 — Seguimiento — FIRMADO
  INSERT INTO clinical_records (
    appointment_id, patient_id, specialist_id,
    consultation_reason, clinical_evolution, diagnostic_codes,
    treatment_plan, intervention_codes, observations, status, signed_at
  ) VALUES (
    v_appt_2, v_paciente_id, v_especialista_id,
    'Segunda sesión: revisión de estrategias de organización implementadas y seguimiento del plan terapéutico.',
    'Paciente asiste puntual. Reporta agenda digital y listas de tareas con mejora moderada. Aplica técnica Pomodoro con resultados positivos. Estado anímico eutímico. Se trabaja impulsividad mediante role-playing. Inicia metilfenidato 18 mg LP sin efectos adversos.',
    '["F90.0"]'::jsonb,
    'Continuar entrenamiento en autorregulación. Introducir mindfulness. Revisar respuesta farmacológica. Incorporar ejercicios de memoria de trabajo.',
    '["COO-05", "COO-08", "COO-11", "COO-12"]'::jsonb,
    'Leve mejoría en concentración matutina. Coordinar valoración psiquiátrica de seguimiento.',
    'signed_and_locked', NOW() - INTERVAL '59 days'
  ) ON CONFLICT (appointment_id) DO NOTHING;

  -- Registro #3 — Evaluación de progreso — FIRMADO
  INSERT INTO clinical_records (
    appointment_id, patient_id, specialist_id,
    consultation_reason, clinical_evolution, diagnostic_codes,
    treatment_plan, intervention_codes, observations, status, signed_at
  ) VALUES (
    v_appt_3, v_paciente_id, v_especialista_id,
    'Tercera sesión: evaluación formal de progreso tras 8 semanas de intervención y ajuste del plan terapéutico.',
    'Re-evaluación ASRS-v1.1: 19/36 (reducción desde 28). Mejora notable en organización. Metilfenidato 36 mg LP con buena tolerancia. Conflictos por impulsividad reducidos de 4–5 a 1–2 semanales. Sueño: 7 h/noche vs. 5 h previas. Mayor satisfacción laboral.',
    '["F90.0"]'::jsonb,
    'Espaciar a sesiones mensuales. Continuar mindfulness y resolución de problemas. Trabajo sobre autoestima vinculada al diagnóstico. Alta terapéutica prevista en 3–4 meses.',
    '["COO-05", "COO-06", "COO-09", "COO-15"]'::jsonb,
    'Progreso clínico muy favorable. Mantener medicación. Se informa sobre grupos de apoyo para adultos con TDAH.',
    'signed_and_locked', NOW() - INTERVAL '29 days'
  ) ON CONFLICT (appointment_id) DO NOTHING;

  -- Registro #4 — Reciente — BORRADOR
  INSERT INTO clinical_records (
    appointment_id, patient_id, specialist_id,
    consultation_reason, clinical_evolution, diagnostic_codes,
    treatment_plan, intervention_codes, observations, status
  ) VALUES (
    v_appt_4, v_paciente_id, v_especialista_id,
    'Cuarta sesión: revisión de fase de mantenimiento y planificación del alta terapéutica.',
    'Paciente mantiene logros. Semana de mayor estrés laboral con incremento transitorio de síntomas resuelto aplicando estrategias aprendidas de forma autónoma. Se trabaja prevención de recaídas.',
    '["F90.0"]'::jsonb,
    'Plan de mantenimiento post-alta. Revisiones cada 2 meses. Estrategias de forma autónoma.',
    '["COO-08", "COO-09", "COO-15"]'::jsonb,
    'Borrador pendiente de revisión y firma.',
    'draft'
  ) ON CONFLICT (appointment_id) DO NOTHING;

  RAISE NOTICE '✅ Registros clínicos de prueba creados correctamente.';
END $$;
