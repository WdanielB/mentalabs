"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown,
  Save, Globe, Lock, CheckCircle2, X, Brain, Loader2,
  BarChart2, CheckSquare, Sliders, CircleDot, AlignLeft,
  ChevronDown as TemplateIcon, GripVertical, Clock, Gamepad2
} from "lucide-react";
import { saveExamContent, loadExam, togglePublishExam } from "../actions/exams";
import GameRenderer from "./GameRenderer";

/* ── Types ───────────────────────────────────────────────────── */
type QType = "likert" | "yesno" | "vas" | "single_choice" | "free_text" | "interactive_game";

interface Choice { text: string; score: number | string }

interface LikertOpts   { type: "likert";         choices: Choice[] }
interface YesNoOpts    { type: "yesno";           yes_label: string; yes_score: number; no_label: string; no_score: number }
interface VASOpts      { type: "vas";             min: number; max: number; min_label: string; max_label: string }
interface SingleOpts   { type: "single_choice";  choices: Choice[] }
interface FreeTextOpts { type: "free_text" }
interface GameOpts     { type: "interactive_game"; game_type: string; config_json: string; capture_metrics: string }
type QuestionOpts = LikertOpts | YesNoOpts | VASOpts | SingleOpts | FreeTextOpts | GameOpts;

interface LocalQuestion {
  id: string | null;
  order_index: number;
  content: string;
  hint: string;
  opts: QuestionOpts;
}

interface ExamData { title: string; description: string; is_published: boolean }
interface ExamPreserved { battery: string; diagnosis_type: string } // preserved from meta JSON

