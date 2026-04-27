ALTER TABLE clinical_records
  ADD COLUMN IF NOT EXISTS intervention_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS observations TEXT;
