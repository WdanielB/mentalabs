"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList, Calendar, ArrowRight, Clock,
  CheckCircle2, Gamepad2, Brain
} from "lucide-react";
import { createClient } from "../../../../utils/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

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

export default function PacienteHomePage() {
  const [profileName, setProfileName] = useState("");
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
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      if (prof) setProfileName(prof.full_name);

      // Pending exams
      const { data: pendingData } = await supabase
        .from("exam_attempts")
        .select(`
          id,
          assigned_at,
          exams!inner(title),
          specialists!inner(profiles!inner(full_name))
        `)
        .eq("patient_id", user.id)
        .in("status", ["pending", "in_progress"])
        .order("assigned_at", { ascending: false })
        .limit(3);

      if (pendingData) {
        setPendingExams(
          pendingData.map((a: any) => ({
            id: a.id,
            exam_title: a.exams?.title ?? "Examen",
            assigned_at: a.assigned_at,
            assigned_by_name: a.specialists?.profiles?.full_name ?? "Tu especialista",
          }))
        );
      }

      // Completed exams count
      const { count } = await supabase
        .from("exam_attempts")
        .select("*", { count: "exact", head: true })
        .eq("patient_id", user.id)
        .eq("status", "completed");
      setCompletedCount(count ?? 0);

      // Next appointment
      const { data: appts } = await supabase
        .from("appointments")
        .select(`
          id,
          start_time,
          status,
          specialists!inner(profiles!inner(full_name))
        `)
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

  const firstName = profileName.split(" ")[0];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        {loading ? (
          <div className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse mb-2" />
        ) : (
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            ¡Hola, {firstName || "Bienvenido"}! 👋
          </h1>
        )}
        <p className="text-slate-500 text-sm mt-1">
          {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2432] p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center shrink-0">
            <ClipboardList className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            {loading ? <div className="h-7 w-8 rounded bg-slate-200 dark:bg-slate-700 animate-pulse mb-1" /> : (
              <p className="text-2xl font-black">{pendingExams.length}</p>
            )}
            <p className="text-xs text-slate-500 font-medium">Exámenes Pendientes</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2432] p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6 text-[#0bda5e]" />
          </div>
          <div>
            {loading ? <div className="h-7 w-8 rounded bg-slate-200 dark:bg-slate-700 animate-pulse mb-1" /> : (
              <p className="text-2xl font-black">{completedCount}</p>
            )}
            <p className="text-xs text-slate-500 font-medium">Exámenes Completados</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2432] p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
            <Calendar className="h-6 w-6 text-[#136dec]" />
          </div>
          <div>
            {loading ? <div className="h-7 w-8 rounded bg-slate-200 dark:bg-slate-700 animate-pulse mb-1" /> : (
              <p className="text-2xl font-black">{nextAppointment ? "1" : "0"}</p>
            )}
            <p className="text-xs text-slate-500 font-medium">Próxima Cita</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Pending Exams */}
        <div className="lg:col-span-3 bg-white dark:bg-[#1a2432] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold text-base">Exámenes Asignados</h2>
            <Link href="/paciente/examenes" className="text-sm font-semibold text-[#0bda5e] flex items-center gap-1 hover:underline">
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="px-6 py-4">
                <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-700 animate-pulse mb-2" />
                <div className="h-3 w-56 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </div>
            ))}
            {!loading && pendingExams.length === 0 && (
              <div className="px-6 py-12 text-center">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-[#0bda5e] opacity-50" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">¡Todo al día!</p>
                <p className="text-slate-400 text-sm mt-1">No tienes exámenes pendientes</p>
              </div>
            )}
            {pendingExams.map((e) => (
              <div key={e.id} className="px-6 py-4 flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Brain className="h-4 w-4 text-[#136dec]" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{e.exam_title}</p>
                    <p className="text-xs text-slate-400">
                      Asignado por {e.assigned_by_name} · {formatDistanceToNow(new Date(e.assigned_at), { locale: es, addSuffix: true })}
                    </p>
                  </div>
                </div>
                <Link
                  href="/examen"
                  className="shrink-0 px-4 py-1.5 bg-[#136dec] text-white rounded-lg text-xs font-bold hover:bg-blue-600 transition-colors"
                >
                  Comenzar
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Next Appointment */}
          <div className="bg-white dark:bg-[#1a2432] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-bold text-base">Próxima Cita</h2>
            </div>
            <div className="p-6">
              {loading && <div className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />}
              {!loading && !nextAppointment && (
                <div className="text-center py-4">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm text-slate-500">Sin citas próximas</p>
                  <Link href="/paciente/citas" className="text-xs text-[#136dec] font-semibold hover:underline mt-1 block">
                    Ver historial
                  </Link>
                </div>
              )}
              {!loading && nextAppointment && (
                <div className="bg-gradient-to-br from-[#136dec] to-blue-700 rounded-xl p-4 text-white">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 opacity-80" />
                    <span className="text-xs font-semibold opacity-80">Confirmada</span>
                  </div>
                  <p className="font-black text-lg leading-tight">
                    {format(new Date(nextAppointment.start_time), "d 'de' MMMM", { locale: es })}
                  </p>
                  <p className="text-blue-100 text-sm font-medium">
                    {format(new Date(nextAppointment.start_time), "HH:mm 'hrs'")}
                  </p>
                  <p className="text-blue-200 text-xs mt-2">Con {nextAppointment.specialist_name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Games Card */}
          <div className="bg-gradient-to-br from-[#0bda5e]/10 to-[#136dec]/10 dark:from-[#0bda5e]/5 dark:to-[#136dec]/5 rounded-2xl border border-[#0bda5e]/20 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#0bda5e] to-[#136dec] flex items-center justify-center">
                <Gamepad2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-sm">Juegos Terapéuticos</p>
                <p className="text-xs text-slate-500">Ejercicios cognitivos</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Practica ejercicios de memoria y atención recomendados por tu especialista.
            </p>
            <Link
              href="/paciente/juegos"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-[#0bda5e] to-[#136dec] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Jugar Ahora <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
