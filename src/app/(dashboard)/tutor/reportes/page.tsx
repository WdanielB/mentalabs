"use client";

import { useEffect, useState } from "react";
import { BarChart3, CheckCircle2 } from "lucide-react";
import { createClient } from "../../../../../utils/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PatientReport {
  patient_id: string;
  patient_name: string;
  completed_exams: {
    id: string;
    exam_title: string;
    total_score: number | null;
    completed_at: string;
    subcategory: string | null;
  }[];
}

export default function TutorReportesPage() {
  const [reports, setReports] = useState<PatientReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: links } = await supabase
        .from("tutor_patient_links")
        .select(`
          patient_id,
          patients!inner(id, profiles!inner(full_name))
        `)
        .eq("tutor_id", user.id);

      if (!links || links.length === 0) { setLoading(false); return; }

      const patientIds = links.map((l: any) => l.patient_id);

      const { data: exams } = await supabase
        .from("exam_attempts")
        .select(`
          id,
          patient_id,
          total_score,
          completed_at,
          exams!inner(title),
          diagnostics(generated_subcategory)
        `)
        .in("patient_id", patientIds)
        .eq("status", "completed")
        .order("completed_at", { ascending: false });

      const examsByPatient: Record<string, PatientReport["completed_exams"]> = {};
      (exams ?? []).forEach((e: any) => {
        if (!examsByPatient[e.patient_id]) examsByPatient[e.patient_id] = [];
        examsByPatient[e.patient_id].push({
          id:           e.id,
          exam_title:   e.exams?.title ?? "Examen",
          total_score:  e.total_score,
          completed_at: e.completed_at,
          subcategory:  e.diagnostics?.[0]?.generated_subcategory ?? null,
        });
      });

      setReports(
        links.map((l: any) => ({
          patient_id:      l.patient_id,
          patient_name:    l.patients?.profiles?.full_name ?? "Paciente",
          completed_exams: examsByPatient[l.patient_id] ?? [],
        }))
      );
      setLoading(false);
    };
    load();
  }, []);

  const totalExams = reports.reduce((sum, r) => sum + r.completed_exams.length, 0);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reportes</h1>
        <p className="text-slate-500 text-sm mt-1">
          {loading
            ? "Cargando..."
            : `${totalExams} examen${totalExams !== 1 ? "es" : ""} completado${totalExams !== 1 ? "s" : ""} en total`}
        </p>
      </div>

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-xl bg-white dark:bg-[#1a2432] border border-slate-200 dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && reports.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-[#1a2432] rounded-xl border border-slate-200 dark:border-slate-800">
          <BarChart3 className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">Sin datos aún</p>
          <p className="text-slate-400 text-sm mt-1">
            Los reportes aparecerán cuando tus pacientes completen exámenes.
          </p>
        </div>
      )}

      <div className="space-y-5">
        {reports.map((r) => (
          <div
            key={r.patient_id}
            className="bg-white dark:bg-[#1a2432] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm shrink-0">
                {r.patient_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm">{r.patient_name}</p>
                <p className="text-xs text-slate-400">
                  {r.completed_exams.length} examen{r.completed_exams.length !== 1 ? "es" : ""} completado{r.completed_exams.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {r.completed_exams.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-slate-400">Sin exámenes completados aún</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {r.completed_exams.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{e.exam_title}</p>
                        {e.subcategory && (
                          <p className="text-xs text-[#136dec] font-medium">{e.subcategory}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {e.total_score !== null && (
                        <p className="font-bold text-[#136dec]">{e.total_score}</p>
                      )}
                      <p className="text-xs text-slate-400">
                        {format(new Date(e.completed_at), "d MMM yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
