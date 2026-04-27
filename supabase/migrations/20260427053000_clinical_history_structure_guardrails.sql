-- Guardrails for clinical history module and specialist auxiliary panel access.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'clinical_record_status'
  ) THEN
    CREATE TYPE clinical_record_status AS ENUM ('draft', 'signed_and_locked');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS clinical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  consultation_reason TEXT,
  clinical_evolution TEXT,
  diagnostic_codes JSONB DEFAULT '[]'::jsonb,
  treatment_plan TEXT,
  status clinical_record_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  signed_at TIMESTAMPTZ,
  intervention_codes JSONB DEFAULT '[]'::jsonb,
  observations TEXT
);

ALTER TABLE clinical_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'clinical_records'
      AND policyname = 'Especialistas pueden crear registros'
  ) THEN
    CREATE POLICY "Especialistas pueden crear registros"
      ON clinical_records FOR INSERT
      WITH CHECK (specialist_id = auth.uid());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'clinical_records'
      AND policyname = 'Especialistas pueden leer sus propios registros'
  ) THEN
    CREATE POLICY "Especialistas pueden leer sus propios registros"
      ON clinical_records FOR SELECT
      USING (specialist_id = auth.uid());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'clinical_records'
      AND policyname = 'Especialistas pueden editar borradores'
  ) THEN
    CREATE POLICY "Especialistas pueden editar borradores"
      ON clinical_records FOR UPDATE
      USING (specialist_id = auth.uid() AND status = 'draft')
      WITH CHECK (specialist_id = auth.uid());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'clinical_records'
      AND policyname = 'Pacientes pueden consultar su historial'
  ) THEN
    CREATE POLICY "Pacientes pueden consultar su historial"
      ON clinical_records FOR SELECT
      USING (patient_id = auth.uid());
  END IF;
END
$$;

-- Allow specialists to read interactive sessions from related patients.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'interactive_sessions'
      AND policyname = 'interactive_sessions_select_specialist_related'
  ) THEN
    CREATE POLICY "interactive_sessions_select_specialist_related"
      ON interactive_sessions FOR SELECT TO authenticated
      USING (
        has_role('especialista')
        AND (
          EXISTS (
            SELECT 1
            FROM specialist_patient_assignments spa
            WHERE spa.specialist_id = auth.uid()
              AND spa.patient_id = interactive_sessions.patient_id
          )
          OR EXISTS (
            SELECT 1
            FROM appointments a
            WHERE a.specialist_id = auth.uid()
              AND a.patient_id = interactive_sessions.patient_id
          )
          OR EXISTS (
            SELECT 1
            FROM exam_attempts ea
            WHERE ea.assigned_by = auth.uid()
              AND ea.patient_id = interactive_sessions.patient_id
          )
        )
      );
  END IF;
END
$$;
