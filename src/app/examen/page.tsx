"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
 ArrowLeft, ArrowRight, Brain, Clock, Flag,
 CheckCircle2, AlertCircle, AlignLeft, Gamepad2
} from "lucide-react";
import { createClient } from "../../../utils/supabase/client";
import GameRenderer from "../../components/GameRenderer";

/* ── Types ───────────────────────────────────────────────────── */
type QType = "likert" | "yesno" | "vas" | "single_choice" | "free_text" | "interactive_game";
interface Choice { text: string; score: number }
interface Question {
 id: string;
 order_index: number;
 content: string;
 hint: string;
 type: QType;
 choices?: Choice[];
 yes_label?: string; yes_score?: number;
 no_label?: string; no_score?: number;
 min?: number; max?: number; min_label?: string; max_label?: string;
 game_config?: any;
}

function parseQuestion(raw: any): Question {
 const opts = raw.options;
 const hint = typeof opts?.hint === "string" ? opts.hint : "";
 if (Array.isArray(opts)) {
 return { id: raw.id, order_index: raw.order_index, content: raw.content ?? "", hint: "", type: "likert", choices: opts };
 }
 const type: QType = opts?.type ?? "likert";
 const base = { id: raw.id, order_index: raw.order_index, content: raw.content ?? "", hint };
 switch (type) {
 case "yesno": return { ...base, type, yes_label: opts.yes_label ?? "Sí", yes_score: opts.yes_score ?? 1, no_label: opts.no_label ?? "No", no_score: opts.no_score ?? 0 };
 case "vas": return { ...base, type, min: opts.min ?? 0, max: opts.max ?? 10, min_label: opts.min_label ?? "", max_label: opts.max_label ?? "" };
 case "single_choice": return { ...base, type, choices: opts.choices ?? [] };
 case "free_text": return { ...base, type };
 case "interactive_game": {
 let cfg: any = {};
 try { cfg = typeof opts.config_json === "string" ? JSON.parse(opts.config_json) : (opts.config ?? {}); } catch { cfg = {}; }
 return { ...base, type, game_config: { ...cfg, game_type: opts.game_type ?? cfg.game_type ?? "memory_cards" } };
 }
 default: return { ...base, type: "likert", choices: opts.choices ?? [] };
 }
}

