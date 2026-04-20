-- Este archivo de SEED inserta datos de prueba ("test")
-- Insertamos 1 Paciente, 1 Especialista y 1 Tutor.
-- Nota: En un entorno de Supabase Real se necesitan usuarios de auth.users primero,
-- por simplicidad de semilla los inyectamos en perfiles para esta DB local.

INSERT INTO "profiles" ("id", "role", "email", "full_name", "birth_date")
VALUES
  ('11111111-1111-1111-1111-111111111111', 'paciente', 'paciente.test@mentalabs.com', 'Juan Perez Test', '2010-05-14'),
  ('22222222-2222-2222-2222-222222222222', 'especialista', 'doc.test@mentalabs.com', 'Dr. Roberto Especialista Test', '1980-01-20'),
  ('33333333-3333-3333-3333-333333333333', 'tutor', 'tutor.test@mentalabs.com', 'Maria Tutor Test', '1975-11-02');

INSERT INTO "patients" ("id", "status", "clinical_history_summary")
VALUES
  ('11111111-1111-1111-1111-111111111111', 'active', 'Paciente con trastorno atencional diagnosticado');

INSERT INTO "specialists" ("id", "specialty", "bio", "rating", "hourly_rate")
VALUES
  ('22222222-2222-2222-2222-222222222222', 'Psicología Infantil', 'Especialista en desarrollo infantil.', 4.8, 60.00);

INSERT INTO "tutor_patient_links" ("tutor_id", "patient_id")
VALUES
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111');

-- Creación de un Examen de Prueba
INSERT INTO "exams" ("id", "title", "description", "created_by", "is_published")
VALUES
  ('44444444-4444-4444-4444-444444444444', 'Test de Ansiedad Temprana (Test)', 'Prueba diagnóstica básica.', '22222222-2222-2222-2222-222222222222', true);

INSERT INTO "questions" ("exam_id", "order_index", "content", "options")
VALUES
  ('44444444-4444-4444-4444-444444444444', 1, '¿Cuántas veces al día te sientes inquieto? Test', '[{"text":"Nunca", "score":0}, {"text":"Siempre", "score":1}]');

INSERT INTO "diagnostic_rules" ("exam_id", "min_score", "max_score", "min_age", "max_age", "subcategory", "recommendations")
VALUES
  ('44444444-4444-4444-4444-444444444444', 0, 10, 5, 99, 'Ansiedad Leve', '["Meditar", "Charlar"]');

-- Asignación del Examen
INSERT INTO "exam_attempts" ("patient_id", "exam_id", "assigned_by", "status")
VALUES
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'pending');
