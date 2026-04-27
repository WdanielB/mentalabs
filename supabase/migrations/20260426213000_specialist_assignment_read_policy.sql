-- Allow specialists to read their own patient assignments
CREATE POLICY "specialist_read_own_assignments"
  ON specialist_patient_assignments FOR SELECT TO authenticated
  USING (specialist_id = auth.uid());
