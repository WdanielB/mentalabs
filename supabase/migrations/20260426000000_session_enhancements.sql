-- ============================================================
-- SESSION ENHANCEMENTS MIGRATION
-- Adds intervention codes, observations, and diagnostic categories
-- ============================================================

-- 1. Extend clinical_records with new SS format fields
ALTER TABLE clinical_records
  ADD COLUMN IF NOT EXISTS intervention_codes JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS observations TEXT;

-- 2. Psychological intervention codes catalog (internal MentaLabs codes)
CREATE TABLE IF NOT EXISTS psychological_intervention_codes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code       TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT 'Psicoterapia',
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO psychological_intervention_codes (code, name, category) VALUES
  ('COO150', 'Terapia Cognitiva Conductual (TCC)',       'Psicoterapia'),
  ('COO151', 'Terapia de Juego',                         'Psicoterapia'),
  ('COO152', 'Terapia Familiar',                         'Psicoterapia'),
  ('COO153', 'Entrenamiento en Habilidades Sociales',    'Intervención'),
  ('COO154', 'Intervención Conductual Intensiva (ABA)',  'Intervención'),
  ('COO155', 'Entrenamiento a Padres / Cuidadores',      'Psicoeducación'),
  ('COO156', 'Terapia Ocupacional',                      'Habilitación'),
  ('COO157', 'Fonoaudiología / Terapia del Lenguaje',    'Habilitación'),
  ('COO158', 'Neurofeedback',                            'Intervención'),
  ('COO159', 'Mindfulness y Regulación Emocional',       'Psicoterapia'),
  ('COO160', 'Psicoeducación al Paciente',               'Psicoeducación'),
  ('COO161', 'Evaluación Psicométrica',                  'Evaluación'),
  ('COO162', 'Planificación de Tratamiento',             'Evaluación')
ON CONFLICT (code) DO NOTHING;

-- 3. Diagnosis categories: TEA / TDAH / DI with types and age groups
CREATE TABLE IF NOT EXISTS diagnosis_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condition  TEXT NOT NULL,   -- TEA | TDAH | DI
  type_label TEXT NOT NULL,   -- e.g. Nivel 1 (T1), Hiperactivo, Leve
  age_group  TEXT NOT NULL,   -- 0-6 | 6-12 | 12-17 | 18+
  cie_code   TEXT,
  dsm_code   TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (condition, type_label, age_group)
);

INSERT INTO diagnosis_categories (condition, type_label, age_group, cie_code, dsm_code) VALUES
  -- TEA × 3 tipos × 4 grupos de edad
  ('TEA', 'Nivel 1 (T1)', '0-6',   'F84.0', '299.00'),
  ('TEA', 'Nivel 1 (T1)', '6-12',  'F84.0', '299.00'),
  ('TEA', 'Nivel 1 (T1)', '12-17', 'F84.0', '299.00'),
  ('TEA', 'Nivel 1 (T1)', '18+',   'F84.0', '299.00'),
  ('TEA', 'Nivel 2 (T2)', '0-6',   'F84.0', '299.00'),
  ('TEA', 'Nivel 2 (T2)', '6-12',  'F84.0', '299.00'),
  ('TEA', 'Nivel 2 (T2)', '12-17', 'F84.0', '299.00'),
  ('TEA', 'Nivel 2 (T2)', '18+',   'F84.0', '299.00'),
  ('TEA', 'Nivel 3 (T3)', '0-6',   'F84.0', '299.00'),
  ('TEA', 'Nivel 3 (T3)', '6-12',  'F84.0', '299.00'),
  ('TEA', 'Nivel 3 (T3)', '12-17', 'F84.0', '299.00'),
  ('TEA', 'Nivel 3 (T3)', '18+',   'F84.0', '299.00'),
  -- TDAH × 3 tipos × 4 grupos de edad
  ('TDAH', 'Predominio Hiperactivo-Impulsivo', '0-6',   'F90.1', '314.01'),
  ('TDAH', 'Predominio Hiperactivo-Impulsivo', '6-12',  'F90.1', '314.01'),
  ('TDAH', 'Predominio Hiperactivo-Impulsivo', '12-17', 'F90.1', '314.01'),
  ('TDAH', 'Predominio Hiperactivo-Impulsivo', '18+',   'F90.1', '314.01'),
  ('TDAH', 'Predominio Déficit de Atención',   '0-6',   'F90.0', '314.00'),
  ('TDAH', 'Predominio Déficit de Atención',   '6-12',  'F90.0', '314.00'),
  ('TDAH', 'Predominio Déficit de Atención',   '12-17', 'F90.0', '314.00'),
  ('TDAH', 'Predominio Déficit de Atención',   '18+',   'F90.0', '314.00'),
  ('TDAH', 'Tipo Mixto (Combinado)',            '0-6',   'F90.2', '314.01'),
  ('TDAH', 'Tipo Mixto (Combinado)',            '6-12',  'F90.2', '314.01'),
  ('TDAH', 'Tipo Mixto (Combinado)',            '12-17', 'F90.2', '314.01'),
  ('TDAH', 'Tipo Mixto (Combinado)',            '18+',   'F90.2', '314.01'),
  -- DI × 3 tipos × 4 grupos de edad
  ('DI', 'Leve',     '0-6',   'F70', '319'),
  ('DI', 'Leve',     '6-12',  'F70', '319'),
  ('DI', 'Leve',     '12-17', 'F70', '319'),
  ('DI', 'Leve',     '18+',   'F70', '319'),
  ('DI', 'Moderada', '0-6',   'F71', '319'),
  ('DI', 'Moderada', '6-12',  'F71', '319'),
  ('DI', 'Moderada', '12-17', 'F71', '319'),
  ('DI', 'Moderada', '18+',   'F71', '319'),
  ('DI', 'Grave',    '0-6',   'F72', '319'),
  ('DI', 'Grave',    '6-12',  'F72', '319'),
  ('DI', 'Grave',    '12-17', 'F72', '319'),
  ('DI', 'Grave',    '18+',   'F72', '319')
ON CONFLICT (condition, type_label, age_group) DO NOTHING;

-- 4. RLS for new tables (public read for specialists/authenticated users)
ALTER TABLE psychological_intervention_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read intervention codes"
  ON psychological_intervention_codes FOR SELECT
  TO authenticated USING (true);

ALTER TABLE diagnosis_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read diagnosis categories"
  ON diagnosis_categories FOR SELECT
  TO authenticated USING (true);
