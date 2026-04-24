"use client";

import { useEffect, useState } from "react";
import { Calendar, Video, Clock, CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "../../../../../utils/supabase/client";
import { format, isFuture, isPast, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  meeting_link: string | null;
  specialist_name: string;
  specialist_specialty: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  scheduled: { label: "Programada", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" },
  confirmed: { label: "Confirmada",  color: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" },
  cancelled: { label: "Cancelada",   color: "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" },
  completed: { label: "Completada",  color: "bg-slate-100 text-slate-500 dark:bg-slate-800" },
};

export default function PacienteCitasPage() {
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
          specialists!inner(
            specialty,
            profiles!inner(full_name)
          )
        `)
        .eq("patient_id", user.id)
        .order("start_time", { ascending: false });

      if (data) {
        setAppointments(
          data.map((a: any) => ({
            id: a.id,
            start_time: a.start_time,
            end_time: a.end_time,
            status: a.status,
            meeting_link: a.meeting_link,
            specialist_name: a.specialists?.profiles?.full_name ?? "Especialista",
            specialist_specialty: a.specialists?.specialty ?? null,
          }))
        );
      }
      setLoading(false);
    };
    load();
  }, []);

  const upcoming = appointments.filter((a) => isFuture(parseISO(a.start_time)) && a.status !== "cancelled");
  const past = appointments.filter((a) => isPast(parseISO(a.start_time)) || a.status === "completed" || a.status === "cancelled");

  const AppointmentCard = ({ appt }: { appt: Appointment }) => {
    const cfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.scheduled;
    const isUpcoming = isFuture(parseISO(appt.start_time)) && appt.status !== "cancelled";
    return (
      <div className={`flex items-center gap-5 p-5 bg-white dark:bg-[#1a2432] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all ${isUpcoming ? "hover:shadow-md" : "opacity-75"}`}>
        {/* Date block */}
        <div className="text-center min-w-[52px] shrink-0">
          <p className="text-2xl font-black leading-none text-slate-900 dark:text-white">
            {format(parseISO(appt.start_time), "d")}
          </p>
          <p className="text-xs font-semibold text-slate-400 uppercase">
            {format(parseISO(appt.start_time), "MMM", { locale: es })}
          </p>
        </div>

        <div className="w-px self-stretch bg-slate-200 dark:bg-slate-700 shrink-0" />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-sm">{appt.specialist_name}</p>
            {appt.specialist_specialty && (
              <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {appt.specialist_specialty}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(parseISO(appt.start_time), "HH:mm")} – {format(parseISO(appt.end_time), "HH:mm")}
            </p>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Action */}
        <div className="shrink-0">
          {isUpcoming && appt.meeting_link ? (
            <a
              href={appt.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-[#136dec] text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors shadow-md shadow-[#136dec]/20"
            >
              <Video className="h-3.5 w-3.5" /> Unirse
            </a>
          ) : appt.status === "completed" ? (
            <CheckCircle2 className="h-5 w-5 text-[#0bda5e]" />
          ) : appt.status === "cancelled" ? (
            <XCircle className="h-5 w-5 text-red-400" />
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black">Mis Citas</h1>
        <p className="text-slate-500 text-sm mt-1">
          {loading ? "Cargando..." : `${upcoming.length} próxima${upcoming.length !== 1 ? "s" : ""} · ${past.length} pasada${past.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white dark:bg-[#1a2432] border border-slate-200 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && appointments.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-[#1a2432] rounded-2xl border border-slate-200 dark:border-slate-800">
          <Calendar className="h-14 w-14 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <p className="font-bold text-slate-700 dark:text-slate-300 text-lg">Sin citas registradas</p>
          <p className="text-slate-400 text-sm mt-2">Tu especialista creará citas cuando sea necesario.</p>
        </div>
      )}

      {!loading && upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4">Próximas Citas</h2>
          <div className="space-y-4">
            {upcoming.map((a) => <AppointmentCard key={a.id} appt={a} />)}
          </div>
        </section>
      )}

      {!loading && past.length > 0 && (
        <section>
          <h2 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4">Historial</h2>
          <div className="space-y-3">
            {past.map((a) => <AppointmentCard key={a.id} appt={a} />)}
          </div>
        </section>
      )}
    </div>
  );
}
