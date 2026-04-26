"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Clock, Video, CheckCircle2, XCircle, AlertCircle, Plus, FileText } from "lucide-react";
import { createClient } from "../../../../../utils/supabase/client";
import { format, isToday, isTomorrow, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  meeting_link: string | null;
  patient_name: string;
  patient_id: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; dot: string }> = {
  scheduled:  { label: "Programada", icon: Clock,         color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",    dot: "bg-blue-400" },
  confirmed:  { label: "Confirmada", icon: CheckCircle2,  color: "text-green-600 bg-green-50 dark:bg-green-900/20", dot: "bg-[#0bda5e]" },
  cancelled:  { label: "Cancelada",  icon: XCircle,       color: "text-red-500 bg-red-50 dark:bg-red-900/20",       dot: "bg-red-400" },
  completed:  { label: "Completada", icon: CheckCircle2,  color: "text-slate-500 bg-slate-100 dark:bg-slate-800",   dot: "bg-slate-400" },
};

function getDayLabel(dateStr: string) {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Hoy";
  if (isTomorrow(date)) return "Mañana";
  return format(date, "EEEE d 'de' MMMM", { locale: es });
}

export default function EspecialistaAgendaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("appointments")
        .select(`
          id,
          start_time,
          end_time,
          status,
          meeting_link,
          patient_id,
          patients!inner(profiles!inner(full_name))
        `)
        .eq("specialist_id", user.id)
        .order("start_time", { ascending: true });

      if (data) {
        setAppointments(
          data.map((a: any) => ({
            id: a.id,
            start_time: a.start_time,
            end_time: a.end_time,
            status: a.status,
            meeting_link: a.meeting_link,
            patient_id: a.patient_id,
            patient_name: a.patients?.profiles?.full_name ?? "Paciente",
          }))
        );
      }
      setLoading(false);
    };
    load();
  }, []);

  // Group by day
  const grouped: Record<string, Appointment[]> = {};
  for (const appt of appointments) {
    const day = appt.start_time.slice(0, 10);
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(appt);
  }

  const upcoming = appointments.filter(a => new Date(a.start_time) >= new Date() && a.status !== "cancelled");
  const todayCount = appointments.filter(a => isToday(parseISO(a.start_time)) && a.status !== "cancelled").length;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black">Mi Agenda</h1>
          <p className="text-slate-500 text-sm mt-1">
            {todayCount > 0 ? `${todayCount} cita${todayCount > 1 ? "s" : ""} hoy` : "Sin citas hoy"}
            {upcoming.length > 0 && ` · ${upcoming.length} próximas`}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#136dec] hover:bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-md shadow-[#136dec]/20 transition-all">
          <Plus className="h-4 w-4" /> Nueva Cita
        </button>
      </div>

      {loading && (
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i}>
              <div className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-700 animate-pulse mb-3" />
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="h-24 rounded-xl bg-white dark:bg-[#1a2432] border border-slate-200 dark:border-slate-800 animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && appointments.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-[#1a2432] rounded-2xl border border-slate-200 dark:border-slate-800">
          <Calendar className="h-14 w-14 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <p className="font-bold text-slate-700 dark:text-slate-300 text-lg">Sin citas registradas</p>
          <p className="text-slate-400 text-sm mt-2">Crea tu primera cita con el botón de arriba</p>
        </div>
      )}

      <div className="space-y-8">
        {Object.entries(grouped).map(([day, appts]) => (
          <div key={day}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="font-bold text-sm capitalize text-slate-500">
                {getDayLabel(appts[0].start_time)}
              </h2>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              <span className="text-xs text-slate-400 font-medium">{format(parseISO(day), "d MMM yyyy", { locale: es })}</span>
            </div>

            <div className="space-y-3">
              {appts.map((appt) => {
                const cfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.scheduled;
                const StatusIcon = cfg.icon;
                const isPast = new Date(appt.start_time) < new Date();

                return (
                  <div
                    key={appt.id}
                    className={`flex items-center gap-4 p-5 bg-white dark:bg-[#1a2432] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all ${
                      isPast ? "opacity-60" : "hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    {/* Time column */}
                    <div className="text-center min-w-[60px]">
                      <p className="font-black text-lg leading-none">
                        {format(parseISO(appt.start_time), "HH:mm")}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {format(parseISO(appt.end_time), "HH:mm")}
                      </p>
                    </div>

                    <div className={`w-0.5 self-stretch rounded-full ${cfg.dot}`} />

                    {/* Patient info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#0bda5e] to-[#136dec] flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {appt.patient_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{appt.patient_name}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${cfg.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {appt.meeting_link && !isPast && (
                        <a
                          href={appt.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#136dec] text-white rounded-lg text-xs font-bold hover:bg-blue-600 transition-colors"
                        >
                          <Video className="h-3 w-3" /> Unirse
                        </a>
                      )}
                      {(appt.status === "confirmed" || appt.status === "completed") && (
                        <Link
                          href={`/especialista/pacientes/${appt.patient_id}/sesion/${appt.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          <FileText className="h-3 w-3" /> Sesión SS
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
