"use client";

import { useEffect, useState, useCallback } from "react";
import { Calendar, Video, Clock, CheckCircle2, XCircle, Plus, Star, X, AlertCircle } from "lucide-react";
import { createClient } from "../../../../../utils/supabase/client";
import { listSpecialists, requestAppointment } from "../../../../actions/specialists";
import type { SpecialistCard } from "../../../../actions/specialists";
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
  scheduled: { label: "Programada", color: "bg-blue-50 text-blue-700 border-blue-200" },
  confirmed:  { label: "Confirmada",  color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled:  { label: "Cancelada",   color: "bg-red-50 text-red-600 border-red-200" },
  completed:  { label: "Completada",  color: "bg-slate-100 text-slate-500 border-slate-200" },
};

export default function PacienteCitasPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking modal state
  const [showBooking, setShowBooking] = useState(false);
  const [specialists, setSpecialists] = useState<SpecialistCard[]>([]);
  const [loadingSpecs, setLoadingSpecs] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const supabase = createClient();

  const loadAppointments = useCallback(async () => {
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
  }, [supabase]);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  const openBooking = async () => {
    setShowBooking(true);
    setBookingError(null);
    setBookingSuccess(false);
    setSelectedSpec("");
    setSelectedDate("");
    if (specialists.length === 0) {
      setLoadingSpecs(true);
      const data = await listSpecialists();
      setSpecialists(data);
      setLoadingSpecs(false);
    }
  };

  const handleBook = async () => {
    if (!selectedSpec || !selectedDate) {
      setBookingError("Selecciona un especialista y una fecha.");
      return;
    }
    setBooking(true);
    setBookingError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");
      await requestAppointment(selectedSpec, user.id, selectedDate);
      setBookingSuccess(true);
      await loadAppointments();
    } catch (err: any) {
      setBookingError("No se pudo agendar la cita. Intenta de nuevo.");
    } finally {
      setBooking(false);
    }
  };

  const upcoming = appointments.filter((a) => isFuture(parseISO(a.start_time)) && a.status !== "cancelled");
  const past = appointments.filter((a) => isPast(parseISO(a.start_time)) || a.status === "completed" || a.status === "cancelled");

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().slice(0, 16);

  const AppointmentCard = ({ appt }: { appt: Appointment }) => {
    const cfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.scheduled;
    const isUpcoming = isFuture(parseISO(appt.start_time)) && appt.status !== "cancelled";
    return (
      <div className={`flex items-center gap-5 p-5 bg-white dark:bg-[#1a2432] rounded-xl border border-slate-200 dark:border-slate-800 transition-all ${isUpcoming ? "" : "opacity-60"}`}>
        <div className="text-center min-w-[48px] shrink-0">
          <p className="text-2xl font-bold leading-none text-slate-900 dark:text-white">
            {format(parseISO(appt.start_time), "d")}
          </p>
          <p className="text-xs font-medium text-slate-400 uppercase">
            {format(parseISO(appt.start_time), "MMM", { locale: es })}
          </p>
        </div>

        <div className="w-px self-stretch bg-slate-200 dark:bg-slate-700 shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm">{appt.specialist_name}</p>
            {appt.specialist_specialty && (
              <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {appt.specialist_specialty}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(parseISO(appt.start_time), "HH:mm")} – {format(parseISO(appt.end_time), "HH:mm")}
            </p>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>
        </div>

        <div className="shrink-0">
          {isUpcoming && appt.meeting_link ? (
            <a
              href={appt.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-[#136dec] text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors"
            >
              <Video className="h-3.5 w-3.5" /> Unirse
            </a>
          ) : appt.status === "completed" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : appt.status === "cancelled" ? (
            <XCircle className="h-5 w-5 text-red-400" />
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mis Citas</h1>
          <p className="text-slate-500 text-sm mt-1">
            {loading ? "Cargando..." : `${upcoming.length} próxima${upcoming.length !== 1 ? "s" : ""} · ${past.length} en historial`}
          </p>
        </div>
        <button
          onClick={openBooking}
          className="flex items-center gap-2 px-4 py-2 bg-[#136dec] text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-4 w-4" /> Nueva cita
        </button>
      </div>

      {/* Booking modal */}
      {showBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1a2432] rounded-xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-semibold">Agendar Nueva Cita</h2>
              <button onClick={() => setShowBooking(false)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {bookingSuccess ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
                  <p className="font-semibold text-slate-900 dark:text-white">Cita solicitada</p>
                  <p className="text-slate-500 text-sm mt-1">Tu especialista confirmará la cita próximamente.</p>
                  <button
                    onClick={() => setShowBooking(false)}
                    className="mt-4 px-4 py-2 bg-[#136dec] text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                <>
                  {bookingError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm border border-red-100 dark:border-red-900/50">
                      <AlertCircle className="h-4 w-4 shrink-0" /> {bookingError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                      Selecciona un especialista
                    </label>
                    {loadingSpecs ? (
                      <div className="space-y-2">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <div key={i} className="h-16 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
                        ))}
                      </div>
                    ) : specialists.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">
                        No hay especialistas disponibles por el momento.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-52 overflow-y-auto">
                        {specialists.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setSelectedSpec(s.id)}
                            className={`w-full flex items-center justify-between gap-3 p-3 rounded-lg border text-left transition-colors ${
                              selectedSpec === s.id
                                ? "border-[#136dec] bg-blue-50 dark:bg-[#136dec]/10"
                                : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                          >
                            <div>
                              <p className="font-semibold text-sm">{s.full_name}</p>
                              <p className="text-xs text-slate-400">{s.specialty}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-[#136dec]">S/ {s.hourly_rate}/hr</p>
                              <p className="text-xs text-slate-400 flex items-center gap-0.5 justify-end">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                {s.rating.toFixed(1)}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Fecha y hora
                    </label>
                    <input
                      type="datetime-local"
                      value={selectedDate}
                      min={minDateStr}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111822] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#136dec] focus:border-transparent text-slate-900 dark:text-slate-100"
                    />
                    <p className="text-xs text-slate-400 mt-1">La cita tiene una duración de 1 hora.</p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowBooking(false)}
                      className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleBook}
                      disabled={booking || !selectedSpec || !selectedDate}
                      className="flex-[2] py-2.5 bg-[#136dec] text-white rounded-lg text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                      {booking ? "Agendando..." : "Confirmar cita"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-white dark:bg-[#1a2432] border border-slate-200 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && appointments.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-[#1a2432] rounded-xl border border-slate-200 dark:border-slate-800">
          <Calendar className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">Sin citas registradas</p>
          <p className="text-slate-400 text-sm mt-2">Agenda tu primera cita con un especialista.</p>
        </div>
      )}

      {!loading && upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Próximas Citas</h2>
          <div className="space-y-3">
            {upcoming.map((a) => <AppointmentCard key={a.id} appt={a} />)}
          </div>
        </section>
      )}

      {!loading && past.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Historial</h2>
          <div className="space-y-3">
            {past.map((a) => <AppointmentCard key={a.id} appt={a} />)}
          </div>
        </section>
      )}
    </div>
  );
}
