"use client";

import { useEffect, useState, useTransition } from "react";
import { CheckCircle2, XCircle, Clock, Calendar, User } from "lucide-react";
import {
  listAssignmentRequests,
  reviewAssignmentRequest,
  listScheduledAppointments,
  updateAppointmentStatus,
} from "../../../../actions/admin";
import AdminSidebar from "../../../../components/AdminSidebar";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

type Tab = "asignaciones" | "citas";

const REQ_STATUS: Record<string, { label: string; color: string }> = {
  pending:  { label: "Pendiente", color: "bg-amber-50 text-amber-700 border-amber-200" },
  approved: { label: "Aprobado",  color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rechazado", color: "bg-red-50 text-red-600 border-red-200" },
};

const APPT_STATUS: Record<string, { label: string; color: string }> = {
  scheduled: { label: "Solicitada", color: "bg-blue-50 text-blue-700 border-blue-200" },
  confirmed: { label: "Confirmada", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export default function AdminSolicitudesPage() {
  const [tab, setTab] = useState<Tab>("asignaciones");
  const [requests, setRequests] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const load = async () => {
    setLoading(true);
    const [r, a] = await Promise.all([
      listAssignmentRequests(),
      listScheduledAppointments(),
    ]);
    setRequests(r);
    setAppointments(a);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleReview = (id: string, approved: boolean) => {
    startTransition(async () => {
      await reviewAssignmentRequest(id, approved);
      await load();
    });
  };

  const handleApptStatus = (id: string, status: "confirmed" | "cancelled") => {
    startTransition(async () => {
      await updateAppointmentStatus(id, status);
      await load();
    });
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const pendingAppts    = appointments.filter((a) => a.status === "scheduled");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Solicitudes</h1>
          <p className="text-slate-500 text-sm mt-1">
            {pendingRequests.length} asignación{pendingRequests.length !== 1 ? "es" : ""} · {pendingAppts.length} cita{pendingAppts.length !== 1 ? "s" : ""} pendiente{pendingAppts.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6">
          {([
            { key: "asignaciones", label: "Asignación de psicólogo", count: pendingRequests.length },
            { key: "citas",        label: "Solicitudes de cita",     count: pendingAppts.length },
          ] as const).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === key
                  ? "border-[#136dec] text-[#136dec]"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {label}
              {count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-white border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Assignment requests */}
            {tab === "asignaciones" && (
              <div className="space-y-3">
                {requests.length === 0 && (
                  <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                    <p className="font-semibold text-slate-700">Sin solicitudes</p>
                    <p className="text-slate-400 text-sm mt-1">No hay solicitudes de asignación.</p>
                  </div>
                )}
                {requests.map((r) => {
                  const cfg = REQ_STATUS[r.status] ?? REQ_STATUS.pending;
                  return (
                    <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-semibold text-sm">
                              {r.patients?.profiles?.full_name ?? "Paciente"}
                            </p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Especialista solicitado:{" "}
                            <span className="font-medium text-slate-600">
                              {r.requested_specialist?.profiles?.full_name ?? "Sin preferencia"}
                            </span>
                          </p>
                          {r.patient_notes && (
                            <p className="text-xs text-slate-500 mt-1 italic">"{r.patient_notes}"</p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">
                            {format(parseISO(r.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                          </p>
                        </div>

                        {r.status === "pending" && (
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => handleReview(r.id, true)}
                              disabled={isPending}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Aprobar
                            </button>
                            <button
                              onClick={() => handleReview(r.id, false)}
                              disabled={isPending}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Rechazar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Appointment requests */}
            {tab === "citas" && (
              <div className="space-y-3">
                {appointments.length === 0 && (
                  <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                    <Calendar className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                    <p className="font-semibold text-slate-700">Sin citas pendientes</p>
                  </div>
                )}
                {appointments.map((a) => {
                  const cfg = APPT_STATUS[a.status] ?? APPT_STATUS.scheduled;
                  return (
                    <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-semibold text-sm">
                              {a.patients?.profiles?.full_name}
                            </p>
                            <span className="text-slate-400 text-xs">→</span>
                            <p className="text-sm text-slate-600">
                              {a.specialists?.profiles?.full_name}
                            </p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(parseISO(a.start_time), "d MMM yyyy · HH:mm", { locale: es })} — {a.specialists?.specialty}
                          </p>
                        </div>

                        {a.status === "scheduled" && (
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => handleApptStatus(a.id, "confirmed")}
                              disabled={isPending}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Confirmar
                            </button>
                            <button
                              onClick={() => handleApptStatus(a.id, "cancelled")}
                              disabled={isPending}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Rechazar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
