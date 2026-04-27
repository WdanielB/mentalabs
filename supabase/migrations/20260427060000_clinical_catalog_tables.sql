-- Códigos de intervención psicológica
CREATE TABLE IF NOT EXISTS psychological_intervention_codes (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code     TEXT NOT NULL UNIQUE,
  name     TEXT NOT NULL,
  category TEXT NOT NULL
);

-- Categorías diagnósticas (TEA, TDAH, DI por edad y subtipo)
CREATE TABLE IF NOT EXISTS diagnosis_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condition  TEXT NOT NULL,
  type_label TEXT NOT NULL,
  age_group  TEXT NOT NULL,
  cie_code   TEXT,
  dsm_code   TEXT
);

-- RLS: solo lectura para autenticados
ALTER TABLE psychological_intervention_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_categories             ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_intervention_codes"
  ON psychological_intervention_codes FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read_diagnosis_categories"
  ON diagnosis_categories FOR SELECT TO authenticated USING (true);
