-- Diary entries for patients (visible to their specialist as part of session reports)
CREATE TABLE diary_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  mood        TEXT CHECK (mood IN ('bien', 'regular', 'mal')) DEFAULT 'regular',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

-- Patients manage their own entries
CREATE POLICY "diary_patient_all"
  ON diary_entries
  FOR ALL
  TO authenticated
  USING  (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid());

-- Specialists can read entries for their patients
CREATE POLICY "diary_specialist_read"
  ON diary_entries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.patient_id   = diary_entries.patient_id
        AND a.specialist_id = auth.uid()
    )
  );
