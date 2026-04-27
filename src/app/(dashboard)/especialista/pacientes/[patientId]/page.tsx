"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  ClipboardList,
  FileText,
  Stethoscope,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { createClient } from "../../../../../../utils/supabase/client";

type ClinicalRecordRow = {
  id: string;
  status: "draft" | "signed_and_locked";
  consultation_reason: string | null;
  clinical_evolution: string | null;
  diagnostic_codes: string[] | null;
  treatment_plan: string | null;
  intervention_codes: string[] | null;
  observations: string | null;
  signed_at: string | null;
  created_at: string;
  appointments: {
    id: string;
    start_time: string;
    status: string;
  }[] | null;
};

type CompletedExamRow = {
  id: string;
  total_score: number | null;
  completed_at: string | null;
  assigned_at: string;
  exams: { title: string }[] | null;
  diagnostics: Array<{ generated_subcategory: string | null }> | null;
};

type PatientHeader = {
  id: string;
  status: string;
  full_name: string;
  email: string;
};

const RECORD_STATUS: Record<string, { label: string; className: string }> = {
  signed_and_locked: {
    label: "Firmado",
    className: "bg-emerald-100 text-emerald-700",
  },
  draft: {
    label: "Borrador",
    className: "bg-amber-100 text-amber-700",
  },
};

export default function EspecialistaPacienteHistoriaPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<PatientHeader | null>(null);
  const [records, setRecords] = useState<ClinicalRecordRow[]>([]);
  const [completedExams, setCompletedExams] = useState<CompletedExamRow[]>([]);
  const [specialistId, setSpecialistId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setSpecialistId(user.id);

      // Access guard: patient must be related to specialist via assignment, appointment, or exam history.
      const [assignmentRes, apptRes, attemptsRes] = await Promise.all([
        supabase
          .from("specialist_patient_assignments")
          .select("id")
          .eq("specialist_id", user.id)
          .eq("patient_id", patientId)
          .maybeSingle(),
        supabase
          .from("appointments")
          .select("id")
          .eq("specialist_id", user.id)
          .eq("patient_id", patientId)
          .limit(1),
        supabase
          .from("exam_attempts")
          .select("id")
          .eq("patient_id", patientId)
          .eq("assigned_by", user.id)
          .limit(1),
      ]);

      const canAccess =
        !!assignmentRes.data ||
        (apptRes.data?.length ?? 0) > 0 ||
        (attemptsRes.data?.length ?? 0) > 0;

      if (!canAccess) {
        router.replace("/especialista/pacientes");
        return;
      }

      const [patientRes, recordsRes, examsRes] = await Promise.all([
        supabase
          .from("patients")
          .select("id, status, profiles!inner(full_name, email)")
          .eq("id", patientId)
          .single(),
        supabase
          .from("clinical_records")
          .select(
            "id, status, consultation_reason, clinical_evolution, diagnostic_codes, treatment_plan, intervention_codes, observations, signed_at, created_at, appointments!inner(id, start_time, status)"
          )
          .eq("patient_id", patientId)
          .eq("specialist_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("exam_attempts")
          .select(
            "id, total_score, completed_at, assigned_at, exams!inner(title), diagnostics(generated_subcategory)"
          )
          .eq("patient_id", patientId)
          .eq("status", "completed")
          .order("completed_at", { ascending: false }),
      ]);

      if (patientRes.data) {
        setPatient({
          id: patientRes.data.id,
          status: patientRes.data.status ?? "active",
          full_name: (patientRes.data as any).profiles?.full_name ?? "Paciente",
          email: (patientRes.data as any).profiles?.email ?? "",
        });
      }

      setRecords((recordsRes.data as ClinicalRecordRow[]) ?? []);
      setCompletedExams((examsRes.data as CompletedExamRow[]) ?? []);
      setLoading(false);
    };

    load();
  }, [patientId, router]);

  const signedCount = useMemo(
    () => records.filter((r) => r.status === "signed_and_locked").length,
    [records]
  );

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="h-8 w-72 rounded-lg bg-slate-200 animate-pulse mb-6" />
        <div className="space-y-3">
          <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.push("/especialista/pacientes")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Volver a pacientes
          </button>
          <h1 className="text-2xl font-black mt-2">Historia Clínica SS / EsSalud</h1>
          <p className="text-sm text-slate-500 mt-1">
            {patient?.full_name} · {patient?.email}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="px-3 py-2 rounded-lg bg-blue-50 text-[#136dec] font-bold text-center">
            {records.length} registros
          </div>
          <div className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-center">
            {signedCount} firmados
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Historia de Sesiones (Estructura SS)
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {records.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-slate-400">
                Aún no hay registros clínicos para este paciente.
              </div>
            )}

            {records.map((rec) => {
              const st = RECORD_STATUS[rec.status] ?? RECORD_STATUS.draft;
              const diagCodes = Array.isArray(rec.diagnostic_codes) ? rec.diagnostic_codes : [];
              const interventionCodes = Array.isArray(rec.intervention_codes)
                ? rec.intervention_codes
                : [];

              return (
                <div key={rec.id} className="px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {rec.appointments?.[0]?.start_time
                        ? format(parseISO(rec.appointments[0].start_time), "d 'de' MMMM yyyy, HH:mm", {
                            locale: es,
                          })
                        : "Sesión sin fecha"}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${st.className}`}>
                        {st.label}
                      </span>
                      {rec.appointments?.[0]?.id && (
                        <Link
                          href={`/especialista/pacientes/${patientId}/sesion/${rec.appointments[0].id}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5" /> Abrir ficha
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Motivo de Consulta
                      </p>
                      <p className="text-sm text-slate-700">{rec.consultation_reason || "—"}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Diagnóstico (CIE-10)
                      </p>
                      <p className="text-sm text-slate-700">
                        {diagCodes.length > 0 ? diagCodes.join(", ") : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Evolución Clínica
                    </p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {rec.clinical_evolution || "—"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Plan de Tratamiento
                      </p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">
                        {rec.treatment_plan || "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Códigos de Intervención
                      </p>
                      <p className="text-sm text-slate-700">
                        {interventionCodes.length > 0 ? interventionCodes.join(", ") : "—"}
                      </p>
                    </div>
                  </div>

                  {rec.observations && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Observaciones
                      </p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{rec.observations}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <aside className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Exámenes Realizados
            </h2>
          </div>

          <div className="p-4 space-y-3">
            {completedExams.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">Sin exámenes completados aún.</p>
            )}

            {completedExams.map((exam) => (
              <div key={exam.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <p className="text-sm font-semibold text-slate-800">{exam.exams?.[0]?.title ?? "Examen"}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Completado
                  </span>
                  <span className="text-slate-500">
                    {exam.completed_at
                      ? format(parseISO(exam.completed_at), "d MMM yyyy", { locale: es })
                      : format(parseISO(exam.assigned_at), "d MMM yyyy", { locale: es })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Score total</span>
                  <span className="font-bold text-[#136dec]">{exam.total_score ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Subcategoría</span>
                  <span className="font-medium text-slate-700 truncate ml-2">
                    {exam.diagnostics?.[0]?.generated_subcategory ?? "Sin clasificación"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            Resumen presentado bajo estructura clínica tipo SS/EsSalud: motivo, evolución, diagnóstico,
            plan e intervenciones.
          </div>
        </aside>
      </div>

      {specialistId && (
        <div className="text-xs text-slate-400 flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> Especialista activo: {specialistId}
        </div>
      )}
    </div>
  );
}
