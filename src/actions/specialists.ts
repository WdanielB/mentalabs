"use server";

import { updateTag } from 'next/cache';
import { createClient } from "../../utils/supabase/server";
import { CACHE_TAGS } from '../lib/cache/tags';
import { getPublicSpecialists } from '../lib/specialists';
import { displayScore, parseExamMeta } from '../lib/format';

export type { SpecialistCard } from "../lib/specialists";

/** Listado público (marketplace). Usa la política RLS specialists_public_read_active. */
export async function listSpecialists(opts?: { specialty?: string }) {
  return getPublicSpecialists(opts);
}

export async function updateSpecialistFocusAreas(areas: string[]): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("specialists")
    .update({ focus_areas: areas })
    .eq("id", user.id);
  if (error) throw new Error(error.message);
  updateTag(CACHE_TAGS.ADMIN_SPECIALISTS);
}

export interface AvailabilityDay {
  date: string; // YYYY-MM-DD (Lima)
  slots: { iso: string; time: string }[];
}

const LIMA_OFFSET = "-05:00"; // Perú no usa horario de verano.
const MIN_LEAD_MS = 2 * 60 * 60 * 1000;

/** Horarios libres de 60 min en los próximos 14 días, según specialist_schedules menos citas ocupadas. */
export async function getAvailability(specialistId: string, maxDays = 6): Promise<AvailabilityDay[]> {
  const supabase = await createClient();
  const now = new Date();
  const horizon = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [{ data: blocks }, { data: busy }] = await Promise.all([
    supabase
      .from("specialist_schedules")
      .select("day_of_week, start_time, end_time")
      .eq("specialist_id", specialistId)
      .eq("is_active", true),
    supabase.rpc("specialist_busy_slots", {
      p_specialist: specialistId,
      p_from: now.toISOString(),
      p_to: horizon.toISOString(),
    }),
  ]);
  if (!blocks?.length) return [];

  const taken = new Set((busy as string[] | null ?? []).map((t) => new Date(t).getTime()));
  const limaToday = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(now);
  const days: AvailabilityDay[] = [];

  for (let d = 0; d < 14 && days.length < maxDays; d++) {
    const date = new Date(`${limaToday}T12:00:00${LIMA_OFFSET}`);
    date.setUTCDate(date.getUTCDate() + d);
    const ymd = date.toISOString().slice(0, 10);
    const dow = new Date(`${ymd}T12:00:00${LIMA_OFFSET}`).getUTCDay();

    const slots: AvailabilityDay["slots"] = [];
    for (const b of blocks.filter((b) => b.day_of_week === dow)) {
      const [sh] = String(b.start_time).split(":").map(Number);
      const [eh] = String(b.end_time).split(":").map(Number);
      // Sesiones de 60 min que terminan dentro del bloque.
      for (let h = sh; h + 1 <= eh; h++) {
        const time = `${String(h).padStart(2, "0")}:00`;
        const start = new Date(`${ymd}T${time}:00${LIMA_OFFSET}`);
        if (start.getTime() - now.getTime() < MIN_LEAD_MS || taken.has(start.getTime())) continue;
        slots.push({ iso: start.toISOString(), time });
      }
    }
    slots.sort((a, b) => a.iso.localeCompare(b.iso));
    if (slots.length) days.push({ date: ymd, slots });
  }
  return days;
}

/**
 * Reserva una cita para el paciente autenticado. El paciente sale de la sesión,
 * nunca del cliente, y la inserción pasa por RLS (patient_id = auth.uid()).
 */
