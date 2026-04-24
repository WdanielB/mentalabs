"use client";

import { useEffect, useState } from "react";
import { BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "../../../../../utils/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DiagnosticResult {
  id: string;
  exam_title: string;
  total_score: number | null;
  subcategory: string;
  recommendations: string[];
  completed_at: string;
}

export default function PacienteResultadosPage() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("diagnostics")
        .select(`
          id,
          generated_subcategory,
          recommendations,
          created_at,
          exam_attempts!inner(
            total_score,
            completed_at,
            patient_id,
            exams!inner(title)
          )
        `)
        .eq("exam_attempts.patient_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setResults(
          data.map((d: any) => ({
            id: d.id,
            exam_title: d.exam_attempts?.exams?.title ?? "Examen",
            total_score: d.exam_attempts?.total_score ?? null,
            subcategory: d.generated_subcategory ?? "Resultado no clasificado",
            recommendations: Array.isArray(d.recommendations) ? d.recommendations : [],
            completed_at: d.exam_attempts?.completed_at ?? d.created_at,
          }))
        );
      }
      setLoading(false);
    };
    load();
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black">Mis Resultados</h1>
        <p className="text-slate-500 text-sm mt-1">Historial de diagnósticos y recomendaciones</p>
      </div>

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-white dark:bg-[#1a2432] border border-slate-200 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-[#1a2432] rounded-2xl border border-slate-200 dark:border-slate-800">
          <BarChart3 className="h-14 w-14 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <p className="font-bold text-slate-700 dark:text-slate-300 text-lg">Sin resultados todavía</p>
          <p className="text-slate-400 text-sm mt-2">Completa tus exámenes para ver los diagnósticos aquí.</p>
        </div>
      )}

      <div className="space-y-4">
        {results.map((r) => {
          const isOpen = expanded.has(r.id);
          return (
            <div key={r.id} className="bg-white dark:bg-[#1a2432] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              {/* Header */}
              <button
                onClick={() => toggleExpand(r.id)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-[#0bda5e] to-[#136dec] flex items-center justify-center shrink-0">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{r.exam_title}</p>
                  <p className="text-sm text-slate-500 mt-0.5 truncate">{r.subcategory}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {format(new Date(r.completed_at), "d 'de' MMMM yyyy", { locale: es })}
                  </p>
                </div>
                <div className="text-right shrink-0 mr-2">
                  {r.total_score !== null && (
                    <>
                      <p className="text-2xl font-black text-[#136dec]">{r.total_score}</p>
                      <p className="text-xs text-slate-400">Score</p>
                    </>
                  )}
                </div>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
                )}
              </button>

              {/* Expanded recommendations */}
              {isOpen && (
                <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4 mb-3">
                    Recomendaciones
                  </h3>
                  {r.recommendations.length === 0 ? (
                    <p className="text-sm text-slate-500">Sin recomendaciones registradas.</p>
                  ) : (
                    <ul className="space-y-2">
                      {r.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <span className="h-5 w-5 rounded-full bg-[#0bda5e]/20 text-[#0bda5e] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
