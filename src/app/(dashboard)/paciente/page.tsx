"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList, Calendar, ChevronRight, Clock,
  CheckCircle2, Brain, BookOpen, User,
} from "lucide-react";
import { createClient } from "../../../../utils/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface PatientProfile {
  full_name: string;
  email: string;
  birth_date: string | null;
  status: string | null;
}

interface PendingExam {
  id: string;
  exam_title: string;
  assigned_at: string;
  assigned_by_name: string;
}

interface UpcomingAppointment {
  id: string;
  start_time: string;
  specialist_name: string;
  status: string;
}

const STATUS_LABELS: Record<string, { label: string; dot: string; text: string }> = {
  active:       { label: "Activo",         dot: "bg-[#107e3e]", text: "text-[#107e3e]" },
  inactive:     { label: "Inactivo",       dot: "bg-[#6a6a6a]", text: "text-[#6a6a6a]" },
  in_treatment: { label: "En tratamiento", dot: "bg-[#0070f2]", text: "text-[#0070f2]" },
};

export default function PacienteHomePage() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [pendingExams, setPendingExams] = useState<PendingExam[]>([]);
  const [nextAppointment, setNextAppointment] = useState<UpcomingAppointment | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles").select("full_name, email, birth_date").eq("id", user.id).single();

      const { data: patient } = await supabase
        .from("patients").select("status").eq("id", user.id).maybeSingle();

      if (prof) {
        setProfile({
          full_name: prof.full_name,
          email: prof.email,
          birth_date: prof.birth_date ?? null,
          status: patient?.status ?? "active",
        });
      }

      const { data: pendingData } = await supabase
        .from("exam_attempts")
        .select(`id, assigned_at, exams!inner(title), specialists!inner(profiles!inner(full_name))`)
        .eq("patient_id", user.id)
        .in("status", ["pending", "in_progress"])
        .order("assigned_at", { ascending: false })
        .limit(3);

      if (pendingData) {
        setPendingExams(pendingData.map((a: any) => ({
          id: a.id,
          exam_title: a.exams?.title ?? "Examen",
          assigned_at: a.assigned_at,
          assigned_by_name: a.specialists?.profiles?.full_name ?? "Tu especialista",
        })));
      }

      const { count } = await supabase
        .from("exam_attempts").select("*", { count: "exact", head: true })
        .eq("patient_id", user.id).eq("status", "completed");
      setCompletedCount(count ?? 0);

      const { data: appts } = await supabase
        .from("appointments")
        .select(`id, start_time, status, specialists!inner(profiles!inner(full_name))`)
        .eq("patient_id", user.id)
        .gte("start_time", new Date().toISOString())
        .in("status", ["scheduled", "confirmed"])
        .order("start_time", { ascending: true })
        .limit(1);

      if (appts && appts.length > 0) {
        const a = appts[0] as any;
        setNextAppointment({
          id: a.id,
          start_time: a.start_time,
          specialist_name: a.specialists?.profiles?.full_name ?? "Tu especialista",
          status: a.status,
        });
      }

      setLoading(false);
    };
    load();
  }, []);

  const statusCfg = STATUS_LABELS[profile?.status ?? "active"] ?? STATUS_LABELS.active;

  return (
    <div>
      {/* Toolbar */}
      <div className="bg-white border-b border-[#d9d9d9] px-6 py-3">
        <div className="flex items-center gap-1.5 text-xs text-[#6a6a6a] mb-0.5">
          <span>MentaLabs</span>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-[#1d2d3e]">Inicio</span>
        </div>
        {loading ? (
          <div className="h-5 w-44 bg-[#f2f4f7] animate-pulse" />
        ) : (
          <h1 className="text-base font-bold text-[#1d2d3e]">
            Bienvenido, {profile?.full_name?.split(" ")[0] ?? ""}
          </h1>
        )}
        <p className="text-xs text-[#6a6a6a] mt-0.5">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Patient Info Bar */}
        <section className="border border-[#d9d9d9] bg-white">
          <div className="px-5 py-2.5 bg-[#f2f4f7] border-b border-[#d9d9d9]">
            <p className="text-[11px] font-bold text-[#6a6a6a] uppercase tracking-wider">Datos del Paciente</p>
          </div>
          <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-[#1d2d3e] flex items-center justify-center text-white font-bold text-sm shrink-0">
                {profile?.full_name?.charAt(0)?.toUpperCase() ?? "P"}
              </div>
              <div>
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-4 w-40 bg-[#f2f4f7] animate-pulse" />
                    <div className="h-3 w-52 bg-[#f2f4f7] animate-pulse" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-semibold text-sm text-[#1d2d3e]">{profile?.full_name}</p>
                      <span className={`flex items-center gap-1.5 text-xs font-medium ${statusCfg.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                        {statusCfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#6a6a6a] flex items-center gap-1 mt-0.5">
                      <User className="h-3 w-3" /> {profile?.email}
                    </p>
                  </>
                )}
              </div>
            </div>
            <Link
              href="/paciente/citas"
              className="px-4 py-2 bg-[#0070f2] text-white text-xs font-semibold hover:bg-[#0057c2] transition-colors shrink-0"
            >
              Agendar Cita
            </Link>
          </div>
        </section>

        {/* KPI Tiles */}
        <section>
          <p className="text-[11px] font-bold text-[#6a6a6a] uppercase tracking-wider mb-2">Resumen de Actividad</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#d9d9d9] border border-[#d9d9d9]">
            <div className="bg-white px-5 py-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-[#fff8f1] flex items-center justify-center shrink-0">
                <ClipboardList className="h-5 w-5 text-[#e9730c]" />
              </div>
              <div>
                {loading ? <div className="h-8 w-10 bg-[#f2f4f7] animate-pulse mb-1" /> : (
                  <p className="text-3xl font-bold text-[#1d2d3e]">{pendingExams.length}</p>
                )}
                <p className="text-xs text-[#6a6a6a] font-medium">Examenes Pendientes</p>
              </div>
            </div>
            <div className="bg-white px-5 py-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-[#f1fdf6] flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 text-[#107e3e]" />
              </div>
              <div>
                {loading ? <div className="h-8 w-10 bg-[#f2f4f7] animate-pulse mb-1" /> : (
                  <p className="text-3xl font-bold text-[#1d2d3e]">{completedCount}</p>
                )}
                <p className="text-xs text-[#6a6a6a] font-medium">Examenes Completados</p>
              </div>
            </div>
            <div className="bg-white px-5 py-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-[#eaf1fb] flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-[#0070f2]" />
              </div>
              <div>
                {loading ? <div className="h-8 w-10 bg-[#f2f4f7] animate-pulse mb-1" /> : (
                  <p className="text-3xl font-bold text-[#1d2d3e]">{nextAppointment ? "1" : "0"}</p>
                )}
                <p className="text-xs text-[#6a6a6a] font-medium">Proxima Cita</p>
              </div>
            </div>
          </div>
        </section>

        {/* Data Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Pending Exams */}
          <section className="lg:col-span-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold text-[#6a6a6a] uppercase tracking-wider">Examenes Asignados</p>
              <Link href="/paciente/examenes" className="text-[11px] font-semibold text-[#0070f2] flex items-center gap-1 hover:underline">
                Ver todos <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="border border-[#d9d9d9] bg-white">
              {loading && Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="px-5 py-4 border-b border-[#e8e8e8] last:border-0 space-y-1.5">
                  <div className="h-3.5 w-44 bg-[#f2f4f7] animate-pulse" />
                  <div className="h-3 w-60 bg-[#f2f4f7] animate-pulse" />
                </div>
              ))}
              {!loading && pendingExams.length === 0 && (
                <div className="px-5 py-10 text-center">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-[#107e3e] opacity-50" />
                  <p className="font-semibold text-sm text-[#1d2d3e]">Todo al dia</p>
                  <p className="text-xs text-[#6a6a6a] mt-1">No tienes examenes pendientes</p>
                </div>
              )}
              {pendingExams.map((e, i) => (
                <div
                  key={e.id}
                  className={`px-5 py-4 flex items-center justify-between gap-3 hover:bg-[#f5f5f5] transition-colors ${i < pendingExams.length - 1 ? "border-b border-[#e8e8e8]" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 bg-[#eaf1fb] flex items-center justify-center shrink-0 mt-0.5">
                      <Brain className="h-4 w-4 text-[#0070f2]" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[#1d2d3e]">{e.exam_title}</p>
                      <p className="text-xs text-[#6a6a6a]">
                        Por {e.assigned_by_name} · {formatDistanceToNow(new Date(e.assigned_at), { locale: es, addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/examen"
                    className="shrink-0 px-3 py-1.5 bg-[#0070f2] text-white text-xs font-semibold hover:bg-[#0057c2] transition-colors"
                  >
                    Iniciar
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Next Appointment */}
            <section>
              <p className="text-[11px] font-bold text-[#6a6a6a] uppercase tracking-wider mb-2">Proxima Cita</p>
              <div className="border border-[#d9d9d9] bg-white">
                {loading && <div className="h-28 bg-[#f5f5f5] animate-pulse" />}
                {!loading && !nextAppointment && (
                  <div className="px-5 py-8 text-center">
                    <Calendar className="h-7 w-7 mx-auto mb-2 text-[#d9d9d9]" />
                    <p className="text-sm text-[#6a6a6a]">Sin citas proximas</p>
                    <Link href="/paciente/citas" className="text-xs text-[#0070f2] font-semibold hover:underline mt-1 block">
                      Agendar una cita
                    </Link>
                  </div>
                )}
                {!loading && nextAppointment && (
                  <div className="p-5">
                    <div className="border-l-4 border-[#0070f2] pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-3.5 w-3.5 text-[#0070f2]" />
                        <span className="text-[10px] font-bold text-[#0070f2] uppercase tracking-wider">Confirmada</span>
                      </div>
                      <p className="font-bold text-base text-[#1d2d3e]">
                        {format(new Date(nextAppointment.start_time), "d 'de' MMMM", { locale: es })}
                      </p>
                      <p className="text-sm text-[#1d2d3e] font-medium">
                        {format(new Date(nextAppointment.start_time), "HH:mm 'hrs'")}
                      </p>
                      <p className="text-xs text-[#6a6a6a] mt-1">Con {nextAppointment.specialist_name}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Diary Shortcut */}
            <section>
              <p className="text-[11px] font-bold text-[#6a6a6a] uppercase tracking-wider mb-2">Mi Diario</p>
              <div className="border border-[#d9d9d9] bg-white px-5 py-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 bg-[#f2f4f7] flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4 text-[#6a6a6a]" />
                  </div>
                  <p className="font-semibold text-sm text-[#1d2d3e]">Espacio Personal</p>
                </div>
                <p className="text-xs text-[#6a6a6a] mb-4 leading-relaxed">
                  Registra como te sientes. Tu especialista puede verlo como parte de tu seguimiento.
                </p>
                <Link
                  href="/paciente/diario"
                  className="flex items-center justify-center gap-2 w-full py-2 border border-[#0070f2] text-[#0070f2] text-xs font-semibold hover:bg-[#eaf1fb] transition-colors"
                >
                  Ir al Diario <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
