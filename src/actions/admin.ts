"use server";

import { unstable_cache, updateTag } from 'next/cache';
import { createAdminClient } from "../../utils/supabase/admin";
import { createClient } from "../../utils/supabase/server";
import { roleFromUserMetadata } from "../lib/auth/role";
import { CACHE_TAGS } from '../lib/cache/tags';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const metadataRole = roleFromUserMetadata(user);
  if (metadataRole === "admin") return user;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (data?.role !== "admin") throw new Error("Not authorized");
  return user;
}

// ── Specialists ───────────────────────────────────────────────────────────────

const _cachedListSpecialistsAdmin = unstable_cache(
  async (): Promise<any[]> => {
    const db = createAdminClient();
    const { data } = await db
      .from("specialists")
      .select("id, specialty, bio, rating, hourly_rate, status, profiles!inner(full_name, email, created_at)")
      .order("created_at", { referencedTable: "profiles", ascending: false });
    return (data ?? []) as any[];
  },
  [CACHE_TAGS.ADMIN_SPECIALISTS],
  { tags: [CACHE_TAGS.ADMIN_SPECIALISTS], revalidate: 120 }
);

export async function listSpecialistsAdmin() {
  await requireAdmin();
  return _cachedListSpecialistsAdmin();
}

export async function updateSpecialistStatus(
  specialistId: string,
  status: "pending" | "active" | "suspended"
) {
  await requireAdmin();
  const db = createAdminClient();
  const { error } = await db.from("specialists").update({ status }).eq("id", specialistId);
  if (error) throw new Error(error.message);
  updateTag(CACHE_TAGS.ADMIN_SPECIALISTS);
  updateTag(CACHE_TAGS.ADMIN_STATS);
}

// ── Patients ──────────────────────────────────────────────────────────────────

const _cachedListPatientsAdmin = unstable_cache(
  async (): Promise<any[]> => {
    const db = createAdminClient();
    const { data } = await db
      .from("patients")
      .select("id, status, clinical_history_summary, profiles!inner(full_name, email, birth_date, created_at)")
      .order("created_at", { referencedTable: "profiles", ascending: false });
    return (data ?? []) as any[];
  },
  [CACHE_TAGS.ADMIN_PATIENTS],
  { tags: [CACHE_TAGS.ADMIN_PATIENTS], revalidate: 120 }
);

export async function listPatientsAdmin() {
  await requireAdmin();
  return _cachedListPatientsAdmin();
}

// ── Assignments ───────────────────────────────────────────────────────────────

const _cachedListAssignmentsAdmin = unstable_cache(
  async (): Promise<any[]> => {
    const db = createAdminClient();
    const { data } = await db
      .from("specialist_patient_assignments")
      .select(`
        id, assigned_at, notes,
        specialists!inner(id, specialty, profiles!inner(full_name)),
        patients!inner(id, profiles!inner(full_name, email))
      `)
      .order("assigned_at", { ascending: false });
    return (data ?? []) as any[];
  },
  [CACHE_TAGS.ADMIN_ASSIGNMENTS],
  { tags: [CACHE_TAGS.ADMIN_ASSIGNMENTS], revalidate: 120 }
);

export async function listAssignmentsAdmin() {
  await requireAdmin();
  return _cachedListAssignmentsAdmin();
}

export async function assignSpecialistToPatient(
  specialistId: string,
  patientId: string,
  assignedBy: string,
  notes?: string
) {
  await requireAdmin();
  const db = createAdminClient();
  const { error } = await db
    .from("specialist_patient_assignments")
    .upsert(
      { specialist_id: specialistId, patient_id: patientId, assigned_by: assignedBy, notes: notes ?? null },
      { onConflict: "patient_id,specialist_id" }
    );
  if (error) throw new Error(error.message);
  updateTag(CACHE_TAGS.ADMIN_ASSIGNMENTS);
  updateTag(CACHE_TAGS.SPECIALIST_PATIENTS);
}

export async function removeAssignment(assignmentId: string) {
  await requireAdmin();
  const db = createAdminClient();
  const { error } = await db.from("specialist_patient_assignments").delete().eq("id", assignmentId);
  if (error) throw new Error(error.message);
  updateTag(CACHE_TAGS.ADMIN_ASSIGNMENTS);
  updateTag(CACHE_TAGS.SPECIALIST_PATIENTS);
}