export async function requestAppointment(specialistId: string, startTime: string, forPatientId?: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims) throw new Error("Inicia sesión para agendar una cita.");
  const role = (claims.app_metadata as any)?.role;

  // Paciente adulto: la cita es suya. Tutor: para un hijo que administra;
  // la política appointments_insert_guardian (is_guardian_of) lo verifica en la BD.
  let patientId: string;
  if (role === "paciente") patientId = claims.sub;
  else if (role === "tutor" && forPatientId) patientId = forPatientId;
  else if (role === "tutor") throw new Error("Elige para cuál de tus hijos es la cita.");
  else throw new Error("Solo pacientes y tutores pueden agendar citas.");

  const start = new Date(startTime);
  if (Number.isNaN(start.getTime()) || start.getTime() < Date.now()) {
    throw new Error("Elige un horario futuro.");
  }
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      specialist_id: specialistId,
      patient_id:    patientId,
      start_time:    start.toISOString(),
      end_time:      end.toISOString(),
      status:        "scheduled",
    })
    .select("id")
    .single();

  if (error?.code === "23505") throw new Error("Ese horario acaba de ocuparse. Elige otro.");
  if (error?.code === "42501") throw new Error("No puedes agendar citas para ese paciente.");
  if (error) throw new Error(error.message);
  updateTag(CACHE_TAGS.PATIENT_TIMELINE);
  updateTag(CACHE_TAGS.SPECIALIST_PATIENTS);
  updateTag(CACHE_TAGS.ADMIN_APPOINTMENTS);
  return data.id as string;
}

// ── Clinical record types ─────────────────────────────────────────────────

export interface InterventionCode {
  id: string;
  code: string;
  name: string;
  category: string;
}

export interface DiagnosisCategory {
  id: string;
  condition: string;
  type_label: string;
  age_group: string;
  cie_code: string | null;
  dsm_code: string | null;
}

export interface ClinicalRecordData {
  id: string | null;
  status: "draft" | "signed_and_locked";
  consultation_reason: string;
  clinical_evolution: string;
  diagnostic_codes: string[];
  diagnosis_category_id: string | null;
  treatment_plan: string;
  intervention_codes: string[];
  observations: string;
  signed_at: string | null;
}

export interface AppointmentTimeline {
  id: string;
  start_time: string;
  status: string;
  record_status: "draft" | "signed_and_locked" | null;
  attention_type: string | null;
  consultation_reason: string | null;
  diagnostic_codes: string[];
}

export interface PatientExamSummary {
  id: string;
  exam_title: string;
  total_score: number | null;
  completed_at: string | null;
  subcategory: string | null;
  is_games: boolean;
}

export interface InteractiveSessionSummary {
  id: string;
  game_type: string;
  session_start: string;
  session_end: string | null;
  metrics: Record<string, unknown>;
}

// ── Catálogos (lectura para cualquier usuario autenticado vía RLS) ────────
// Antes usaban la service role; no hace falta y así funcionan sin esa clave.

export async function listInterventionCodes(): Promise<InterventionCode[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("psychological_intervention_codes")
    .select("id, code, name, category")
    .order("category")
    .order("code");
  return (data ?? []) as InterventionCode[];
}

export async function listDiagnosisCategories(): Promise<DiagnosisCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("diagnosis_categories")
    .select("id, condition, type_label, age_group, cie_code, dsm_code")
    .order("condition")
    .order("type_label")
    .order("age_group");
  return (data ?? []) as DiagnosisCategory[];
}

// ── Load or initialise a clinical record for an appointment ──────────────

export async function loadClinicalRecord(appointmentId: string): Promise<ClinicalRecordData> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: record } = await supabase
    .from("clinical_records")
    .select("id, status, consultation_reason, clinical_evolution, diagnostic_codes, treatment_plan, intervention_codes, observations, signed_at")
    .eq("appointment_id", appointmentId)
    .maybeSingle();

  if (record) {
    return {
      id:                    record.id,
      status:                record.status,
      consultation_reason:   record.consultation_reason ?? "",
      clinical_evolution:    record.clinical_evolution ?? "",
      diagnostic_codes:      record.diagnostic_codes ?? [],
      diagnosis_category_id: null,
      treatment_plan:        record.treatment_plan ?? "",
      intervention_codes:    record.intervention_codes ?? [],
      observations:          record.observations ?? "",
      signed_at:             record.signed_at ?? null,
    };
  }

  return {
    id:                    null,
    status:                "draft",
    consultation_reason:   "",
    clinical_evolution:    "",
    diagnostic_codes:      [],
    diagnosis_category_id: null,
    treatment_plan:        "",
    intervention_codes:    [],
    observations:          "",
    signed_at:             null,
  };
}

