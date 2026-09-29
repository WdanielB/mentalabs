"use server";

import { updateTag } from 'next/cache';
import { createClient } from "../../utils/supabase/server";
import { CACHE_TAGS } from '../lib/cache/tags';

// Todas las acciones corren como el usuario que llama; RLS decide qué puede
// leer o escribir (admin, o el especialista autor del examen). Antes usaban la
// service role sin comprobar la sesión: las server actions son endpoints
// públicos, así que cualquiera podía crear o borrar exámenes e intentos.

type Staff = { supabase: Awaited<ReturnType<typeof createClient>>; userId: string; role: "admin" | "especialista" };

async function requireStaff(): Promise<Staff> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  // Solo app_metadata: user_metadata lo puede editar el propio usuario.
  const role = (claims?.app_metadata as any)?.role;
  if (!claims || (role !== "admin" && role !== "especialista")) throw new Error("No autorizado");
  return { supabase, userId: claims.sub, role };
}

/* ── Exam loading ──────────────────────────────────────────── */

export async function listExams(opts?: { onlyPublished?: boolean }) {
  const supabase = await createClient();
  let query = supabase.from("exams").select("id, title, description, is_published, created_at").order("created_at", { ascending: false });
  if (opts?.onlyPublished) query = query.eq("is_published", true);
  const { data: exams } = await query;
  if (!exams) return [];

  const ids = exams.map((e: any) => e.id);
  if (ids.length === 0) return exams.map((e: any) => ({ ...e, question_count: 0 }));

  const { data: qc } = await supabase.from("questions").select("exam_id").in("exam_id", ids);
  const cMap: Record<string, number> = {};
  qc?.forEach((q: any) => { cMap[q.exam_id] = (cMap[q.exam_id] ?? 0) + 1; });
  return exams.map((e: any) => ({ ...e, question_count: cMap[e.id] ?? 0 }));
}

export async function listRulesForExam(examId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("diagnostic_rules").select("*").eq("exam_id", examId).order("min_score");
  return data ?? [];
}

export async function loadExam(id: string) {
  const supabase = await createClient();
  const { data: exam, error } = await supabase
    .from("exams")
    .select("title, description, is_published")
    .eq("id", id)
    .single();
  if (error || !exam) return null;

  const { data: questions } = await supabase
    .from("questions")
    .select("id, order_index, content, options")
    .eq("exam_id", id)
    .order("order_index");

  return { exam, questions: questions ?? [] };
}

/* ── Exam CRUD ─────────────────────────────────────────────── */

export async function createExam(title: string, descriptionJson: string): Promise<string> {
  const { supabase, userId, role } = await requireStaff();
  const { data, error } = await supabase
    .from("exams")
    // Un especialista es autor de su examen; los del admin son del sistema.
    .insert({ title, description: descriptionJson, created_by: role === "especialista" ? userId : null, is_published: false })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  updateTag(CACHE_TAGS.EXAMS);
  return data.id as string;
}

export async function updateExamMeta(id: string, title: string, descriptionJson: string): Promise<void> {
  const { supabase } = await requireStaff();
  const { error } = await supabase
    .from("exams")
    .update({ title, description: descriptionJson })
    .eq("id", id);
  if (error) throw new Error(error.message);
  updateTag(CACHE_TAGS.EXAMS);
}

export async function deleteExam(id: string): Promise<void> {
  const { supabase } = await requireStaff();
  await supabase.from("diagnostic_rules").delete().eq("exam_id", id);
  const { data: attempts } = await supabase.from("exam_attempts").select("id").eq("exam_id", id);
  if (attempts && attempts.length > 0) {
    await supabase.from("attempt_answers").delete().in("attempt_id", attempts.map((a: any) => a.id));
  }
  await supabase.from("exam_attempts").delete().eq("exam_id", id);
  await supabase.from("questions").delete().eq("exam_id", id);
  const { error } = await supabase.from("exams").delete().eq("id", id);
  if (error) throw new Error(error.message);
  updateTag(CACHE_TAGS.EXAMS);
  updateTag(CACHE_TAGS.EXAM_RULES);
  updateTag(CACHE_TAGS.ADMIN_STATS);
}

export async function togglePublishExam(id: string, is_published: boolean): Promise<void> {
  const { supabase } = await requireStaff();
  const { error } = await supabase.from("exams").update({ is_published }).eq("id", id);
  if (error) throw new Error(error.message);
  updateTag(CACHE_TAGS.EXAMS);
  updateTag(CACHE_TAGS.ADMIN_STATS);
}

/* ── Exam content (title + description + questions) ─────────── */

interface QuestionPayload {
  id: string | null;
  order_index: number;
  content: string;
  hint: string;
  opts: Record<string, unknown>;
}

interface SaveResult {
  newIds: Record<number, string>;
}

export async function saveExamContent(
  examId: string,
  title: string,
  descriptionJson: string,
  questions: QuestionPayload[],
  deletedIds: string[]
): Promise<SaveResult> {
  const { supabase } = await requireStaff();

  const { error: examErr } = await supabase
    .from("exams")
    .update({ title: title || "Sin título", description: descriptionJson })
    .eq("id", examId);
  if (examErr) throw new Error(`Examen: ${examErr.message}`);

  if (deletedIds.length) {
    await supabase.from("questions").delete().in("id", deletedIds).eq("exam_id", examId);
  }

  const newIds: Record<number, string> = {};
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const optsToSave = { ...q.opts, hint: q.hint || undefined };
    const payload = {
      content: q.content || "Pregunta sin texto",
      options: optsToSave,
      order_index: q.order_index,
    };

    if (q.id) {
      const { error } = await supabase.from("questions").update(payload).eq("id", q.id).eq("exam_id", examId);
      if (error) throw new Error(`Pregunta ${i + 1}: ${error.message}`);
    } else {
      const { data, error } = await supabase
        .from("questions")
        .insert({ exam_id: examId, ...payload })
        .select("id")
        .single();
      if (error) throw new Error(`Pregunta ${i + 1}: ${error.message}`);
      if (data?.id) newIds[i] = data.id as string;
    }
  }

  updateTag(CACHE_TAGS.EXAMS);
  return { newIds };
}

/* ── Diagnostic rules CRUD ───────────────────────────────────── */

export async function createRule(examId: string, rule: {
  min_score: number; max_score: number;
  min_age: number | null; max_age: number | null;
  subcategory: string; recommendations: string[];
}) {
  const { supabase } = await requireStaff();
  const { data, error } = await supabase
    .from("diagnostic_rules")
    .insert({ exam_id: examId, ...rule })
    .select()
    .single();
  if (error) throw new Error(error.message);
  updateTag(CACHE_TAGS.EXAM_RULES);
  return data;
}

export async function updateRule(id: string, rule: {
  min_score: number; max_score: number;
  min_age: number | null; max_age: number | null;
  subcategory: string; recommendations: string[];
}) {
  const { supabase } = await requireStaff();
  const { error } = await supabase.from("diagnostic_rules").update(rule).eq("id", id);
  if (error) throw new Error(error.message);
  updateTag(CACHE_TAGS.EXAM_RULES);
}

export async function deleteRule(id: string) {
  const { supabase } = await requireStaff();
  const { error } = await supabase.from("diagnostic_rules").delete().eq("id", id);
  if (error) throw new Error(error.message);
  updateTag(CACHE_TAGS.EXAM_RULES);
}
