"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, User } from "lucide-react";
import { createClient } from "../../../../../utils/supabase/client";
import { format, isFuture, isPast, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface AgendaAppointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  patient_name: string;
  specialist_name: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  scheduled: { label: "Programada", color: "bg-blue-50 text-blue-700 border-blue-200" },
  confirmed:  { label: "Confirmada",  color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled:  { label: "Cancelada",   color: "bg-red-50 text-red-600 border-red-200" },
  completed:  { label: "Completada",  color: "bg-slate-100 text-slate-500 border-slate-200" },
};

export default function TutorAgendaPage() {
  const [appointments, setAppointments] = useState<AgendaAppointment[]>([]);
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

      const { data } = await supabase
        .from("appointments")
        .select(`
          id,
          start_time,
          end_time,
          status,
          patients!inner(profiles!inner(full_name)),
          specialists!inner(profiles!inner(full_name))
        `)
        .in("patient_id", patientIds)
        .order("start_time", { ascending: false });

      if (data) {
        setAppointments(
          data.map((a: any) => ({
            id: a.id,
            start_time: a.start_time,
            end_time: a.end_time,
            status: a.status,
            patient_name: a.patients?.profiles?.full_name ?? "Paciente",
            specialist_name: a.specialists?.profiles?.full_name ?? "Especialista",
          }))
        );
      }
      setLoading(false);
    };
    load();
  }, []);

  const upcoming = appointments.filter(
    (a) => isFuture(parseISO(a.start_time)) && a.status !== "cancelled"
  );
  const past = appointments.filter(
    (a) => isPast(parseISO(a.start_time)) || a.status === "completed" || a.status === "cancelled"
  );

  const AppointmentRow = ({ appt }: { appt: AgendaAppointment }) => {
    const cfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.scheduled;
    const isUpcoming = isFuture(parseISO(appt.start_time)) && appt.status !== "cancelled";
    return (
      <div
        className={`flex items-center gap-4 p-4 bg-white dark:bg-[#1a2432] rounded-xl border border-slate-200 dark:border-slate-800 ${
          !isUpcoming ? "opacity-60" : ""
        }`}
      >
        <div className="text-center w-12 shrink-0">
          <p className="text-xl font-bold text-slate-900 dark:text-white leading-none">
            {format(parseISO(appt.start_time), "d")}
          </p>
          <p className="text-xs text-slate-400 uppercase font-medium">
            {format(parseISO(appt.start_time), "MMM", { locale: es })}
          </p>
        </div>
        <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm">{appt.patient_name}</p>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(parseISO(appt.start_time), "HH:mm")} – {format(parseISO(appt.end_time), "HH:mm")}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {appt.specialist_name}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Agenda</h1>
        <p className="text-slate-500 text-sm mt-1">Citas de los pacientes vinculados</p>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-white dark:bg-[#1a2432] border border-slate-200 dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && appointments.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-[#1a2432] rounded-xl border border-slate-200 dark:border-slate-800">
          <Calendar className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">Sin citas registradas</p>
          <p className="text-slate-400 text-sm mt-1">
            Las citas de tus pacientes aparecerán aquí.
          </p>
        </div>
      )}

      {!loading && upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Próximas
          </h2>
          <div className="space-y-3">
            {upcoming.map((a) => <AppointmentRow key={a.id} appt={a} />)}
          </div>
        </section>
      )}

      {!loading && past.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Historial
          </h2>
          <div className="space-y-3">
            {past.map((a) => <AppointmentRow key={a.id} appt={a} />)}
          </div>
        </section>
      )}
    </div>
  );
}
