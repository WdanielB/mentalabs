-- Fix RLS infinite recursion between profiles and specialist assignments policies.
-- Root cause: admin policies queried profiles directly, which re-entered profiles RLS
-- that itself checks specialist_patient_assignments.

DROP POLICY IF EXISTS "admin_all_assignments" ON specialist_patient_assignments;
CREATE POLICY "admin_all_assignments"
  ON specialist_patient_assignments FOR ALL TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS "admin_all_requests" ON assignment_requests;
CREATE POLICY "admin_all_requests"
  ON assignment_requests FOR ALL TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));
