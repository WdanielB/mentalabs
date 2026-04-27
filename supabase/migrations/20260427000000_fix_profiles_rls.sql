-- Fix login redirect loop: add self-read RLS policies
-- Root cause: no policy allowed any user to SELECT their own
-- profile row, causing the login → /dashboard → /login loop.

-- ── 1. profiles ──────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'profiles_read_own'
  ) THEN
    CREATE POLICY "profiles_read_own"
      ON profiles FOR SELECT TO authenticated
      USING (id = auth.uid());
  END IF;
END $$;

-- ── 2. patients ───────────────────────────────────────────────
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patients'
      AND policyname = 'patients_read_own'
  ) THEN
    CREATE POLICY "patients_read_own"
      ON patients FOR SELECT TO authenticated
      USING (id = auth.uid());
  END IF;
END $$;

-- ── 3. specialists ────────────────────────────────────────────
ALTER TABLE specialists ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'specialists'
      AND policyname = 'specialists_read_own'
  ) THEN
    CREATE POLICY "specialists_read_own"
      ON specialists FOR SELECT TO authenticated
      USING (id = auth.uid());
  END IF;
END $$;

-- updateSpecialistFocusAreas() usa createClient() (no admin) → necesita UPDATE policy
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'specialists'
      AND policyname = 'specialists_update_own'
  ) THEN
    CREATE POLICY "specialists_update_own"
      ON specialists FOR UPDATE TO authenticated
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- ── 4. appointments ───────────────────────────────────────────
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'appointments'
      AND policyname = 'appointments_read_as_specialist'
  ) THEN
    CREATE POLICY "appointments_read_as_specialist"
      ON appointments FOR SELECT TO authenticated
      USING (specialist_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'appointments'
      AND policyname = 'appointments_read_as_patient'
  ) THEN
    CREATE POLICY "appointments_read_as_patient"
      ON appointments FOR SELECT TO authenticated
      USING (patient_id = auth.uid());
  END IF;
END $$;
