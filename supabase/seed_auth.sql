-- ================================================================
-- MENTALABS: Seed de usuarios de prueba
-- Ejecuta esto en: Supabase Dashboard → SQL Editor → New query
-- ================================================================

DO $$
DECLARE
  v_paciente_id     uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
  v_especialista_id uuid := 'aaaaaaaa-0000-0000-0000-000000000002';
  v_tutor_id        uuid := 'aaaaaaaa-0000-0000-0000-000000000003';
  v_admin_id        uuid := 'aaaaaaaa-0000-0000-0000-000000000004';
BEGIN

  -- ── 1. Limpiar usuarios de prueba existentes ──────────────────
  DELETE FROM auth.identities
  WHERE provider_id IN (
    v_paciente_id::text, v_especialista_id::text,
    v_tutor_id::text,    v_admin_id::text
  );

  DELETE FROM auth.users
  WHERE email IN (
    'paciente.test@mentalabs.com',
    'especialista.test@mentalabs.com',
    'tutor.test@mentalabs.com',
    'admin.test@mentalabs.com'
  );

  -- ── 2. Crear usuarios en auth.users (email confirmado) ────────
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, role, aud
  ) VALUES
    (
      v_paciente_id, '00000000-0000-0000-0000-000000000000',
      'paciente.test@mentalabs.com',
      crypt('Mentalabs123!', gen_salt('bf')),
      NOW(), '{"provider":"email","providers":["email"],"role":"paciente"}', '{}',
      NOW(), NOW(), 'authenticated', 'authenticated'
    ),
    (
      v_especialista_id, '00000000-0000-0000-0000-000000000000',
      'especialista.test@mentalabs.com',
      crypt('Mentalabs123!', gen_salt('bf')),
      NOW(), '{"provider":"email","providers":["email"],"role":"especialista"}', '{}',
      NOW(), NOW(), 'authenticated', 'authenticated'
    ),
    (
      v_tutor_id, '00000000-0000-0000-0000-000000000000',
      'tutor.test@mentalabs.com',
      crypt('Mentalabs123!', gen_salt('bf')),
      NOW(), '{"provider":"email","providers":["email"],"role":"tutor"}', '{}',
      NOW(), NOW(), 'authenticated', 'authenticated'
    ),
    (
      v_admin_id, '00000000-0000-0000-0000-000000000000',
      'admin.test@mentalabs.com',
      crypt('Mentalabs123!', gen_salt('bf')),
      NOW(), '{"provider":"email","providers":["email"],"role":"admin"}', '{}',
      NOW(), NOW(), 'authenticated', 'authenticated'
    );

  -- ── 3. Crear identidades (requerido para login email/password) ─
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at, provider_id
  ) VALUES
    (
      v_paciente_id::text, v_paciente_id,
      jsonb_build_object('sub', v_paciente_id::text, 'email', 'paciente.test@mentalabs.com'),
      'email', NOW(), NOW(), NOW(), v_paciente_id::text
    ),
    (
      v_especialista_id::text, v_especialista_id,
      jsonb_build_object('sub', v_especialista_id::text, 'email', 'especialista.test@mentalabs.com'),
      'email', NOW(), NOW(), NOW(), v_especialista_id::text
    ),
    (
      v_tutor_id::text, v_tutor_id,
      jsonb_build_object('sub', v_tutor_id::text, 'email', 'tutor.test@mentalabs.com'),
      'email', NOW(), NOW(), NOW(), v_tutor_id::text
    ),
    (
      v_admin_id::text, v_admin_id,
      jsonb_build_object('sub', v_admin_id::text, 'email', 'admin.test@mentalabs.com'),
      'email', NOW(), NOW(), NOW(), v_admin_id::text
    );

  -- ── 4. Crear / actualizar perfiles ────────────────────────────
  INSERT INTO profiles (id, role, email, full_name, birth_date)
  VALUES
    (v_paciente_id,     'paciente',     'paciente.test@mentalabs.com',     'Juan Pérez (Test)',        '2000-05-14'),
    (v_especialista_id, 'especialista', 'especialista.test@mentalabs.com', 'Dra. Ana García (Test)',   '1985-03-20'),
    (v_tutor_id,        'tutor',        'tutor.test@mentalabs.com',        'María López (Test)',       '1975-11-02'),
    (v_admin_id,        'admin',        'admin.test@mentalabs.com',        'Admin MentaLabs',          '1990-01-01')
  ON CONFLICT (id) DO UPDATE SET
    role      = EXCLUDED.role,
    email     = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

  -- ── 5. Tabla patients ─────────────────────────────────────────
  INSERT INTO patients (id, status, clinical_history_summary)
  VALUES (v_paciente_id, 'active', 'Paciente de prueba — TDAH con evaluación pendiente.')
  ON CONFLICT (id) DO NOTHING;

  -- ── 6. Tabla specialists ──────────────────────────────────────
  INSERT INTO specialists (id, specialty, bio, rating, hourly_rate)
  VALUES (v_especialista_id, 'Psicología Clínica', 'Especialista de prueba en neurodivergencias.', 4.9, 80.00)
  ON CONFLICT (id) DO NOTHING;

  -- ── 7. Vincular tutor → paciente ─────────────────────────────
  INSERT INTO tutor_patient_links (tutor_id, patient_id)
  VALUES (v_tutor_id, v_paciente_id)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Usuarios de prueba creados correctamente.';
END $$;
