"use client";

import { useEffect, useState } from "react";
import {
  Users, ChevronDown, ChevronUp, ClipboardList, BarChart3,
  AlertCircle, Brain
} from "lucide-react";
import { createClient } from "../../../../../utils/supabase/client";
import { format, differenceInYears } from "date-fns";
import { es } from "date-fns/locale";

interface PatientDetail {
  id: string;
  full_name: string;
  email: string;
  birth_date: string | null;
  status: string;
  exams: {
    id: string;
    exam_title: string;
    status: string;
    total_score: number | null;
    assigned_at: string;
    completed_at: string | null;
  }[];
  results: {
    id: string;
    exam_title: string;
    subcategory: string;
    total_score: number | null;
    completed_at: string;
  }[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:       { label: "Activo",         color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  inactive:     { label: "Inactivo",       color: "bg-slate-100 text-slate-500 dark:bg-slate-800" },
  in_treatment: { label: "En tratamiento", color: "bg-blue-100 text-[#136dec] dark:bg-blue-900/20" },
};

const EXAM_STATUS: Record<string, string> = {
  pending:     "Pendiente",
  in_progress: "En progreso",
  completed:   "Completado",
};

export default function TutorPacientesPage() {
  const [patients, setPatients] = useState<PatientDetail[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<Record<string, "exams" | "results">>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: links } = await supabase
        .from("tutor_patient_links")
        .select("patient_id")
        .eq("tutor_id", user.id);

      if (!links || links.length === 0) { setLoading(false); return; }

      const patientIds = links.map((l: any) => l.patient_id);

      const { data: pts } = await supabase
        .from("patients")
        .select("id, status, profiles!inner(full_name, email, birth_date)")
        .in("id", patientIds);

      const { data: exams } = await supabase
        .from("exam_attempts")
        .select("id, patient_id, status, total_score, assigned_at, completed_at, exams!inner(title)")
        .in("patient_id", patientIds)
        .order("assigned_at", { ascending: false });

      // Fix: query attempt IDs first, then fetch diagnostics by attempt_id
      const attemptIds = exams?.map((e: any) => e.id) ?? [];

      let diags: any[] = [];
      if (attemptIds.length > 0) {
        const { data: diagData } = await supabase
          .from("diagnostics")
          .select("id, attempt_id, generated_subcategory, created_at")
          .in("attempt_id", attemptIds)
          .order("created_at", { ascending: false });
        diags = diagData ?? [];
      }

      // Build maps
      const examsByPatient: Record<string, PatientDetail["exams"]> = {};
      const attemptMap: Record<string, any> = {};
      exams?.forEach((e: any) => {
        if (!examsByPatient[e.patient_id]) examsByPatient[e.patient_id] = [];
        examsByPatient[e.patient_id].push({
          id:           e.id,
          exam_title:   e.exams?.title ?? "Examen",
          status:       e.status,
          total_score:  e.total_score,
          assigned_at:  e.assigned_at,
          completed_at: e.completed_at,
        });
        attemptMap[e.id] = e;
      });

      const diagsByPatient: Record<string, PatientDetail["results"]> = {};
      diags.forEach((d: any) => {
        const attempt = attemptMap[d.attempt_id];
        if (!attempt) return;
        const pid = attempt.patient_id;
        if (!diagsByPatient[pid]) diagsByPatient[pid] = [];
        diagsByPatient[pid].push({
          id:           d.id,
          exam_title:   attempt.exams?.title ?? "Examen",
          subcategory:  d.generated_subcategory ?? "—",
          total_score:  attempt.total_score ?? null,
          completed_at: attempt.completed_at ?? d.created_at,
        });
      });

      setPatients(
        (pts ?? []).map((p: any) => ({
          id:          p.id,
          full_name:   p.profiles?.full_name ?? "Paciente",
          email:       p.profiles?.email ?? "",
          birth_date:  p.profiles?.birth_date ?? null,
          status:      p.status ?? "active",
          exams:       examsByPatient[p.id] ?? [],
          results:     diagsByPatient[p.id] ?? [],
        }))
      );
      setLoading(false);
    };
    load();
  }, []);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setActiveTab((prev) => ({ ...prev, [id]: prev[id] ?? "exams" }));
  };

  const getAge = (bd: string | null) =>
    bd ? `${differenceInYears(new Date(), new Date(bd))} años` : "—";

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black">Mis Pacientes</h1>
        <p className="text-slate-500 text-sm mt-1">
          {loading ? "Cargando..." : `${patients.length} paciente${patients.length !== 1 ? "s" : ""} vinculado${patients.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white dark:bg-[#1a2432] border border-slate-200 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && patients.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-[#1a2432] rounded-2xl border border-slate-200 dark:border-slate-800">
          <Users className="h-14 w-14 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <p className="font-bold text-slate-700 dark:text-slate-300 text-lg">Sin pacientes vinculados</p>
          <p className="text-slate-400 text-sm mt-2">Contacta a un especialista para vincular pacientes a tu cuenta.</p>
        </div>
      )}

      <div className="space-y-4">
        {patients.map((p) => {
          const st = STATUS_LABELS[p.status] ?? STATUS_LABELS.active;
          const isOpen = expanded.has(p.id);
          const tab = activeTab[p.id] ?? "exams";
          const pendingCount = p.exams.filter((e) => e.status === "pending").length;

          return (
            <div key={p.id} className="bg-white dark:bg-[#1a2432] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              {/* Header row */}
              <button
                onClick={() => toggle(p.id)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="h-11 w-11 rounded-full bg-slate-400 dark:bg-slate-600 flex items-center justify-center text-white font-bold shrink-0">
                  {p.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold">{p.full_name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${st.color}`}>
                      {st.label}
                    </span>
                    {pendingCount > 0 && (
                      <span className="flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded-full">
                        <AlertCircle className="h-3 w-3" /> {pendingCount} pendiente{pendingCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{p.email} · {getAge(p.birth_date)}</p>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400 shrink-0" /> : <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />}
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="border-t border-slate-100 dark:border-slate-800">
                  {/* Tabs */}
                  <div className="flex border-b border-slate-100 dark:border-slate-800 px-5">
                    {(["exams", "results"] as const).map((t) => {
                      const labels = { exams: "Exámenes", results: "Diagnósticos" };
                      const icons = { exams: ClipboardList, results: Brain };
                      const TabIcon = icons[t];
                      return (
                        <button
                          key={t}
                          onClick={() => setActiveTab((prev) => ({ ...prev, [p.id]: t }))}
                          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                            tab === t
                              ? "border-[#136dec] text-[#136dec]"
                              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          }`}
                        >
                          <TabIcon className="h-4 w-4" />
                          {labels[t]}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab content */}
                  <div className="p-5">
                    {tab === "exams" && (
                      <div className="space-y-3">
                        {p.exams.length === 0 && (
                          <p className="text-sm text-slate-500 text-center py-6">Sin exámenes asignados</p>
                        )}
                        {p.exams.map((e) => (
                          <div key={e.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-[#111822] rounded-xl">
                            <div>
                              <p className="font-semibold text-sm">{e.exam_title}</p>
                              <p className="text-xs text-slate-400">
                                {format(new Date(e.assigned_at), "d MMM yyyy", { locale: es })}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold text-slate-500">{EXAM_STATUS[e.status] ?? e.status}</span>
                              {e.total_score !== null && (
                                <p className="text-sm font-black text-[#136dec]">{e.total_score}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {tab === "results" && (
                      <div className="space-y-3">
                        {p.results.length === 0 && (
                          <p className="text-sm text-slate-500 text-center py-6">Sin diagnósticos generados aún</p>
                        )}
                        {p.results.map((r) => (
                          <div key={r.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-[#111822] rounded-xl">
                            <div>
                              <p className="font-semibold text-sm">{r.exam_title}</p>
                              <p className="text-xs text-[#136dec] font-medium mt-0.5">{r.subcategory}</p>
                            </div>
                            <div className="text-right">
                              {r.total_score !== null && (
                                <p className="text-lg font-black text-[#136dec]">{r.total_score}</p>
                              )}
                              <p className="text-xs text-slate-400">
                                {format(new Date(r.completed_at), "d MMM yyyy", { locale: es })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
