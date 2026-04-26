-- ── Admin features: specialist approval, assignments, schedules ────────────

-- Specialist approval status (existing specialists stay 'active')
ALTER TABLE specialists
  ADD COLUMN IF NOT EXISTS status TEXT
    CHECK (status IN ('pending', 'active', 'suspended'))
    NOT NULL DEFAULT 'active';

-- Specialist ↔ patient assignments (managed by admin)
CREATE TABLE specialist_patient_assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  patient_id    UUID NOT NULL REFERENCES patients(id)   ON DELETE CASCADE,
  assigned_by   UUID NOT NULL REFERENCES profiles(id),
  assigned_at   TIMESTAMPTZ DEFAULT NOW(),
  notes         TEXT,
  UNIQUE(patient_id, specialist_id)
);

-- Assignment requests (patient/tutor requests a specific specialist)
CREATE TABLE assignment_requests (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id              UUID NOT NULL REFERENCES patients(id)   ON DELETE CASCADE,
  requested_specialist_id UUID          REFERENCES specialists(id),
  requested_by            UUID NOT NULL REFERENCES profiles(id),
  patient_notes           TEXT,
  status                  TEXT CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  admin_notes             TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at             TIMESTAMPTZ,
  reviewed_by             UUID REFERENCES profiles(id)
);

-- Specialist weekly availability (they set their own hours)
CREATE TABLE specialist_schedules (
  id            UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID     NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  day_of_week   SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    TIME     NOT NULL,
  end_time      TIME     NOT NULL,
  is_active     BOOLEAN  DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(specialist_id, day_of_week, start_time)
);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE specialist_patient_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_requests            ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialist_schedules           ENABLE ROW LEVEL SECURITY;

-- Admin: full access to all tables
CREATE POLICY "admin_all_assignments"
  ON specialist_patient_assignments FOR ALL TO authenticated
  USING  ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "admin_all_requests"
  ON assignment_requests FOR ALL TO authenticated
  USING  ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Patients/tutors: create and read their own requests
CREATE POLICY "patient_insert_request"
  ON assignment_requests FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "patient_read_own_requests"
  ON assignment_requests FOR SELECT TO authenticated
  USING (requested_by = auth.uid() OR patient_id = auth.uid());

-- Specialists: full CRUD on their own schedule
CREATE POLICY "specialist_own_schedule"
  ON specialist_schedules FOR ALL TO authenticated
  USING  (specialist_id = auth.uid())
  WITH CHECK (specialist_id = auth.uid());

-- All authenticated users can read schedules (for appointment booking)
CREATE POLICY "read_all_schedules"
  ON specialist_schedules FOR SELECT TO authenticated
  USING (true);
