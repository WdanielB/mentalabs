-- ENUM para el estado de la historia clínica
CREATE TYPE clinical_record_status AS ENUM ('draft', 'signed_and_locked');

-- Tabla Principal del Acto Médico
CREATE TABLE clinical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    specialist_id UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
    consultation_reason TEXT,
    clinical_evolution TEXT,
    diagnostic_codes JSONB DEFAULT '[]'::jsonb,
    treatment_plan TEXT,
    status clinical_record_status DEFAULT 'draft' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    signed_at TIMESTAMPTZ
);

-- ========= RLS (Row Level Security) =========
ALTER TABLE clinical_records ENABLE ROW LEVEL SECURITY;

-- 1. Especialistas pueden crear (INSERT) los registros para sus propias citas
CREATE POLICY "Especialistas pueden crear registros" 
ON clinical_records FOR INSERT 
WITH CHECK (specialist_id = auth.uid());

-- 2. Especialistas pueden leer (SELECT) los registros que ellos crearon
CREATE POLICY "Especialistas pueden leer sus propios registros" 
ON clinical_records FOR SELECT 
USING (specialist_id = auth.uid());

-- 3. Especialistas pueden editar (UPDATE) SOLO SI el registro sigue en 'draft'
-- Si pasa a 'signed_and_locked', el USING fallará y bloqueará la edición silenciosamente.
CREATE POLICY "Especialistas pueden editar borradores" 
ON clinical_records FOR UPDATE 
USING (specialist_id = auth.uid() AND status = 'draft')
WITH CHECK (specialist_id = auth.uid());

-- 4. Pacientes pueden leer (SELECT) sus propios registros (la UI ocultará la evolución clínica)
CREATE POLICY "Pacientes pueden consultar su historial" 
ON clinical_records FOR SELECT 
USING (patient_id = auth.uid());
