"use server";

import { unstable_cache, updateTag } from 'next/cache';
import { createAdminClient } from "../../utils/supabase/admin";
import { createClient } from "../../utils/supabase/server";
import { CACHE_TAGS } from '../lib/cache/tags';

export interface SpecialistCard {
  id: string;
  full_name: string;
  email: string;
  specialty: string;
  bio: string | null;
  rating: number;
  hourly_rate: number;
  focus_areas: string[];
}

export async function listSpecialists(opts?: { specialty?: string }) {
  const supabase = createAdminClient();
  let q = supabase
    .from("specialists")
    .select("id, specialty, bio, rating, hourly_rate, focus_areas, profiles!inner(full_name, email)")
    .order("rating", { ascending: false });

  if (opts?.specialty) {
    q = q.ilike("specialty", `%${opts.specialty}%`);
  }

  const { data, error } = await q;
  if (error || !data) return [];

  return data.map((s: any) => ({
    id:          s.id,
    full_name:   s.profiles?.full_name ?? "Especialista",
    email:       s.profiles?.email ?? "",
    specialty:   s.specialty ?? "General",
    bio:         s.bio ?? null,
    rating:      Number(s.rating) || 0,
    hourly_rate: Number(s.hourly_rate) || 0,
    focus_areas: s.focus_areas ?? [],
  })) as SpecialistCard[];
}

export async function updateSpecialistFocusAreas(areas: string[]): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const admin = createAdminClient();
  const { error } = await admin
    .from("specialists")
    .update({ focus_areas: areas })
    .eq("id", user.id);
  if (error) throw new Error(error.message);
  updateTag(CACHE_TAGS.ADMIN_SPECIALISTS);
}

export async function requestAppointment(specialistId: string, patientId: string, startTime: string) {
  const supabase = createAdminClient();
  const start = new Date(startTime);
  const end   = new Date(start.getTime() + 60 * 60 * 1000);

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
  consultation_reason: string | null;
  diagnostic_codes: string[];
}

export interface PatientExamSummary {
  id: string;
  exam_title: string;
  total_score: number | null;
  completed_at: string | null;
  subcategory: string | null;
}

export interface InteractiveSessionSummary {
  id: string;
  game_type: string;
  session_start: string;
  session_end: string | null;
  metrics: Record<string, unknown>;
}

// ── Fetch intervention codes catalog ─────────────────────────────────────

const _listInterventionCodes = unstable_cache(
  async (): Promise<InterventionCode[]> => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("psychological_intervention_codes")
      .select("id, code, name, category")
      .order("category")
      .order("code");
    return (data ?? []) as InterventionCode[];
  },
  [CACHE_TAGS.INTERVENTION_CODES],
  { tags: [CACHE_TAGS.INTERVENTION_CODES], revalidate: 86400 }
);

export async function listInterventionCodes(): Promise<InterventionCode[]> {
  return _listInterventionCodes();
}

// ── Fetch diagnosis categories ────────────────────────────────────────────

const _listDiagnosisCategories = unstable_cache(
  async (): Promise<DiagnosisCategory[]> => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("diagnosis_categories")
      .select("id, condition, type_label, age_group, cie_code, dsm_code")
      .order("condition")
      .order("type_label")
      .order("age_group");
    return (data ?? []) as DiagnosisCategory[];
  },
  [CACHE_TAGS.DIAGNOSIS_CATEGORIES],
  { tags: [CACHE_TAGS.DIAGNOSIS_CATEGORIES], revalidate: 86400 }
);

export async function listDiagnosisCategories(): Promise<DiagnosisCategory[]> {
  return _listDiagnosisCategories();
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

// ── Patient timeline ──────────────────────────────────────────────────────

const _cachedPatientTimeline = unstable_cache(
  async (patientId: string, specialistId: string): Promise<AppointmentTimeline[]> => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("appointments")
      .select(`id, start_time, status, clinical_records(status, consultation_reason, diagnostic_codes)`)
      .eq("patient_id", patientId)
      .eq("specialist_id", specialistId)
      .order("start_time", { ascending: false })
      .limit(20);

    return (data ?? []).map((a: any) => ({
      id:                  a.id,
      start_time:          a.start_time,
      status:              a.status,
      record_status:       a.clinical_records?.[0]?.status ?? null,
      consultation_reason: a.clinical_records?.[0]?.consultation_reason ?? null,
      diagnostic_codes:    a.clinical_records?.[0]?.diagnostic_codes ?? [],
    }));
  },
  [CACHE_TAGS.PATIENT_TIMELINE],
  { tags: [CACHE_TAGS.PATIENT_TIMELINE], revalidate: 60 }
);

export async function loadPatientTimeline(
  patientId: string,
  specialistId: string
): Promise<AppointmentTimeline[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return _cachedPatientTimeline(patientId, specialistId);
}

// ── Patient exam summaries ────────────────────────────────────────────────

const _cachedExamSummaries = unstable_cache(
  async (patientId: string): Promise<PatientExamSummary[]> => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("exam_attempts")
      .select(`id, total_score, completed_at, exams!inner(title), diagnostics(generated_subcategory)`)
      .eq("patient_id", patientId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(10);

    return (data ?? []).map((a: any) => ({
      id:           a.id,
      exam_title:   a.exams?.title ?? "Examen",
      total_score:  a.total_score ?? null,
      completed_at: a.completed_at ?? null,
      subcategory:  a.diagnostics?.[0]?.generated_subcategory ?? null,
    }));
  },
  [CACHE_TAGS.PATIENT_EXAMS],
  { tags: [CACHE_TAGS.PATIENT_EXAMS], revalidate: 60 }
);

export async function loadPatientExamSummaries(patientId: string): Promise<PatientExamSummary[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return _cachedExamSummaries(patientId);
}

// ── Interactive session summaries ─────────────────────────────────────────

const _cachedSessionSummaries = unstable_cache(
  async (patientId: string): Promise<InteractiveSessionSummary[]> => {
    const supabase = createAdminClient();
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
  },
  [CACHE_TAGS.PATIENT_SESSIONS],
  { tags: [CACHE_TAGS.PATIENT_SESSIONS], revalidate: 60 }
);

export async function loadInteractiveSessionSummaries(
  patientId: string
): Promise<InteractiveSessionSummary[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return _cachedSessionSummaries(patientId);
}
