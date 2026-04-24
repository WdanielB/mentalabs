"use client";

import { useEffect, useState } from "react";
import {
  Plus, Trash2, Pencil, Save, X, ChevronDown, ChevronUp,
  ShieldCheck, Search, AlertCircle, CheckCircle2, Loader2
} from "lucide-react";
import AdminSidebar from "../../../../components/AdminSidebar";
import { createRule, updateRule, deleteRule, listExams, listRulesForExam } from "../../../../actions/exams";

/* ── Types ── */
interface Exam { id: string; title: string; battery: string; diagnosis_type: string }
interface Rule {
  id: string; exam_id: string;
  min_score: number; max_score: number;
  min_age: number | null; max_age: number | null;
  subcategory: string;
  recommendations: string[];
  isEditing?: boolean;
}

/* ── Helpers ── */
function parseMeta(desc: string | null) {
  if (!desc) return { battery: "", diagnosis_type: "" };
  try { const p = JSON.parse(desc); return { battery: p.battery ?? "", diagnosis_type: p.diagnosis_type ?? "" }; }
  catch { return { battery: "", diagnosis_type: "" }; }
}

const DIAGNOSIS_COLORS: Record<string, string> = {
  "TDAH":      "bg-blue-100 text-blue-700 dark:bg-blue-900/20",
  "TEA":       "bg-purple-100 text-purple-700 dark:bg-purple-900/20",
  "Ansiedad":  "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20",
  "Depresión": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20",
  "General":   "bg-slate-100 text-slate-600 dark:bg-slate-800",
};
const diagColor = (t: string) => DIAGNOSIS_COLORS[t] ?? "bg-slate-100 text-slate-600 dark:bg-slate-800";

