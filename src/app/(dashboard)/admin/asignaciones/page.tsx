"use client";

import { useEffect, useState, useTransition } from "react";
import { UserPlus, X, Plus, AlertCircle } from "lucide-react";
import {
  listPatientsAdmin,
  listSpecialistsAdmin,
  listAssignmentsAdmin,
  assignSpecialistToPatient,
  removeAssignment,
} from "../../../../actions/admin";
import AdminSidebar from "../../../../components/AdminSidebar";
import { createClient } from "../../../../../utils/supabase/client";

export default function AdminAsignacionesPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminUserId, setAdminUserId] = useState<string>("");

  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [selectedSpec, setSelectedSpec] = useState("");
  const [notes, setNotes] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setAdminUserId(user.id);

    const [p, s, a] = await Promise.all([
      listPatientsAdmin(),
      listSpecialistsAdmin(),
      listAssignmentsAdmin(),
    ]);
    setPatients(p);
    setSpecialists(s.filter((sp: any) => sp.status === "active"));
    setAssignments(a);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getPatientAssignments = (patientId: string) =>
    assignments.filter((a) => a.patients?.id === patientId);

  const openAssign = (patient: any) => {
    setSelectedPatient(patient);
    setSelectedSpec("");
    setNotes("");
    setAssignError(null);
    setShowModal(true);
  };

  const handleAssign = () => {
    if (!selectedSpec || !selectedPatient) {
      setAssignError("Selecciona un especialista.");
      return;
    }
    startTransition(async () => {
      try {
        await assignSpecialistToPatient(selectedSpec, selectedPatient.id, adminUserId, notes || undefined);
        setShowModal(false);
        await load();
      } catch (err: any) {
        setAssignError(err.message);
      }
    });
  };

  const handleRemove = (assignmentId: string) => {
    startTransition(async () => {
      await removeAssignment(assignmentId);
      await load();
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Asignaciones</h1>
          <p className="text-slate-500 text-sm mt-1">Asigna y reasigna psicólogos a pacientes</p>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-white border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {patients.map((p) => {
              const pa = getPatientAssignments(p.id);
              return (
                <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                        {p.profiles?.full_name?.charAt(0)?.toUpperCase() ?? "P"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{p.profiles?.full_name}</p>
                        <p className="text-xs text-slate-400">{p.profiles?.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => openAssign(p)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#136dec] text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" /> Asignar
                    </button>
                  </div>

                  {pa.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {pa.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs"
                        >
                          <span className="font-medium text-[#136dec]">
                            {a.specialists?.profiles?.full_name}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500">{a.specialists?.specialty}</span>
                          <button
                            onClick={() => handleRemove(a.id)}
                            disabled={isPending}
                            className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {pa.length === 0 && (
                    <p className="mt-2 text-xs text-slate-400">Sin psicólogo asignado</p>
                  )}
                </div>
              );
            })}

            {patients.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                <UserPlus className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                <p className="font-semibold text-slate-700">Sin pacientes registrados</p>
              </div>
            )}
          </div>
        )}

        {/* Assign modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl border border-slate-200 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <h2 className="font-semibold">Asignar psicólogo</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Paciente: {selectedPatient?.profiles?.full_name}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                {assignError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {assignError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Especialista
                  </label>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {specialists.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">No hay especialistas activos.</p>
                    ) : specialists.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSpec(s.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                          selectedSpec === s.id
                            ? "border-[#136dec] bg-blue-50"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-sm">{s.profiles?.full_name}</p>
                          <p className="text-xs text-slate-400">{s.specialty}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#136dec] focus:border-transparent"
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAssign}
                    disabled={isPending || !selectedSpec}
                    className="flex-[2] py-2.5 bg-[#136dec] text-white rounded-lg text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    {isPending ? "Asignando..." : "Confirmar asignación"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
