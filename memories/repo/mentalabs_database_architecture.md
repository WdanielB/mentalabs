# Arquitectura de Base de Datos MentaLabs (Supabase / PostgreSQL) - Versión Unificada

Este documento define la estructura de base de datos definitiva para MentaLabs. Combina el modelo estricto de roles (RBAC) y tutorías, con un motor robusto de exámenes, reglas diagnósticas y juegos de terapia ocupacional.

**Decisiones de Diseño (Tradeoffs):**
1. **Herencia 1 a 1 para Perfiles:** Usamos `profiles` como tabla central vinculada a `auth.users`, y extendemos con `patients` y `specialists` para evitar columnas nulas innecesarias.
2. **Híbrido Relacional/JSONB:** Las preguntas se normalizan en tablas para poder cruzar puntajes en SQL, pero sus opciones de respuesta y métricas de juegos van en `JSONB` para máxima flexibilidad ("No-Code").
3. **No CMS Landing:** El contenido del landing es estático en el frontend (Next.js).

---

## 👥 1. Autenticación, Perfiles y Relaciones

### `profiles` (Tabla Base)
- `id`: uuid (PK, FK -> auth.users.id)
- `role`: enum ('paciente', 'especialista', 'tutor', 'admin')
- `email`: text (Unique)
- `full_name`: text
- `birth_date`: date (Crucial para el motor lógico de edades)
- `created_at`: timestamptz

### `patients` (Extensión de Paciente)
- `id`: uuid (PK, FK -> profiles.id)
- `status`: enum ('active', 'inactive', 'in_treatment')
- `clinical_history_summary`: text

### `specialists` (Extensión de Especialista / Marketplace)
- `id`: uuid (PK, FK -> profiles.id)
- `specialty`: text
- `bio`: text
- `rating`: decimal (Puntuación)
- `hourly_rate`: numeric

### `tutor_patient_links` (Relación para menores)
- `id`: uuid (PK)
- `tutor_id`: uuid (FK -> profiles.id, role='tutor')
- `patient_id`: uuid (FK -> profiles.id, role='paciente')
- `created_at`: timestamptz

---

## 📅 2. Gestión de Agenda Médica

### `appointments` (Citas)
- `id`: uuid (PK)
- `specialist_id`: uuid (FK -> specialists.id)
- `patient_id`: uuid (FK -> patients.id)
- `start_time`: timestamptz
- `end_time`: timestamptz
- `status`: enum ('scheduled', 'confirmed', 'cancelled', 'completed')
- `meeting_link`: text (URL para videollamadas futuras)

---

## 📝 3. Constructor de Exámenes (No-Code Editor)

### `exams` (Definición de la Prueba Maestro)
- `id`: uuid (PK)
- `title`: text (Ej. "PHQ-9", "Test de Ansiedad")
- `description`: text
- `created_by`: uuid (FK -> specialists.id)
- `is_published`: boolean
- `created_at`: timestamptz

### `questions` (Preguntas del Examen)
- `id`: uuid (PK)
- `exam_id`: uuid (FK -> exams.id)
- `order_index`: integer
- `content`: text (Ej. "¿Con qué frecuencia se siente triste?")
- `options`: jsonb (Ej. `[{"text": "Nunca", "score": 0}, {"text": "Siempre", "score": 3}]`)

---

## ⚙️ 4. Motor de Reglas Diagnósticas

Configurado por el especialista/admin para generar diagnósticos automáticos según el puntaje final y la edad del paciente.

### `diagnostic_rules`
- `id`: uuid (PK)
- `exam_id`: uuid (FK -> exams.id)
- `min_score`: integer
- `max_score`: integer
- `min_age`: integer (Edad mínima aplicable)
- `max_age`: integer (Edad máxima aplicable)
- `subcategory`: text (Ej. "Depresión Moderada")
- `recommendations`: jsonb (Array de strings: `["Terapia Cognitiva", "Reevaluar en 2 semanas"]`)

---

## 📊 5. Asignación, Ejecución y Diagnóstico de Pacientes

### `exam_attempts` (Sesión / Asignación del Examen)
Actúa como puente de asignación y registro de resolución.
- `id`: uuid (PK)
- `patient_id`: uuid (FK -> patients.id)
- `exam_id`: uuid (FK -> exams.id)
- `assigned_by`: uuid (FK -> specialists.id)
- `status`: enum ('pending', 'in_progress', 'completed')
- `total_score`: integer (Suma calculada al finalizar)
- `assigned_at`: timestamptz
- `completed_at`: timestamptz

### `attempt_answers` (Respuestas Exactas)
- `id`: uuid (PK)
- `attempt_id`: uuid (FK -> exam_attempts.id)
- `question_id`: uuid (FK -> questions.id)
- `selected_score`: integer (El valor de la opción elegida)

### `diagnostics` (Resultado Final / Fotografía del momento)
Generado automáticamente al completar el test cruzando el `total_score` y la edad del paciente con las `diagnostic_rules`.
- `id`: uuid (PK)
- `attempt_id`: uuid (FK -> exam_attempts.id)
- `rule_id`: uuid (FK -> diagnostic_rules.id)
- `generated_subcategory`: text (Copia congelada de la regla)
- `recommendations`: jsonb (Copia congelada de la regla para historial)
- `created_at`: timestamptz

---

## 🎮 6. Terapia Ocupacional Interactiva

### `interactive_sessions` (Juegos y Ejercicios)
- `id`: uuid (PK)
- `patient_id`: uuid (FK -> patients.id)
- `game_type`: text (Ej. "Cognitivo_Memoria", "Motor_Reaccion")
- `metrics`: jsonb (Flexible: `{ "reaction_time_ms": 300, "accuracy_pct": 85 }`)
- `session_start`: timestamptz
- `session_end`: timestamptz

---

## 🔒 Instrucciones de Seguridad para Claude Code (RLS)
1. **Pacientes:** `SELECT` / `UPDATE` solo en registros donde `patient_id` coincida con su UUID. Solo pueden escribir en `exam_attempts`, `attempt_answers` y `interactive_sessions`.
2. **Especialistas:** Pueden leer data de pacientes donde sean el `assigned_by` o `specialist_id`. Tienen acceso de escritura a las entidades del Motor de Exámenes (`exams`, `questions`, `diagnostic_rules`).
3. **Tutores:** Heredan vista de solo lectura de la data generada por los pacientes vinculados en `tutor_patient_links`.