// ── Auto-save draft ───────────────────────────────────────────────────────

export async function saveClinicalRecordDraft(
  appointmentId: string,
  patientId: string,
  fields: Partial<Omit<ClinicalRecordData, "id" | "status" | "signed_at">>
): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const payload = {
    appointment_id:    appointmentId,
    patient_id:        patientId,
    specialist_id:     user.id,
    status:            "draft" as const,
    consultation_reason: fields.consultation_reason ?? "",
    clinical_evolution:  fields.clinical_evolution ?? "",
    diagnostic_codes:    fields.diagnostic_codes ?? [],
    treatment_plan:      fields.treatment_plan ?? "",
    intervention_codes:  fields.intervention_codes ?? [],
    observations:        fields.observations ?? "",
  };

  const { data, error } = await supabase
    .from("clinical_records")
    .upsert(payload, { onConflict: "appointment_id" })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  updateTag(CACHE_TAGS.PATIENT_TIMELINE);
  return data.id as string;
}

// ── Sign and lock a record ────────────────────────────────────────────────

export async function signClinicalRecord(appointmentId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clinical_records")
    .update({ status: "signed_and_locked", signed_at: new Date().toISOString() })
    .eq("appointment_id", appointmentId)
    .eq("status", "draft");
  if (error) throw new Error(error.message);
  updateTag(CACHE_TAGS.PATIENT_TIMELINE);
}

// ── Datos del paciente para el especialista ──────────────────────────────
// Antes: service role + unstable_cache con solo "hay sesión" como control,
// así que cualquier usuario podía pedir los resultados de cualquier patientId.
// Ahora se consulta como el usuario y RLS decide qué puede ver.

export async function loadPatientTimeline(
  patientId: string,
  specialistId: string
): Promise<AppointmentTimeline[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select(`id, start_time, status, attention_type, clinical_records(status, consultation_reason, diagnostic_codes)`)
    .eq("patient_id", patientId)
    .eq("specialist_id", specialistId)
    .order("start_time", { ascending: false })
    .limit(20);

  return (data ?? []).map((a: any) => {
    const rec = Array.isArray(a.clinical_records) ? a.clinical_records[0] : a.clinical_records;
    return {
      id:                  a.id,
      start_time:          a.start_time,
      status:              a.status,
      record_status:       rec?.status ?? null,
      attention_type:      a.attention_type ?? null,
      consultation_reason: rec?.consultation_reason ?? null,
      diagnostic_codes:    rec?.diagnostic_codes ?? [],
    };
  });
}

export async function loadPatientExamSummaries(patientId: string): Promise<PatientExamSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exam_attempts")
    .select(`id, total_score, completed_at, exams!inner(title, description), diagnostics(generated_subcategory)`)
    .eq("patient_id", patientId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(10);

  return (data ?? []).map((a: any) => ({
    id:           a.id,
    exam_title:   a.exams?.title ?? "Examen",
    total_score:  displayScore(a.total_score ?? null, parseExamMeta(a.exams?.description)),
    completed_at: a.completed_at ?? null,
    subcategory:  a.diagnostics?.[0]?.generated_subcategory ?? null,
    is_games:     parseExamMeta(a.exams?.description).kind === "games",
  }));
}

export async function loadInteractiveSessionSummaries(
  patientId: string
): Promise<InteractiveSessionSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("interactive_sessions")
    .select("id, game_type, session_start, session_end, metrics")
    .eq("patient_id", patientId)
    .order("session_start", { ascending: false })
    .limit(10);

  return (data ?? []).map((row: any) => ({
    id:            row.id,
    game_type:     row.game_type,
    session_start: row.session_start,
    session_end:   row.session_end ?? null,
    metrics:       row.metrics ?? {},
  }));
}