/* ── Main component ──────────────────────────────────────────── */
function ExamenContent() {
 const searchParams = useSearchParams();
 const router = useRouter();
 const attemptId = searchParams.get("attempt");

 const [examTitle, setExamTitle] = useState("Evaluación en Progreso");
 const [questions, setQuestions] = useState<Question[]>([]);
 const [current, setCurrent] = useState(0);
 const [answers, setAnswers] = useState<Record<string, number | string>>({});
 // Opción elegida por índice: varias opciones pueden puntuar igual (p. ej. AQ-50).
 const [picked, setPicked] = useState<Record<string, number>>({});
 const [gameMetrics, setGameMetrics] = useState<Record<string, Record<string, number | string>>>({});
 const [flagged, setFlagged] = useState<Set<number>>(new Set());
 const [loading, setLoading] = useState(true);
 const [submitting, setSubmitting] = useState(false);
 const [done, setDone] = useState(false);
 const [elapsed, setElapsed] = useState(0);
 const [patientId, setPatientId] = useState<string | null>(null);
 // Si quien responde no es el paciente (madre/padre o especialista), a nombre de quién responde.
 const [onBehalfOf, setOnBehalfOf] = useState<string | null>(null);
 const [backHref, setBackHref] = useState("/paciente");
 const [submitError, setSubmitError] = useState<string | null>(null);

 /* Timer */
 useEffect(() => {
 const t = setInterval(() => setElapsed(s => s + 1), 1000);
 return () => clearInterval(t);
 }, []);
 const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

 /* Load exam */
 useEffect(() => {
 const load = async () => {
 const supabase = createClient();
 const { data: { user } } = await supabase.auth.getUser();
 if (user) setPatientId(user.id);
 const role = user?.app_metadata?.role;
 setBackHref(role === "tutor" ? "/tutor" : role === "especialista" ? "/especialista" : "/paciente");
 if (attemptId) {
 const { data: att } = await supabase
 .from("exam_attempts")
 .select("exam_id, patient_id, status, exams!inner(title)")
 .eq("id", attemptId)
 .single();
 if (att) {
 setExamTitle((att as any).exams?.title ?? "Evaluación");
 if (att.status === "completed") setDone(true);
 // Las métricas de juegos y el resultado pertenecen al paciente, no a quien responde.
 setPatientId(att.patient_id);
 if (user && att.patient_id !== user.id) {
 const { data: p } = await supabase.from("profiles").select("full_name").eq("id", att.patient_id).maybeSingle();
 setOnBehalfOf(p?.full_name ?? "el paciente");
 }
 const { data: qs } = await supabase
 .from("questions")
 .select("id, order_index, content, options")
 .eq("exam_id", (att as any).exam_id)
 .order("order_index");
 if (qs) setQuestions(qs.map(parseQuestion));
 }
 } else {
 // Demo mode: load any published exam
 const { data: exam } = await supabase
 .from("exams")
 .select("id, title")
 .eq("is_published", true)
 .limit(1)
 .single();
 if (exam) {
 setExamTitle(exam.title);
 const { data: qs } = await supabase
 .from("questions")
 .select("id, order_index, content, options")
 .eq("exam_id", exam.id)
 .order("order_index");
 if (qs) setQuestions(qs.map(parseQuestion));
 }
 }
 setLoading(false);
 };
 load();
 }, [attemptId]);

 const q = questions[current];
 const progress = questions.length ? ((current + 1) / questions.length) * 100 : 0;
 const answer = q ? answers[q.id] : undefined;
 const answered = answer !== undefined && answer !== "";

 /* Answer setters */
 const setAnswer = useCallback((val: number | string) => {
 if (!q) return;
 setAnswers(prev => ({ ...prev, [q.id]: val }));
 }, [q]);

 /* Submit */
 const handleSubmit = async () => {
 if (!attemptId) { setDone(true); return; }
 setSubmitting(true);
 const supabase = createClient();

 setSubmitError(null);

 // Game sessions
 if (patientId) {
 const gameRows = questions
 .filter(q => q.type === "interactive_game" && gameMetrics[q.id])
 .map(q => ({
 patient_id: patientId,
 attempt_id: attemptId,
 game_type: q.game_config?.game_type ?? "custom",
 metrics: gameMetrics[q.id],
 session_start: new Date(Date.now() - 60000).toISOString(),
 session_end: new Date().toISOString(),
 }));
 if (gameRows.length) await supabase.from("interactive_sessions").insert(gameRows);
 }

 // La BD valida cada puntaje contra las opciones, suma y aplica la regla por edad
 // (public.submit_attempt). El navegador ya no decide el puntaje total.
 const numeric = Object.fromEntries(
 questions
 .filter(q => (q.type === "likert" || q.type === "single_choice" || q.type === "vas" || q.type === "yesno") && answers[q.id] !== undefined)
 .map(q => [q.id, Number(answers[q.id])])
 );
 const { error } = await supabase.rpc("submit_attempt", { p_attempt: attemptId, p_answers: numeric });

 setSubmitting(false);
 if (error) {
 setSubmitError(error.code === "23505" ? "Esta evaluación ya había sido enviada." : "No pudimos guardar tus respuestas. Revisa tu conexión e inténtalo otra vez; no se perdió nada.");
 return;
 }
 setDone(true);
 };

 /* ── Done screen ── */
 if (done) {
 return (
 <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
 <div className="max-w-md w-full bg-surface rounded-3xl shadow-xl border border-slate-200 p-10 text-center">
 <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-accent to-brand flex items-center justify-center mx-auto mb-6">
 <CheckCircle2 className="h-10 w-10 text-white" />
 </div>
 <h1 className="text-2xl font-black mb-2">¡Examen completado!</h1>
 <p className="text-slate-500 mb-8">
 {onBehalfOf
 ? `Guardamos tus respuestas sobre ${onBehalfOf}. El especialista las verá corregidas antes de la próxima sesión.`
 : "Tus respuestas han sido registradas. Tu especialista revisará los resultados."}
 </p>
 <Link href={backHref} className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-brand/20">
 Volver al inicio
 </Link>
 </div>
 </div>
 );
 }

 /* ── Loading ── */
 if (loading) {
 return (
 <div className="min-h-screen bg-slate-50 flex items-center justify-center">
 <div className="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full" />
 </div>
 );
 }

 /* ── No questions ── */
 if (!questions.length) {
 return (
 <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
 <AlertCircle className="h-12 w-12 text-slate-400" />
 <p className="font-bold text-slate-600 ">Este examen no tiene preguntas aún.</p>
 <Link href={backHref} className="text-brand font-semibold hover:underline">← Volver</Link>
 </div>
 );
 }

 /* ── Exam ── */
 const isLast = current === questions.length - 1;

 return (
 <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">

 {/* Header */}
 <header className="bg-surface border-b border-slate-200 sticky top-0 z-50">
 <div className="h-1.5 w-full bg-slate-100 ">
 <div className="h-full bg-gradient-to-r from-accent to-brand transition-all duration-500" style={{ width: `${progress}%` }} />
 </div>
 <div className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
 <div className="flex items-center gap-4">
 <Link href={backHref} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors">
 <ArrowLeft className="h-5 w-5" />
 </Link>
 <div>
 <h1 className="font-bold text-sm md:text-base truncate max-w-[200px] md:max-w-xs">{examTitle}</h1>
 <p className="text-xs text-slate-500">Pregunta {current + 1} de {questions.length}</p>
 </div>
 </div>
 <div className="flex items-center gap-4">
 <div className="hidden md:flex items-center gap-2 text-sm font-semibold text-slate-500">
 <Clock className="h-4 w-4" /><span>{fmtTime(elapsed)}</span>
 </div>
 <div className="font-bold text-sm bg-slate-100 px-3 py-1.5 rounded-lg">
 {current + 1}/{questions.length}
 </div>
 </div>
 </div>
 </header>

 {onBehalfOf && (
 <div className="bg-aji/40 border-b border-aji">
 <p className="max-w-5xl mx-auto px-6 py-2.5 text-sm text-ink">
 Respondes sobre <strong className="font-semibold">{onBehalfOf}</strong>. Contesta pensando en cómo es habitualmente, no en un día puntual.
 </p>
 </div>
 )}

 {/* Question */}
 <main className="flex-1 flex items-center justify-center p-6 pb-28">
 <div className="w-full max-w-3xl">

 {/* Mini nav dots */}
 <div className="flex items-center justify-center gap-1.5 mb-6 flex-wrap">
 {questions.map((_, i) => (
 <button key={i} onClick={() => setCurrent(i)}
 className={`h-2 rounded-full transition-all ${i === current ? "w-6 bg-brand" : answers[questions[i].id] !== undefined ? "w-2 bg-accent" : flagged.has(i) ? "w-2 bg-yellow-400" : "w-2 bg-slate-200 "}`} />
 ))}
 </div>

 <div className="bg-surface rounded-3xl shadow-sm border border-slate-200 p-8 md:p-12 relative overflow-hidden">
 <div className="absolute top-0 right-0 p-8 opacity-5"><Brain className="h-32 w-32 text-brand" /></div>
 <div className="relative z-10">

 {/* Type badge */}
 {q.hint && (
 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-brand text-xs font-bold uppercase tracking-wider mb-4">
 <AlertCircle className="h-3.5 w-3.5" /> {q.hint}
 </div>
 )}

 <h2 className="text-xl md:text-3xl font-black leading-tight mb-8">{q.content}</h2>

 {/* ── Likert / SingleChoice ── */}
 {(q.type === "likert" || q.type === "single_choice") && q.choices && (
 <div className="space-y-3">
 {q.choices.map((choice, i) => {
 const selected = picked[q.id] === i;
 return (
 <label key={i} onClick={() => { setAnswer(choice.score); setPicked(p => ({ ...p, [q.id]: i })); }}
 className={`group flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all ${selected ? "border-brand bg-blue-50/50 " : "border-slate-200 hover:border-brand bg-surface "}`}>
 <div className="flex items-center gap-4">
 <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${selected ? "border-brand bg-brand" : "border-slate-300 group-hover:border-brand"}`}>
 {selected && <div className="h-2.5 w-2.5 rounded-full bg-surface" />}
 </div>
 <span className={`font-semibold text-lg ${selected ? "text-brand" : ""}`}>{choice.text}</span>
 </div>

 </label>
 );
 })}
 </div>
 )}

 {/* ── Sí/No ── */}
 {q.type === "yesno" && (
 <div className="grid grid-cols-2 gap-4">
 {[
 { label: q.yes_label ?? "Sí", score: q.yes_score ?? 1, color: "green" },
 { label: q.no_label ?? "No", score: q.no_score ?? 0, color: "red" },
 ].map(opt => {
 const selected = answer === opt.score;
 const isGreen = opt.color === "green";
 return (
 <button key={opt.label} onClick={() => setAnswer(opt.score)}
 className={`p-6 rounded-2xl border-2 font-black text-xl transition-all ${selected ? isGreen ? "border-green-500 bg-green-50 text-green-700 " : "border-red-500 bg-red-50 text-red-600 " : "border-slate-200 hover:border-slate-300 bg-surface "}`}>
 {selected ? (isGreen ? "✅ " : "❌ ") : ""}{opt.label}
 </button>
 );
 })}
 </div>
 )}

 {/* ── VAS 0-10 ── */}
 {q.type === "vas" && (
 <div className="space-y-6">
 <div className="flex items-center justify-between text-sm font-semibold">
 <span className="text-slate-500">{q.min_label || String(q.min ?? 0)}</span>
 <span className="text-4xl font-black text-brand">{answer ?? "—"}</span>
 <span className="text-slate-500">{q.max_label || String(q.max ?? 10)}</span>
 </div>
 <input type="range" min={q.min ?? 0} max={q.max ?? 10} step={1}
 value={answer !== undefined ? Number(answer) : Math.floor(((q.max ?? 10) - (q.min ?? 0)) / 2) + (q.min ?? 0)}
 onChange={e => setAnswer(Number(e.target.value))}
 className="w-full h-3 rounded-full appearance-none cursor-pointer accent-brand bg-gradient-to-r from-accent via-yellow-400 to-red-500" />
 <div className="flex justify-between text-xs text-slate-400 font-medium">
 {Array.from({ length: (q.max ?? 10) - (q.min ?? 0) + 1 }, (_, i) => (
 <span key={i}>{(q.min ?? 0) + i}</span>
 ))}
 </div>
 </div>
 )}

 {/* ── Texto Libre ── */}
 {q.type === "free_text" && (
 <div>
 <textarea rows={5} value={String(answer ?? "")}
 onChange={e => setAnswer(e.target.value)}
 placeholder="Escribe tu respuesta aquí..."
 className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-base resize-none outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all placeholder:text-slate-400" />
 <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
 <AlignLeft className="h-3.5 w-3.5" /> Esta respuesta es cualitativa y no genera puntaje.
 </div>
 </div>
 )}

 {/* ── Juego Interactivo ── */}
 {q.type === "interactive_game" && q.game_config && (
 <div>
 <GameRenderer
 config={q.game_config}
 onComplete={(metrics) => {
 setGameMetrics(prev => ({ ...prev, [q.id]: metrics }));
 setAnswer(JSON.stringify(metrics));
 }}
 />
 {gameMetrics[q.id] && (
 <div className="mt-3 flex items-center gap-2 text-xs text-accent font-semibold">
 <CheckCircle2 className="h-4 w-4" /> Datos capturados — puedes continuar
 </div>
 )}
 </div>
 )}
 </div>
 </div>

 <div className="flex items-center justify-between mt-6 px-2">
 <button onClick={() => setFlagged(prev => { const n = new Set(prev); n.has(current) ? n.delete(current) : n.add(current); return n; })}
 className={`flex items-center gap-2 text-sm font-semibold transition-colors ${flagged.has(current) ? "text-yellow-600" : "text-slate-500 hover:text-slate-900 "}`}>
 <Flag className="h-4 w-4" /> {flagged.has(current) ? "Marcada" : "Marcar para revisar"}
 </button>
 </div>
 </div>
 </main>

 {/* Footer */}
 <footer className="fixed bottom-0 w-full bg-surface/80 backdrop-blur-md border-t border-slate-200 p-4">
 {submitError && (
 <p role="alert" className="max-w-5xl mx-auto mb-3 rounded-xl bg-bad-soft px-4 py-2.5 text-sm text-bad">{submitError}</p>
 )}
 <div className="max-w-5xl mx-auto flex items-center justify-between">
 <button onClick={() => setCurrent(p => Math.max(0, p - 1))} disabled={current === 0}
 className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors">
 Anterior
 </button>
 {isLast ? (
 <button onClick={handleSubmit} disabled={submitting}
 className="flex items-center gap-2 px-8 py-3 bg-accent text-white rounded-xl font-bold shadow-lg shadow-accent/20 hover:opacity-90 transition-all active:scale-95 disabled:opacity-70">
 {submitting ? "Enviando..." : <><CheckCircle2 className="h-5 w-5" /> Finalizar Examen</>}
 </button>
 ) : (
 <button onClick={() => setCurrent(p => Math.min(questions.length - 1, p + 1))}
 className="flex items-center gap-2 px-8 py-3 bg-brand text-white rounded-xl font-bold shadow-lg shadow-brand/20 hover:bg-blue-600 transition-transform hover:scale-105 active:scale-95">
 Siguiente <ArrowRight className="h-5 w-5" />
 </button>
 )}
 </div>
 </footer>
 </div>
 );
}

export default function ExamenPage() {
 return (
 <Suspense fallback={
 <div className="min-h-screen bg-slate-50 flex items-center justify-center">
 <div className="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full" />
 </div>
 }>
 <ExamenContent />
 </Suspense>
 );
}