// ── Assignment Requests ───────────────────────────────────────────────────────

const _cachedListAssignmentRequests = unstable_cache(
  async (): Promise<any[]> => {
    const db = createAdminClient();
    const { data } = await db
      .from("assignment_requests")
      .select(`
        id, status, patient_notes, admin_notes, created_at,
        patients!inner(id, profiles!inner(full_name, email)),
        requested_specialist:requested_specialist_id(id, specialty, profiles!inner(full_name))
      `)
      .order("created_at", { ascending: false });
    return (data ?? []) as any[];
  },
  [CACHE_TAGS.ADMIN_REQUESTS],
  { tags: [CACHE_TAGS.ADMIN_REQUESTS], revalidate: 120 }
);

export async function listAssignmentRequests() {
  await requireAdmin();
  return _cachedListAssignmentRequests();
}

export async function reviewAssignmentRequest(
  requestId: string,
  approved: boolean,
  adminNotes?: string
) {
  const user = await requireAdmin();
  const db = createAdminClient();

  const { data: req } = await db
    .from("assignment_requests")
    .select("patient_id, requested_specialist_id")
    .eq("id", requestId)
    .single();

  const { error } = await db.from("assignment_requests").update({
    status:      approved ? "approved" : "rejected",
    admin_notes: adminNotes ?? null,
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.id,
  }).eq("id", requestId);
  if (error) throw new Error(error.message);

  if (approved && req?.requested_specialist_id) {
    await assignSpecialistToPatient(req.requested_specialist_id, req.patient_id, user.id);
  }

  updateTag(CACHE_TAGS.ADMIN_REQUESTS);
  updateTag(CACHE_TAGS.ADMIN_ASSIGNMENTS);
  updateTag(CACHE_TAGS.SPECIALIST_PATIENTS);
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────

const _cachedAdminStats = unstable_cache(
  async () => {
    const db = createAdminClient();
    const [pRes, sRes, tRes, eRes, aRes] = await Promise.all([
      db.from("profiles").select("*", { count: "exact", head: true }).eq("role", "paciente"),
      db.from("profiles").select("*", { count: "exact", head: true }).eq("role", "especialista"),
      db.from("profiles").select("*", { count: "exact", head: true }).eq("role", "tutor"),
      db.from("exams").select("*", { count: "exact", head: true }).eq("is_published", true),
      db.from("exam_attempts").select("*", { count: "exact", head: true }),
    ]);
    return {
      patients:    pRes.count ?? 0,
      specialists: sRes.count ?? 0,
      tutors:      tRes.count ?? 0,
      exams:       eRes.count ?? 0,
      attempts:    aRes.count ?? 0,
    };
  },
  [CACHE_TAGS.ADMIN_STATS],
  { tags: [CACHE_TAGS.ADMIN_STATS], revalidate: 60 }
);

export async function getAdminStats() {
  await requireAdmin();
  return _cachedAdminStats();
}

// ── Scheduled Appointments ────────────────────────────────────────────────────

const _cachedScheduledAppointments = unstable_cache(
  async (): Promise<any[]> => {
    const db = createAdminClient();
    const { data } = await db
      .from("appointments")
      .select(`
        id, start_time, end_time, status, created_at,
        patients!inner(profiles!inner(full_name, email)),
        specialists!inner(specialty, profiles!inner(full_name))
      `)
      .in("status", ["scheduled", "confirmed"])
      .order("start_time", { ascending: true });
    return (data ?? []) as any[];
  },
  [CACHE_TAGS.ADMIN_APPOINTMENTS],
  { tags: [CACHE_TAGS.ADMIN_APPOINTMENTS], revalidate: 60 }
);

export async function listScheduledAppointments() {
  await requireAdmin();
  return _cachedScheduledAppointments();
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: "confirmed" | "cancelled"
) {
  await requireAdmin();
  const db = createAdminClient();
  const { error } = await db.from("appointments").update({ status }).eq("id", appointmentId);
  if (error) throw new Error(error.message);
  updateTag(CACHE_TAGS.ADMIN_APPOINTMENTS);
  updateTag(CACHE_TAGS.PATIENT_TIMELINE);
}
