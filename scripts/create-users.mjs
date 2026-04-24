import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mnqbglyoeqkhzgzysnrx.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ucWJnbHlvZXFraHpnenlzbnJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY1NTI0OCwiZXhwIjoyMDkyMjMxMjQ4fQ.gH4qArNrycp3g_gJ1l6vQpvU6F1_I3O91kGWBY8YdMk'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const USERS = [
  { email: 'paciente.test@mentalabs.com',     password: 'Mentalabs123!', role: 'paciente',     full_name: 'Juan Pérez (Test)',        birth_date: '2000-05-14' },
  { email: 'especialista.test@mentalabs.com', password: 'Mentalabs123!', role: 'especialista', full_name: 'Dra. Ana García (Test)',    birth_date: '1985-03-20' },
  { email: 'tutor.test@mentalabs.com',        password: 'Mentalabs123!', role: 'tutor',        full_name: 'María López (Test)',        birth_date: '1975-11-02' },
  { email: 'admin.test@mentalabs.com',        password: 'Mentalabs123!', role: 'admin',        full_name: 'Admin MentaLabs',          birth_date: '1990-01-01' },
]

async function main() {
  const ids = {}

  // ── 1. Crear usuarios en auth ────────────────────────────────
  for (const u of USERS) {
    // Check if already exists
    const { data: list } = await supabase.auth.admin.listUsers()
    const existing = list?.users?.find(x => x.email === u.email)

    if (existing) {
      console.log(`ℹ️  Ya existe: ${u.email}  (${existing.id})`)
      ids[u.email] = existing.id
      continue
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    })

    if (error) {
      console.error(`❌ Error creando ${u.email}:`, error.message)
      continue
    }

    ids[u.email] = data.user.id
    console.log(`✅ Auth creado: ${u.email}  (${data.user.id})`)
  }

  // ── 2. Crear / actualizar profiles ──────────────────────────
  for (const u of USERS) {
    const id = ids[u.email]
    if (!id) continue

    const { error } = await supabase.from('profiles').upsert({
      id,
      role:       u.role,
      email:      u.email,
      full_name:  u.full_name,
      birth_date: u.birth_date,
    }, { onConflict: 'id' })

    if (error) console.error(`❌ Profile ${u.email}:`, error.message)
    else        console.log(`✅ Profile: ${u.email}  rol=${u.role}`)
  }

  // ── 3. patients ──────────────────────────────────────────────
  const pacienteId = ids['paciente.test@mentalabs.com']
  if (pacienteId) {
    const { error } = await supabase.from('patients').upsert({
      id: pacienteId,
      status: 'active',
      clinical_history_summary: 'Paciente de prueba — evaluación pendiente.',
    }, { onConflict: 'id' })
    if (error) console.error('❌ patients:', error.message)
    else        console.log('✅ patients: creado')
  }

  // ── 4. specialists ───────────────────────────────────────────
  const especialistaId = ids['especialista.test@mentalabs.com']
  if (especialistaId) {
    const { error } = await supabase.from('specialists').upsert({
      id:          especialistaId,
      specialty:   'Psicología Clínica',
      bio:         'Especialista de prueba en neurodivergencias.',
      rating:      4.9,
      hourly_rate: 80.00,
    }, { onConflict: 'id' })
    if (error) console.error('❌ specialists:', error.message)
    else        console.log('✅ specialists: creado')
  }

  // ── 5. tutor_patient_links ───────────────────────────────────
  const tutorId = ids['tutor.test@mentalabs.com']
  if (tutorId && pacienteId) {
    const { error } = await supabase.from('tutor_patient_links').upsert({
      tutor_id:   tutorId,
      patient_id: pacienteId,
    }, { onConflict: 'tutor_id,patient_id', ignoreDuplicates: true })
    if (error) console.error('❌ tutor_patient_links:', error.message)
    else        console.log('✅ tutor_patient_links: vinculado')
  }

  console.log('\n🎉 Listo. Credenciales para testear:')
  console.log('   paciente.test@mentalabs.com     → Mentalabs123!')
  console.log('   especialista.test@mentalabs.com → Mentalabs123!')
  console.log('   tutor.test@mentalabs.com        → Mentalabs123!')
  console.log('   admin.test@mentalabs.com        → Mentalabs123!')
}

main().catch(console.error)
