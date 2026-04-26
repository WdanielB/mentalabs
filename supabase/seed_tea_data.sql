-- ==========================================
-- SCRIPT DE SEMILLA PARA DIAGNÓSTICO DE TEA
-- (Trastorno del Espectro Autista)
-- Para ser ejecutado en el entorno de desarrollo
-- ==========================================

-- Primero nos aseguramos de que haya citas y un clinical_record asociado
DO $$
DECLARE
  v_paciente_id     uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
  v_especialista_id uuid := 'aaaaaaaa-0000-0000-0000-000000000002';
  v_cita_1_id       uuid := 'bbbbbbbb-0000-0000-0000-000000000001';
  v_cita_2_id       uuid := 'bbbbbbbb-0000-0000-0000-000000000002';
  v_record_1_id     uuid := 'cccccccc-0000-0000-0000-000000000001';
  v_record_2_id     uuid := 'cccccccc-0000-0000-0000-000000000002';
BEGIN

  -- 1. Actualizar el perfil del paciente con historial de TEA si existe
  UPDATE patients 
  SET clinical_history_summary = 'Paciente derivado del entorno escolar por presentar dificultades en la socialización, evitación del contacto visual y patrones de juego repetitivo. Sospecha de Trastorno del Espectro Autista (TEA).'
  WHERE id = v_paciente_id;
  
  -- Para asegurar que funcione, si los ids del seed anterior son los '11111111...' en vez de los 'aaaaaaaa...'
  UPDATE patients 
  SET clinical_history_summary = 'Paciente derivado del entorno escolar por presentar dificultades en la socialización, evitación del contacto visual y patrones de juego repetitivo. Sospecha de Trastorno del Espectro Autista (TEA).'
  WHERE id = '11111111-1111-1111-1111-111111111111';

  -- Si el seed_auth no se ha corrido pero sí el de seed.sql, usaremos los IDs de seed.sql:
  v_paciente_id := '11111111-1111-1111-1111-111111111111';
  v_especialista_id := '22222222-2222-2222-2222-222222222222';

  -- 2. Crear Citas (Appointments) previas y actuales para el historial
  
  -- Cita 1: Evaluación Inicial (Pasada)
  INSERT INTO appointments (id, specialist_id, patient_id, start_time, end_time)
  VALUES (
    v_cita_1_id, 
    v_especialista_id, 
    v_paciente_id, 
    NOW() - INTERVAL '30 days', 
    NOW() - INTERVAL '30 days' + INTERVAL '1 hour'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Cita 2: Devolución de Resultados / Entrega de Diagnóstico (Actual/Reciente)
  INSERT INTO appointments (id, specialist_id, patient_id, start_time, end_time)
  VALUES (
    v_cita_2_id, 
    v_especialista_id, 
    v_paciente_id, 
    NOW() - INTERVAL '2 days', 
    NOW() - INTERVAL '2 days' + INTERVAL '1 hour'
  )
  ON CONFLICT (id) DO NOTHING;

  -- 3. Crear Historial Clínico (Clinical Records)
  
  -- Recórd Cita 1 (Firmado y cerrado)
  INSERT INTO clinical_records (
    id, appointment_id, patient_id, specialist_id,
    consultation_reason, clinical_evolution, diagnostic_codes,
    treatment_plan, status, signed_at, created_at
  ) VALUES (
    v_record_1_id, v_cita_1_id, v_paciente_id, v_especialista_id,
    'Derivación del colegio por comportamiento aislado e intereses restringidos. Padres reportan retraso en la adquisición del lenguaje expresivo y aleteo de manos bajo estrés.',
    'Se realiza entrevista inicial con los padres. El paciente muestra poco interés en la interacción social, pobre contacto visual y fijación por alinear juguetes. Se aplica ADI-R y se cita para evaluación con ADOS-2.',
    '["R62.0"]'::jsonb, -- Retraso en el desarrollo
    '1. Aplicar ADOS-2 (Módulo 2). 2. Evaluación fonoaudiológica. 3. Cita de revisión en un mes.',
    'signed_and_locked', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Récord Cita 2 (Borrador de la sesión de diagnóstico TEA)
  INSERT INTO clinical_records (
    id, appointment_id, patient_id, specialist_id,
    consultation_reason, clinical_evolution, diagnostic_codes,
    treatment_plan, status, created_at
  ) VALUES (
    v_record_2_id, v_cita_2_id, v_paciente_id, v_especialista_id,
    'Sesión de devolución de resultados y planteamiento del perfil diagnóstico (Sospecha de TEA confirmada).',
    'Se analizan los resultados del ADOS-2 (Puntuación de afectación social: 12, Puntuación de comportamientos restringidos: 6. Total: 18 - Clasificación: Autismo). El paciente cumple con los criterios DSM-V para Trastorno del Espectro Autista nivel 1, requiriendo apoyo. Los padres asimilan la información con preocupación pero receptivos. Se explica el enfoque neuroafirmativo.',
    '["F84.0", "F80.1", "F82"]'::jsonb, -- F84.0: Autismo de la niñez, F80.x: Trastornos de lenguaje
    '1. Inicio de terapia cognitivo-conductual (2 veces por semana) enfocada en flexibilidad cognitiva.
2. Integración al programa de Habilidades Sociales con simuladores interactivos MentaLabs.
3. Derivación formal a Terapia Ocupacional para integración sensorial.
4. Entrega de informe escolar con sugerencias de adaptaciones curriculares.',
    'draft', NOW() - INTERVAL '2 days'
  )
  ON CONFLICT (id) DO NOTHING;

END $$;