/* ── Rule Form (inline) ── */
function RuleForm({
  initial, onSave, onCancel,
}: {
  initial?: Partial<Rule>;
  onSave: (r: Omit<Rule, "id" | "exam_id" | "isEditing">) => Promise<void>;
  onCancel: () => void;
}) {
  const [minScore, setMinScore]   = useState(String(initial?.min_score ?? 0));
  const [maxScore, setMaxScore]   = useState(String(initial?.max_score ?? 100));
  const [minAge,   setMinAge]     = useState(String(initial?.min_age ?? ""));
  const [maxAge,   setMaxAge]     = useState(String(initial?.max_age ?? ""));
  const [subcat,   setSubcat]     = useState(initial?.subcategory ?? "");
  const [recs,     setRecs]       = useState((initial?.recommendations ?? []).join("\n"));
  const [saving,   setSaving]     = useState(false);

  const handle = async () => {
    if (!subcat.trim()) return;
    setSaving(true);
    await onSave({
      min_score: Number(minScore) || 0,
      max_score: Number(maxScore) || 100,
      min_age:   minAge  ? Number(minAge)  : null,
      max_age:   maxAge  ? Number(maxAge)  : null,
      subcategory: subcat.trim(),
      recommendations: recs.split("\n").map(r => r.trim()).filter(Boolean),
    });
    setSaving(false);
  };

  return (
    <div className="bg-slate-50 dark:bg-[#111822] rounded-2xl border-2 border-[#136dec]/40 p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Score Mínimo</label>
          <input type="number" value={minScore} onChange={e => setMinScore(e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2432] text-sm outline-none focus:ring-2 focus:ring-[#136dec] transition-all" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Score Máximo</label>
          <input type="number" value={maxScore} onChange={e => setMaxScore(e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2432] text-sm outline-none focus:ring-2 focus:ring-[#136dec] transition-all" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Edad Mínima (opcional)</label>
          <input type="number" value={minAge} onChange={e => setMinAge(e.target.value)} placeholder="Ej. 18"
            className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2432] text-sm outline-none focus:ring-2 focus:ring-[#136dec] transition-all" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Edad Máxima (opcional)</label>
          <input type="number" value={maxAge} onChange={e => setMaxAge(e.target.value)} placeholder="Ej. 65"
            className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2432] text-sm outline-none focus:ring-2 focus:ring-[#136dec] transition-all" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Subcategoría / Diagnóstico *</label>
        <input type="text" value={subcat} onChange={e => setSubcat(e.target.value)}
          placeholder="Ej. Depresión Moderada, TDAH Predominantemente Inatento"
          className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2432] text-sm outline-none focus:ring-2 focus:ring-[#136dec] transition-all" />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Recomendaciones (una por línea)</label>
        <textarea rows={4} value={recs} onChange={e => setRecs(e.target.value)}
          placeholder={"Terapia Cognitivo-Conductual\nEvaluación neuropsicológica\nRevisión en 4 semanas"}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2432] text-sm resize-none outline-none focus:ring-2 focus:ring-[#136dec] focus:border-transparent transition-all" />
        <p className="text-xs text-slate-400 mt-1">Cada línea será una recomendación separada</p>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={handle} disabled={!subcat.trim() || saving}
          className="flex items-center gap-2 px-4 py-2 bg-[#136dec] text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Guardando..." : "Guardar Regla"}
        </button>
        <button onClick={onCancel} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Cancelar</button>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function ReglasPage() {
  const [exams,       setExams]       = useState<Exam[]>([]);
  const [examSearch,  setExamSearch]  = useState("");
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [rules,       setRules]       = useState<Rule[]>([]);
  const [loadingExams,setLoadingExams]= useState(true);
  const [loadingRules,setLoadingRules]= useState(false);
  const [addingRule,  setAddingRule]  = useState(false);
  const [expandedR,   setExpandedR]   = useState<Set<string>>(new Set());
  const [flash,       setFlash]       = useState<string | null>(null);

  /* Load exams via Server Action */
  useEffect(() => {
    (async () => {
      const data = await listExams();
      setExams(data.map((e: any) => ({ id: e.id, title: e.title, ...parseMeta(e.description) })));
      setLoadingExams(false);
    })();
  }, []);

  /* Load rules when exam selected */
  useEffect(() => {
    if (!selectedId) { setRules([]); return; }
    setLoadingRules(true);
    (async () => {
      const data = await listRulesForExam(selectedId);
      setRules(data.map((r: any) => ({
        id: r.id, exam_id: r.exam_id,
        min_score: r.min_score, max_score: r.max_score,
        min_age: r.min_age, max_age: r.max_age,
        subcategory: r.subcategory,
        recommendations: Array.isArray(r.recommendations) ? r.recommendations : [],
      })));
      setLoadingRules(false);
    })();
  }, [selectedId]);

  const showFlash = (msg: string) => { setFlash(msg); setTimeout(() => setFlash(null), 2500); };

  const handleAddRule = async (data: Omit<Rule, "id" | "exam_id" | "isEditing">) => {
    if (!selectedId) return;
    try {
      const r = await createRule(selectedId, data);
      setRules(prev => [...prev, { ...r, recommendations: Array.isArray(r.recommendations) ? r.recommendations : [] }]);
      setAddingRule(false);
      showFlash("Regla añadida");
    } catch (e: any) { alert(`Error: ${e.message}`); }
  };

  const handleUpdateRule = async (id: string, data: Omit<Rule, "id" | "exam_id" | "isEditing">) => {
    try {
      await updateRule(id, data);
      setRules(prev => prev.map(r => r.id === id ? { ...r, ...data, isEditing: false } : r));
      showFlash("Regla actualizada");
    } catch (e: any) { alert(`Error: ${e.message}`); }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("¿Eliminar esta regla diagnóstica?")) return;
    try {
      await deleteRule(id);
      setRules(prev => prev.filter(r => r.id !== id));
      showFlash("Regla eliminada");
    } catch (e: any) { alert(`Error: ${e.message}`); }
  };

  const selectedExam = exams.find(e => e.id === selectedId);
  const filteredExams = exams.filter(e => e.title.toLowerCase().includes(examSearch.toLowerCase()));

  /* Severity color by score range */
  const severityColor = (min: number, max: number, globalMax: number) => {
    const pct = (min + max) / 2 / (globalMax || 100);
    if (pct < 0.33) return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
    if (pct < 0.66) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
    return "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400";
  };
  const globalMax = rules.length ? Math.max(...rules.map(r => r.max_score)) : 100;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#111822] text-slate-900 dark:text-slate-100 flex font-sans">
      <AdminSidebar />

      <main className="flex-1 lg:ml-64 flex flex-col lg:flex-row h-screen overflow-hidden">

        {/* ── LEFT: Exam list ── */}
        <div className="w-full lg:w-80 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2432] shrink-0">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-bold text-base mb-3 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[#0bda5e]" /> Exámenes</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input type="text" value={examSearch} onChange={e => setExamSearch(e.target.value)} placeholder="Buscar examen..."
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#111822] text-sm outline-none focus:ring-2 focus:ring-[#136dec] transition-all" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingExams && Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="mx-3 my-2 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
            {filteredExams.map(exam => (
              <button key={exam.id} onClick={() => setSelectedId(exam.id)}
                className={`w-full flex flex-col items-start gap-1 px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-left transition-colors relative ${selectedId === exam.id ? "bg-blue-50 dark:bg-[#136dec]/10" : "hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                {selectedId === exam.id && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#136dec]" />}
                <p className="font-semibold text-sm truncate w-full">{exam.title}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {exam.battery && <span className="text-xs text-slate-400">{exam.battery}</span>}
                  {exam.diagnosis_type && (
                    <span className={`text-xs font-bold px-2 py-0 rounded-full ${diagColor(exam.diagnosis_type)}`}>{exam.diagnosis_type}</span>
                  )}
                </div>
              </button>
            ))}
            {!loadingExams && filteredExams.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">Sin resultados</div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Rules panel ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ShieldCheck className="h-14 w-14 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <p className="font-bold text-slate-500 text-lg">Selecciona un examen</p>
                <p className="text-slate-400 text-sm mt-1">para ver y gestionar sus reglas diagnósticas</p>
              </div>
            </div>
          ) : (
            <>
              {/* Rules header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2432] shrink-0">
                <div>
                  <h2 className="font-bold text-base truncate">{selectedExam?.title}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{rules.length} regla{rules.length !== 1 ? "s" : ""} configurada{rules.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex items-center gap-3">
                  {flash && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-[#0bda5e] bg-green-50 dark:bg-green-900/10 px-3 py-1.5 rounded-full">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {flash}
                    </span>
                  )}
                  <button onClick={() => { setAddingRule(true); setExpandedR(new Set()); }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#136dec] text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors shadow-md shadow-[#136dec]/20">
                    <Plus className="h-4 w-4" /> Añadir Regla
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Explanation */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800 text-sm text-[#136dec]">
                  <p className="font-semibold mb-1">¿Cómo funcionan las reglas?</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Al completar el examen, el sistema compara el puntaje total y la edad del paciente con estas reglas para generar un diagnóstico automático y recomendaciones.</p>
                </div>

                {loadingRules && Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl bg-white dark:bg-[#1a2432] border border-slate-200 dark:border-slate-800 animate-pulse" />
                ))}

                {/* Add rule form */}
                {addingRule && (
                  <RuleForm onSave={handleAddRule} onCancel={() => setAddingRule(false)} />
                )}

                {/* Rules list */}
                {!loadingRules && rules.length === 0 && !addingRule && (
                  <div className="text-center py-12 bg-white dark:bg-[#1a2432] rounded-2xl border border-slate-200 dark:border-slate-800">
                    <AlertCircle className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-slate-500">Sin reglas configuradas</p>
                    <p className="text-slate-400 text-sm mt-1">Añade reglas para que el sistema genere diagnósticos automáticos</p>
                  </div>
                )}

                {rules.map(rule => {
                  const isOpen = expandedR.has(rule.id);
                  const sColor = severityColor(rule.min_score, rule.max_score, globalMax);
                  return (
                    <div key={rule.id} className="bg-white dark:bg-[#1a2432] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                      {rule.isEditing ? (
                        <div className="p-5">
                          <RuleForm
                            initial={rule}
                            onSave={(data) => handleUpdateRule(rule.id, data)}
                            onCancel={() => setRules(prev => prev.map(r => r.id === rule.id ? { ...r, isEditing: false } : r))}
                          />
                        </div>
                      ) : (
                        <>
                          <button onClick={() => setExpandedR(prev => { const n = new Set(prev); n.has(rule.id) ? n.delete(rule.id) : n.add(rule.id); return n; })}
                            className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            {/* Score badge */}
                            <span className={`text-xs font-black px-3 py-1.5 rounded-xl shrink-0 ${sColor}`}>
                              {rule.min_score} – {rule.max_score} pts
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm">{rule.subcategory}</p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {rule.min_age !== null || rule.max_age !== null
                                  ? `Edad: ${rule.min_age ?? "—"} – ${rule.max_age ?? "—"} años · `
                                  : ""}
                                {rule.recommendations.length} recomendación{rule.recommendations.length !== 1 ? "es" : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button onClick={e => { e.stopPropagation(); setRules(prev => prev.map(r => r.id === rule.id ? { ...r, isEditing: true } : r)); }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#136dec] hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button onClick={e => { e.stopPropagation(); handleDeleteRule(rule.id); }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                                <Trash2 className="h-4 w-4" />
                              </button>
                              {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                            </div>
                          </button>

                          {isOpen && (
                            <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800">
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4 mb-3">Recomendaciones</h4>
                              {rule.recommendations.length === 0 ? (
                                <p className="text-sm text-slate-400 italic">Sin recomendaciones configuradas</p>
                              ) : (
                                <ul className="space-y-2">
                                  {rule.recommendations.map((rec, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm">
                                      <span className="h-5 w-5 rounded-full bg-[#0bda5e]/20 text-[#0bda5e] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">{i + 1}</span>
                                      <span className="text-slate-700 dark:text-slate-300">{rec}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {/* JSON preview */}
                              <details className="mt-4">
                                <summary className="text-xs font-semibold text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">Ver JSON de la regla</summary>
                                <pre className="mt-2 p-3 bg-[#0f172a] text-green-400 text-xs rounded-xl overflow-x-auto font-mono">
                                  {JSON.stringify({ min_score: rule.min_score, max_score: rule.max_score, min_age: rule.min_age, max_age: rule.max_age, subcategory: rule.subcategory, recommendations: rule.recommendations }, null, 2)}
                                </pre>
                              </details>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
