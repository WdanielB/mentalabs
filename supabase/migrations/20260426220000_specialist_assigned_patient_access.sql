-- Allow specialists to read assigned patients and their profile data

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'patients'
      AND policyname = 'patients_select_specialist_assignments'
  ) THEN
    CREATE POLICY "patients_select_specialist_assignments"
      ON patients FOR SELECT TO authenticated
      USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'especialista'
        AND EXISTS (
          SELECT 1
          FROM specialist_patient_assignments spa
          WHERE spa.patient_id = patients.id
            AND spa.specialist_id = auth.uid()
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'profiles_select_specialist_related_patients'
  ) THEN
    CREATE POLICY "profiles_select_specialist_related_patients"
      ON profiles FOR SELECT TO authenticated
      USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'especialista'
        AND EXISTS (
          SELECT 1
          FROM patients p
          WHERE p.id = profiles.id
            AND (
              EXISTS (
                SELECT 1
                FROM appointments a
                WHERE a.patient_id = p.id
                  AND a.specialist_id = auth.uid()
              )
              OR EXISTS (
                SELECT 1
                FROM exam_attempts ea
                WHERE ea.patient_id = p.id
                  AND ea.assigned_by = auth.uid()
              )
              OR EXISTS (
                SELECT 1
                FROM specialist_patient_assignments spa
                WHERE spa.patient_id = p.id
                  AND spa.specialist_id = auth.uid()
              )
            )
        )
      );
  END IF;
END
$$;
