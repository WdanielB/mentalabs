"use server";

import { unstable_cache, updateTag } from 'next/cache';
import { createAdminClient } from "../../utils/supabase/admin";
import { CACHE_TAGS } from '../lib/cache/tags';

/* ── Exam loading ──────────────────────────────────────────── */

const _cachedListExams = unstable_cache(
  async (onlyPublished: boolean): Promise<any[]> => {
    const supabase = createAdminClient();
    let query = supabase.from("exams").select("id, title, description, is_published, created_at").order("created_at", { ascending: false });
    if (onlyPublished) query = query.eq("is_published", true);
    const { data: exams } = await query;
    if (!exams) return [];

    const ids = exams.map((e: any) => e.id);
    if (ids.length === 0) return exams.map((e: any) => ({ ...e, question_count: 0 }));

    const { data: qc } = await supabase.from("questions").select("exam_id").in("exam_id", ids);
    const cMap: Record<string, number> = {};
    qc?.forEach((q: any) => { cMap[q.exam_id] = (cMap[q.exam_id] ?? 0) + 1; });
    return exams.map((e: any) => ({ ...e, question_count: cMap[e.id] ?? 0 }));
  },
  [CACHE_TAGS.EXAMS],
  { tags: [CACHE_TAGS.EXAMS], revalidate: 300 }
);

export async function listExams(opts?: { onlyPublished?: boolean }) {
  return _cachedListExams(!!opts?.onlyPublished);
}

const _cachedListRulesForExam = unstable_cache(
  async (examId: string): Promise<any[]> => {
    const supabase = createAdminClient();
    const { data } = await supabase.from("diagnostic_rules").select("*").eq("exam_id", examId).order("min_score");
    return data ?? [];
  },
  [CACHE_TAGS.EXAM_RULES],
  { tags: [CACHE_TAGS.EXAM_RULES], revalidate: 300 }
);

export async function listRulesForExam(examId: string) {
  return _cachedListRulesForExam(examId);
}

const _cachedLoadExam = unstable_cache(
  async (id: string) => {
    const supabase = createAdminClient();
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
  },
  [CACHE_TAGS.EXAMS],
  { tags: [CACHE_TAGS.EXAMS], revalidate: 300 }
);

export async function loadExam(id: string) {
  return _cachedLoadExam(id);
}

/* ── Exam CRUD ─────────────────────────────────────────────── */

export async function createExam(title: string, descriptionJson: string): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("exams")
    .insert({ title, description: descriptionJson, created_by: null, is_published: false })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  updateTag(CACHE_TAGS.EXAMS);
  return data.id as string;
}

export async function updateExamMeta(id: string, title: string, descriptionJson: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("exams")
    .update({ title, description: descriptionJson })
    .eq("id", id);
  if (error) throw new Error(error.message);
  updateTag(CACHE_TAGS.EXAMS);
}

export async function deleteExam(id: string): Promise<void> {
  const supabase = createAdminClient();
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
  const supabase = createAdminClient();
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
  const supabase = createAdminClient();

  const { error: examErr } = await supabase
    .from("exams")
    .update({ title: title || "Sin título", description: descriptionJson })
    .eq("id", examId);
  if (examErr) throw new Error(`Examen: ${examErr.message}`);

  if (deletedIds.length) {
    await supabase.from("questions").delete().in("id", deletedIds);
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
      const { error } = await supabase.from("questions").update(payload).eq("id", q.id);
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
  const supabase = createAdminClient();
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
  const supabase = createAdminClient();
  const { error } = await supabase.from("diagnostic_rules").update(rule).eq("id", id);
  if (error) throw new Error(error.message);
  updateTag(CACHE_TAGS.EXAM_RULES);
}

export async function deleteRule(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("diagnostic_rules").delete().eq("id", id);
  if (error) throw new Error(error.message);
  updateTag(CACHE_TAGS.EXAM_RULES);
}