/* ── Constants ───────────────────────────────────────────────── */
const Q_TYPES: { id: QType; label: string; icon: React.ElementType; desc: string; color: string }[] = [
  { id: "likert",        label: "Likert",       icon: BarChart2,    desc: "Escala de puntajes",    color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
  { id: "yesno",         label: "Sí / No",      icon: CheckSquare,  desc: "Respuesta binaria",     color: "text-green-600 bg-green-50 dark:bg-green-900/20" },
  { id: "vas",           label: "Escala 0-10",  icon: Sliders,      desc: "Intensidad visual",     color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20" },
  { id: "single_choice", label: "Opción Única", icon: CircleDot,    desc: "Lista de opciones",     color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20" },
  { id: "free_text",        label: "Texto Libre",  icon: AlignLeft,   desc: "Respuesta abierta",     color: "text-slate-600 bg-slate-100 dark:bg-slate-800" },
  { id: "interactive_game", label: "Juego",        icon: Gamepad2,    desc: "Juego interactivo JSON", color: "text-pink-600 bg-pink-50 dark:bg-pink-900/20" },
];

const LIKERT_TEMPLATES: Record<string, { label: string; choices: Choice[] }> = {
  frecuencia4: {
    label: "Frecuencia (4)",
    choices: [
      { text: "Nunca o Rara Vez", score: 0 }, { text: "A veces", score: 1 },
      { text: "A menudo", score: 2 }, { text: "Casi siempre", score: 3 },
    ],
  },
  phq9: {
    label: "PHQ-9 / GAD-7",
    choices: [
      { text: "Para nada", score: 0 }, { text: "Varios días", score: 1 },
      { text: "Más de la mitad de los días", score: 2 }, { text: "Casi todos los días", score: 3 },
    ],
  },
  conners: {
    label: "Conners TDAH",
    choices: [
      { text: "Nunca", score: 0 }, { text: "Rara vez", score: 1 },
      { text: "A veces", score: 2 }, { text: "Con frecuencia", score: 3 },
      { text: "Muy frecuentemente", score: 4 },
    ],
  },
  acuerdo5: {
    label: "Acuerdo (5)",
    choices: [
      { text: "Totalmente en desacuerdo", score: 0 }, { text: "En desacuerdo", score: 1 },
      { text: "Neutral", score: 2 }, { text: "De acuerdo", score: 3 },
      { text: "Totalmente de acuerdo", score: 4 },
    ],
  },
};

const DEFAULT_OPTS: Record<QType, QuestionOpts> = {
  likert:        { type: "likert",        choices: LIKERT_TEMPLATES.frecuencia4.choices.map(c => ({ ...c })) },
  yesno:         { type: "yesno",         yes_label: "Sí", yes_score: 1, no_label: "No", no_score: 0 },
  vas:           { type: "vas",           min: 0, max: 10, min_label: "Nada", max_label: "Extremadamente" },
  single_choice: { type: "single_choice", choices: [{ text: "", score: 0 }] },
  free_text:        { type: "free_text" },
  interactive_game: {
    type: "interactive_game",
    game_type: "memory_cards",
    config_json: JSON.stringify({ game_type: "memory_cards", rounds: 5, time_limit_seconds: 60, difficulty: "medium", capture: ["accuracy_pct","reaction_time_ms","errors"] }, null, 2),
    capture_metrics: "accuracy_pct, reaction_time_ms, errors",
  },
};

const GAME_TEMPLATES: Record<string, { label: string; game_type: string; config: object; metrics: string }> = {
  memory: {
    label: "Memoria de Cartas",
    game_type: "memory_cards",
    config: { game_type: "memory_cards", rounds: 5, time_limit_seconds: 60, difficulty: "medium", card_types: ["colors","shapes"], capture: ["accuracy_pct","reaction_time_ms","errors"] },
    metrics: "accuracy_pct, reaction_time_ms, errors",
  },
  reaction: {
    label: "Tiempo de Reacción",
    game_type: "reaction_time",
    config: { game_type: "reaction_time", trials: 10, stimulus_type: "visual", interval_ms: 1500, capture: ["reaction_time_ms","missed_trials","false_starts"] },
    metrics: "reaction_time_ms, missed_trials, false_starts",
  },
  attention: {
    label: "Atención Sostenida",
    game_type: "sustained_attention",
    config: { game_type: "sustained_attention", duration_seconds: 120, target_stimulus: "specific_shape", distractors: true, capture: ["accuracy_pct","false_positives","response_time_avg"] },
    metrics: "accuracy_pct, false_positives, response_time_avg",
  },
  sorting: {
    label: "Clasificación (Flexibilidad Cognitiva)",
    game_type: "cognitive_sorting",
    config: { game_type: "cognitive_sorting", rule_switches: 3, items_per_rule: 10, capture: ["accuracy_pct","switch_cost_ms","errors"] },
    metrics: "accuracy_pct, switch_cost_ms, errors",
  },
};

/* ── Helpers ─────────────────────────────────────────────────── */
function parseOpts(raw: any): QuestionOpts {
  if (Array.isArray(raw)) return { type: "likert", choices: raw };
  if (raw?.type) {
    if (raw.type === "interactive_game") return { type: "interactive_game", game_type: raw.game_type ?? "custom", config_json: typeof raw.config_json === "string" ? raw.config_json : JSON.stringify(raw.config ?? {}, null, 2), capture_metrics: raw.capture_metrics ?? "" };
    return raw as QuestionOpts;
  }
  return { type: "likert", choices: LIKERT_TEMPLATES.frecuencia4.choices.map(c => ({ ...c })) };
}

function estimateTime(n: number) {
  const mins = Math.max(1, Math.ceil(n * 1.5));
  return `~${mins} min`;
}

/* ── Component ───────────────────────────────────────────────── */
export default function ExamEditor({ examId, backHref }: { examId: string; backHref: string }) {
  const [exam,       setExam]       = useState<ExamData>({ title: "", description: "", is_published: false });
  const [preserved,  setPreserved]  = useState<ExamPreserved>({ battery: "", diagnosis_type: "" });
  const [questions,  setQuestions]  = useState<LocalQuestion[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [expanded,   setExpanded]   = useState<Set<number>>(new Set());
  const [saving,     setSaving]     = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [flash,      setFlash]      = useState(false);
  const [saveError,  setSaveError]  = useState<string | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);
  const [template,   setTemplate]   = useState<Record<number, boolean>>({});

  /* ── Load via Server Action (bypasses RLS) ────────────────── */
  useEffect(() => {
    (async () => {
      const result = await loadExam(examId);
      if (!result) { setNotFound(true); setLoading(false); return; }
      const { exam: e, questions: qs } = result;

      // Parse description: may be JSON {"text","battery","diagnosis_type"} or plain string
      let descText = e.description ?? "";
      let meta: ExamPreserved = { battery: "", diagnosis_type: "" };
      try {
        const parsed = JSON.parse(e.description ?? "{}");
        if (parsed && typeof parsed === "object") {
          descText = parsed.text ?? "";
          meta = { battery: parsed.battery ?? "", diagnosis_type: parsed.diagnosis_type ?? "" };
        }
      } catch { /* plain text description, keep as-is */ }

      setExam({ title: e.title, description: descText, is_published: e.is_published });
      setPreserved(meta);

      const parsedQs: LocalQuestion[] = qs.map((q: any) => {
        const raw = q.options;
        const opts = parseOpts(raw);
        const hint = (raw?.hint as string) || "";
        return { id: q.id, order_index: q.order_index, content: q.content ?? "", hint, opts };
      });
      setQuestions(parsedQs);
      if (parsedQs.length <= 6) setExpanded(new Set(parsedQs.map((_, i) => i)));
      setLoading(false);
    })();
  }, [examId]);

  /* ── Question ops ─────────────────────────────────────────── */
  const addQuestion = (type: QType = "likert") => {
    const idx = questions.length;
    setQuestions(prev => [...prev, {
      id: null, order_index: idx, content: "", hint: "",
      opts: { ...(DEFAULT_OPTS[type] as any) },
    }]);
    setExpanded(prev => new Set([...prev, idx]));
  };

  const deleteQ = (i: number) => {
    const q = questions[i];
    if (q.id) setDeletedIds(prev => [...prev, q.id!]);
    setQuestions(prev => prev.filter((_, j) => j !== i).map((q, j) => ({ ...q, order_index: j })));
    setExpanded(prev => { const n = new Set<number>(); prev.forEach(x => { if (x !== i) n.add(x > i ? x - 1 : x); }); return n; });
  };

  const moveQ = (i: number, dir: "up" | "down") => {
    const t = dir === "up" ? i - 1 : i + 1;
    if (t < 0 || t >= questions.length) return;
    setQuestions(prev => { const n = [...prev]; [n[i], n[t]] = [n[t], n[i]]; return n.map((q, j) => ({ ...q, order_index: j })); });
    setExpanded(prev => { const n = new Set<number>(); prev.forEach(x => { if (x === i) n.add(t); else if (x === t) n.add(i); else n.add(x); }); return n; });
  };

  const setContent = (i: number, v: string) => setQuestions(p => p.map((q, j) => j === i ? { ...q, content: v } : q));
  const setHint    = (i: number, v: string) => setQuestions(p => p.map((q, j) => j === i ? { ...q, hint: v } : q));

  const changeType = (i: number, type: QType) => {
    setQuestions(p => p.map((q, j) => j !== i ? q : { ...q, opts: { ...(DEFAULT_OPTS[type] as any) } }));
  };

  const setOpts = (i: number, fn: (prev: QuestionOpts) => QuestionOpts) =>
    setQuestions(p => p.map((q, j) => j !== i ? q : { ...q, opts: fn(q.opts) }));

  /* Likert / SingleChoice choices */
  const setChoice = (qi: number, oi: number, field: "text" | "score", v: string) =>
    setOpts(qi, prev => {
      if (prev.type !== "likert" && prev.type !== "single_choice") return prev;
      const choices = prev.choices.map((c, k) => k === oi ? { ...c, [field]: field === "score" ? (v === "" ? "" : Number(v)) : v } : c);
      return { ...prev, choices };
    });
  const addChoice = (qi: number) =>
    setOpts(qi, prev => {
      if (prev.type !== "likert" && prev.type !== "single_choice") return prev;
      return { ...prev, choices: [...prev.choices, { text: "", score: prev.choices.length }] };
    });
  const removeChoice = (qi: number, oi: number) =>
    setOpts(qi, prev => {
      if (prev.type !== "likert" && prev.type !== "single_choice") return prev;
      return { ...prev, choices: prev.choices.filter((_, k) => k !== oi) };
    });
  const applyTemplate = (qi: number, key: string) => {
    const tpl = LIKERT_TEMPLATES[key];
    if (!tpl) return;
    setOpts(qi, prev => {
      if (prev.type !== "likert" && prev.type !== "single_choice") return prev;
      return { ...prev, choices: tpl.choices.map(c => ({ ...c })) };
    });
    setTemplate(prev => ({ ...prev, [qi]: false }));
  };

  /* ── Save ─────────────────────────────────────────────────── */
  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError(null);

    // Re-serialize description preserving battery/diagnosis_type
    const descToSave = JSON.stringify({
      text: exam.description,
      battery: preserved.battery,
      diagnosis_type: preserved.diagnosis_type,
    });

    try {
      const payload = questions.map(q => ({
        id: q.id,
        order_index: q.order_index,
        content: q.content,
        hint: q.hint,
        opts: q.opts as unknown as Record<string, unknown>,
      }));

      const { newIds } = await saveExamContent(
        examId,
        exam.title || "Sin título",
        descToSave,
        payload,
        deletedIds
      );

      // Update local question IDs for newly inserted questions
      const updated = questions.map((q, i) => ({
        ...q,
        id: q.id ?? (newIds[i] ?? null),
      }));
      setQuestions(updated);
      setDeletedIds([]);
      setFlash(true);
      setTimeout(() => setFlash(false), 2000);
    } catch (e: any) {
      setSaveError(e.message ?? "Error al guardar");
    }
    setSaving(false);
  }, [exam, questions, deletedIds, examId]);

  const handlePublish = async () => {
    setPublishing(true);
    const next = !exam.is_published;
    try {
      await togglePublishExam(examId, next);
      setExam(p => ({ ...p, is_published: next }));
    } catch (e: any) {
      setSaveError(e.message);
    }
    setPublishing(false);
  };

  /* ── Render helpers ───────────────────────────────────────── */
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-[#136dec] border-t-transparent rounded-full" /></div>;
  if (notFound) return <div className="flex flex-col items-center justify-center min-h-screen gap-4"><p className="text-slate-500 font-bold">Examen no encontrado</p><Link href={backHref} className="text-[#136dec] font-semibold hover:underline">← Volver</Link></div>;

  const qTypeCfg = (type: QType) => Q_TYPES.find(t => t.id === type) ?? Q_TYPES[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#111822] text-slate-900 dark:text-slate-100 font-sans">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white dark:bg-[#1a2432] border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 py-3 flex items-center gap-3 flex-wrap">
        <Link href={backHref} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <input
          type="text" value={exam.title}
          onChange={e => setExam(p => ({ ...p, title: e.target.value }))}
          placeholder="Título del examen"
          className="flex-1 min-w-[160px] text-lg font-black bg-transparent border-none outline-none placeholder:text-slate-400 placeholder:font-normal"
        />
        <div className="flex items-center gap-2 shrink-0 text-xs text-slate-400 font-medium">
          <Clock className="h-3.5 w-3.5" />
          <span>{estimateTime(questions.length)}</span>
          <span className="mx-1 text-slate-200 dark:text-slate-700">|</span>
          <span>{questions.length} preg.</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handlePublish} disabled={publishing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${exam.is_published ? "border-[#0bda5e] text-[#0bda5e] bg-green-50 dark:bg-green-900/10" : "border-slate-300 dark:border-slate-600 text-slate-500 hover:border-slate-400"}`}>
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : exam.is_published ? <><Globe className="h-4 w-4" /> Publicado</> : <><Lock className="h-4 w-4" /> Borrador</>}
          </button>
          {saveError && (
            <span className="text-xs text-red-500 font-semibold bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 max-w-xs truncate">
              ⚠️ {saveError}
            </span>
          )}
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#136dec] hover:bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md shadow-[#136dec]/20 transition-all disabled:opacity-70">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : flash ? <><CheckCircle2 className="h-4 w-4" /> Guardado</> : <><Save className="h-4 w-4" /> Guardar</>}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 lg:px-8 py-8 space-y-6">

        {/* Descripción */}
        <div className="bg-white dark:bg-[#1a2432] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descripción / Instrucciones del examen</label>
          <textarea rows={2} value={exam.description}
            onChange={e => setExam(p => ({ ...p, description: e.target.value }))}
            placeholder="Ej. PHQ-9: Cuestionario de salud del paciente. Por favor responda según los últimos 14 días."
            className="w-full bg-transparent resize-none outline-none text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400" />
        </div>

        {/* Questions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">
              Preguntas
              <span className="ml-2 text-sm font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{questions.length}</span>
            </h2>
            {/* Add question dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 bg-[#136dec] hover:bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md shadow-[#136dec]/20 transition-all hover:scale-105 active:scale-95">
                <Plus className="h-4 w-4" /> Añadir Pregunta
              </button>
              <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#1a2432] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl py-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20 transition-all">
                {Q_TYPES.map(t => {
                  const Icon = t.icon;
                  return (
                    <button key={t.id} onClick={() => addQuestion(t.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left">
                      <span className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${t.color}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{t.label}</p>
                        <p className="text-xs text-slate-400">{t.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {questions.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-[#1a2432] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
              <Brain className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
              <p className="font-bold text-slate-500 text-lg">Sin preguntas todavía</p>
              <p className="text-slate-400 text-sm mt-1 mb-6">Selecciona un tipo de pregunta para comenzar.</p>
              <div className="flex flex-wrap justify-center gap-2">
                {Q_TYPES.map(t => {
                  const Icon = t.icon;
                  return (
                    <button key={t.id} onClick={() => addQuestion(t.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border-2 border-transparent hover:scale-105 transition-all ${t.color}`}>
                      <Icon className="h-4 w-4" /> {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {questions.map((q, qi) => {
              const isOpen = expanded.has(qi);
              const cfg = qTypeCfg(q.opts.type);
              const Icon = cfg.icon;
              return (
                <div key={qi} className={`bg-white dark:bg-[#1a2432] rounded-2xl border-2 shadow-sm transition-all ${isOpen ? "border-[#136dec]/40 shadow-md" : "border-slate-200 dark:border-slate-800"}`}>
                  {/* Card header */}
                  <div className="flex items-center gap-3 p-4">
                    <GripVertical className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />
                    <button onClick={() => setExpanded(prev => { const n = new Set(prev); n.has(qi) ? n.delete(qi) : n.add(qi); return n; })}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${isOpen ? "bg-[#136dec] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>{qi + 1}</div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${cfg.color}`}><Icon className="h-3 w-3" />{cfg.label}</span>
                      <span className={`text-sm flex-1 min-w-0 truncate ${q.content ? "font-medium" : "text-slate-400 italic"}`}>{q.content || "Escribe aquí la pregunta…"}</span>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => moveQ(qi, "up")} disabled={qi === 0} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"><ChevronUp className="h-4 w-4" /></button>
                      <button onClick={() => moveQ(qi, "down")} disabled={qi === questions.length - 1} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"><ChevronDown className="h-4 w-4" /></button>
                      <button onClick={() => deleteQ(qi)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>

                  {/* Expanded */}
                  {isOpen && (
                    <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 space-y-5">

                      {/* Type selector */}
                      <div className="mt-4">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tipo de Pregunta</label>
                        <div className="flex flex-wrap gap-2">
                          {Q_TYPES.map(t => {
                            const TIcon = t.icon;
                            const active = q.opts.type === t.id;
                            return (
                              <button key={t.id} onClick={() => changeType(qi, t.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${active ? "border-[#136dec] bg-blue-50 dark:bg-[#136dec]/10 text-[#136dec]" : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600"}`}>
                                <TIcon className="h-3.5 w-3.5" /> {t.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Content textarea */}
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Texto de la pregunta</label>
                        <textarea rows={2} value={q.content} onChange={e => setContent(qi, e.target.value)}
                          placeholder="Ej. ¿Con qué frecuencia ha tenido poco interés o placer en hacer las cosas?"
                          className="w-full bg-slate-50 dark:bg-[#111822] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm resize-none outline-none focus:ring-2 focus:ring-[#136dec] focus:border-transparent transition-all placeholder:text-slate-400" />
                      </div>

                      {/* Hint */}
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Instrucción / Pista (opcional)</label>
                        <input type="text" value={q.hint} onChange={e => setHint(qi, e.target.value)}
                          placeholder="Ej. Considera los últimos 14 días"
                          className="w-full h-9 px-3 bg-slate-50 dark:bg-[#111822] border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#136dec] focus:border-transparent transition-all placeholder:text-slate-400" />
                      </div>

                      {/* Type-specific editor */}
                      {(q.opts.type === "likert" || q.opts.type === "single_choice") && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Opciones de respuesta</label>
                            {q.opts.type === "likert" && (
                              <div className="relative">
                                <button onClick={() => setTemplate(p => ({ ...p, [qi]: !p[qi] }))}
                                  className="flex items-center gap-1.5 text-xs font-semibold text-[#136dec] hover:text-blue-700 transition-colors">
                                  <TemplateIcon className="h-3.5 w-3.5" /> Plantillas
                                </button>
                                {template[qi] && (
                                  <div className="absolute right-0 top-6 z-20 w-52 bg-white dark:bg-[#1a2432] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl py-1">
                                    {Object.entries(LIKERT_TEMPLATES).map(([key, tpl]) => (
                                      <button key={key} onClick={() => applyTemplate(qi, key)}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        {tpl.label}
                                        <span className="ml-2 text-xs text-slate-400">{tpl.choices.length} opciones</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            {(q.opts as LikertOpts | SingleOpts).choices.map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2">
                                <GripVertical className="h-4 w-4 text-slate-300 shrink-0" />
                                <input type="text" value={opt.text} onChange={e => setChoice(qi, oi, "text", e.target.value)}
                                  placeholder={`Opción ${oi + 1}`}
                                  className="flex-1 h-9 px-3 bg-white dark:bg-[#111822] border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#136dec] focus:border-transparent transition-all" />
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-xs text-slate-400 font-medium">Score</span>
                                  <input type="number" value={opt.score} onChange={e => setChoice(qi, oi, "score", e.target.value)}
                                    className="w-14 h-9 px-2 text-center bg-white dark:bg-[#111822] border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-[#136dec] focus:border-transparent transition-all" />
                                </div>
                                <button onClick={() => removeChoice(qi, oi)} className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors">
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <button onClick={() => addChoice(qi)} className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#136dec] hover:text-blue-700 transition-colors">
                            <Plus className="h-3.5 w-3.5" /> Añadir opción
                          </button>
                        </div>
                      )}

                      {q.opts.type === "yesno" && (
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Configuración Sí / No</label>
                          <div className="grid grid-cols-2 gap-4">
                            {(["yes", "no"] as const).map(side => (
                              <div key={side} className={`p-4 rounded-xl border-2 ${side === "yes" ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10" : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10"}`}>
                                <p className={`text-sm font-bold mb-3 ${side === "yes" ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{side === "yes" ? "✅ Respuesta Sí" : "❌ Respuesta No"}</p>
                                <div className="space-y-2">
                                  <div>
                                    <label className="text-xs text-slate-500 font-medium">Etiqueta</label>
                                    <input type="text" value={side === "yes" ? (q.opts as YesNoOpts).yes_label : (q.opts as YesNoOpts).no_label}
                                      onChange={e => setOpts(qi, prev => {
                                        if (prev.type !== "yesno") return prev;
                                        return { ...prev, [`${side}_label`]: e.target.value };
                                      })}
                                      className="w-full h-8 px-2 mt-1 bg-white dark:bg-[#111822] border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#136dec] transition-all" />
                                  </div>
                                  <div>
                                    <label className="text-xs text-slate-500 font-medium">Score</label>
                                    <input type="number" value={side === "yes" ? (q.opts as YesNoOpts).yes_score : (q.opts as YesNoOpts).no_score}
                                      onChange={e => setOpts(qi, prev => {
                                        if (prev.type !== "yesno") return prev;
                                        return { ...prev, [`${side}_score`]: Number(e.target.value) };
                                      })}
                                      className="w-full h-8 px-2 mt-1 text-center bg-white dark:bg-[#111822] border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-[#136dec] transition-all" />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {q.opts.type === "vas" && (
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Configuración Escala Visual (0-10)</label>
                          <div className="grid grid-cols-2 gap-4">
                            {(["min", "max"] as const).map(side => {
                              const opts = q.opts as VASOpts;
                              return (
                                <div key={side}>
                                  <label className="text-xs font-semibold text-slate-500">{side === "min" ? "Extremo Izquierdo (0)" : "Extremo Derecho (10)"}</label>
                                  <input type="text" value={side === "min" ? opts.min_label : opts.max_label}
                                    placeholder={side === "min" ? "Ej. Nada / Sin dolor" : "Ej. Extremadamente / Dolor máximo"}
                                    onChange={e => setOpts(qi, prev => {
                                      if (prev.type !== "vas") return prev;
                                      return { ...prev, [`${side}_label`]: e.target.value };
                                    })}
                                    className="w-full h-9 px-3 mt-1 bg-white dark:bg-[#111822] border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#136dec] transition-all" />
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-4 p-3 bg-slate-50 dark:bg-[#111822] rounded-xl border border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-slate-400 font-medium mb-2">Vista previa del paciente:</p>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-500">{(q.opts as VASOpts).min_label || "0"}</span>
                              <div className="flex-1 h-2 bg-gradient-to-r from-[#0bda5e] via-yellow-400 to-red-500 rounded-full" />
                              <span className="text-xs text-slate-500">{(q.opts as VASOpts).max_label || "10"}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {q.opts.type === "free_text" && (
                        <div className="p-4 bg-slate-50 dark:bg-[#111822] rounded-xl border border-slate-200 dark:border-slate-700">
                          <p className="text-xs text-slate-400 font-medium mb-2">Vista previa del paciente:</p>
                          <div className="h-20 bg-white dark:bg-[#1a2432] rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                            <span className="text-slate-400 text-sm italic">El paciente verá un campo de texto libre aquí</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-2">⚠️ Las respuestas de texto libre no generan puntaje automático.</p>
                        </div>
                      )}

                      {q.opts.type === "interactive_game" && (
                        <div className="space-y-4">
                          {/* Template selector */}
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Plantilla de Juego</label>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(GAME_TEMPLATES).map(([key, tpl]) => (
                                <button key={key}
                                  onClick={() => setOpts(qi, _ => ({
                                    type: "interactive_game",
                                    game_type: tpl.game_type,
                                    config_json: JSON.stringify(tpl.config, null, 2),
                                    capture_metrics: tpl.metrics,
                                  }))}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:border-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/10 hover:text-pink-600 transition-all">
                                  {tpl.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* JSON Config editor */}
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Configuración JSON del Juego</label>
                            <textarea rows={10} value={(q.opts as GameOpts).config_json}
                              onChange={e => setOpts(qi, prev => ({ ...prev, config_json: e.target.value } as GameOpts))}
                              spellCheck={false}
                              className="w-full px-4 py-3 bg-[#0f172a] text-green-400 font-mono text-xs rounded-xl border border-slate-700 resize-y outline-none focus:ring-2 focus:ring-pink-500 transition-all" />
                            <p className="text-xs text-slate-400 mt-1">
                              Define la configuración del juego en JSON. Usa el campo <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">capture</code> para indicar qué métricas registrar en <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">interactive_sessions</code>.
                            </p>
                          </div>

                          {/* Metrics */}
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Métricas a Capturar</label>
                            <input type="text" value={(q.opts as GameOpts).capture_metrics}
                              onChange={e => setOpts(qi, prev => ({ ...prev, capture_metrics: e.target.value } as GameOpts))}
                              placeholder="accuracy_pct, reaction_time_ms, errors"
                              className="w-full h-9 px-3 bg-white dark:bg-[#111822] border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all" />
                            <p className="text-xs text-slate-400 mt-1">Se almacenarán en <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">interactive_sessions.metrics</code> como JSON.</p>
                          </div>

                          <div className="flex items-center gap-2 p-3 bg-pink-50 dark:bg-pink-900/10 rounded-xl border border-pink-200 dark:border-pink-800 text-xs text-pink-700 dark:text-pink-400">
                            <Gamepad2 className="h-4 w-4 shrink-0" />
                            <span>Los datos del juego se guardarán automáticamente al completar.</span>
                          </div>

                          {/* Live preview */}
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Vista Previa Interactiva</label>
                            <GamePreview opts={q.opts as GameOpts} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {questions.length > 0 && (
            <button onClick={() => addQuestion("likert")}
              className="mt-4 w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-400 hover:border-[#136dec] hover:text-[#136dec] dark:hover:border-[#136dec] transition-colors flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" /> Añadir otra pregunta
            </button>
          )}
        </div>

        {questions.length > 0 && (
          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-[#136dec] hover:bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-[#136dec]/20 transition-all disabled:opacity-70">
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {saving ? "Guardando..." : flash ? "¡Guardado!" : "Guardar Examen"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Game preview (admin only, sandbox) ──────────────────── */
function GamePreview({ opts }: { opts: GameOpts }) {
  const [metrics, setMetrics] = useState<Record<string, number | string> | null>(null);
  const [key, setKey] = useState(0);

  let parsed: any = {};
  let parseError: string | null = null;
  try {
    parsed = JSON.parse(opts.config_json);
  } catch (e: any) {
    parseError = e.message;
  }

  if (parseError) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
        ⚠️ JSON inválido: {parseError}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <GameRenderer key={key} config={parsed} preview onComplete={setMetrics} />
      {metrics && (
        <div className="p-4 bg-slate-900 text-green-400 rounded-xl font-mono text-xs">
          <div className="flex items-center justify-between mb-2 text-slate-400">
            <span>📊 Datos capturados (interactive_sessions.metrics)</span>
            <button onClick={() => { setMetrics(null); setKey(k => k + 1); }}
              className="text-[#136dec] font-sans font-semibold hover:underline">
              Reiniciar
            </button>
          </div>
          <pre>{JSON.stringify(metrics, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
