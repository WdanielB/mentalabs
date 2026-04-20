-- ENUMs
CREATE TYPE user_role AS ENUM ('paciente', 'especialista', 'tutor', 'admin');
CREATE TYPE patient_status AS ENUM ('active', 'inactive', 'in_treatment');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'cancelled', 'completed');
CREATE TYPE exam_status AS ENUM ('pending', 'in_progress', 'completed');

-- Tabla Base: profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    birth_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extensión: patients
CREATE TABLE patients (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    status patient_status DEFAULT 'active',
    clinical_history_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extensión: specialists
CREATE TABLE specialists (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    specialty TEXT NOT NULL,
    bio TEXT,
    rating DECIMAL(3,2) DEFAULT 0.00,
    hourly_rate NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tutoría: tutor_patient_links
CREATE TABLE tutor_patient_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tutor_id, patient_id)
);

-- Citas: appointments
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    specialist_id UUID REFERENCES specialists(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status appointment_status DEFAULT 'scheduled',
    meeting_link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Definición de Pruebas: exams
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES specialists(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Preguntas de Exámenes: questions
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    options JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Motor de Reglas: diagnostic_rules
CREATE TABLE diagnostic_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    min_score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    min_age INTEGER,
    max_age INTEGER,
    subcategory TEXT NOT NULL,
    recommendations JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asignaciones: exam_attempts
CREATE TABLE exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES specialists(id) ON DELETE SET NULL,
    status exam_status DEFAULT 'pending',
    total_score INTEGER DEFAULT 0,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Respuestas de Pacientes: attempt_answers
CREATE TABLE attempt_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES exam_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    selected_score INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(attempt_id, question_id)
);

-- Resultados Fotográficos: diagnostics
CREATE TABLE diagnostics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES exam_attempts(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES diagnostic_rules(id) ON DELETE SET NULL,
    generated_subcategory TEXT NOT NULL,
    recommendations JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Juegos/Ejercicios: interactive_sessions
CREATE TABLE interactive_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    game_type TEXT NOT NULL,
    metrics JSONB NOT NULL,
    session_start TIMESTAMPTZ NOT NULL,
    session_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);