"use client";

import { useEffect, useState } from "react";
import { Users, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { listPatientsAdmin } from "../../../../actions/admin";
import AdminSidebar from "../../../../components/AdminSidebar";
import { format, differenceInYears } from "date-fns";
import { es } from "date-fns/locale";

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  active:       { label: "Activo",         color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  inactive:     { label: "Inactivo",       color: "bg-slate-100 text-slate-500 border-slate-200" },
  in_treatment: { label: "En tratamiento", color: "bg-blue-50 text-[#136dec] border-blue-200" },
};

export default function AdminPacientesPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    listPatientsAdmin().then((data) => {
      setPatients(data);
      setLoading(false);
    });
  }, []);

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.profiles?.full_name?.toLowerCase().includes(q) ||
      p.profiles?.email?.toLowerCase().includes(q)
    );
  });

  const getAge = (bd: string | null) =>
    bd ? `${differenceInYears(new Date(), new Date(bd))} años` : "—";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Pacientes</h1>
          <p className="text-slate-500 text-sm mt-1">
            {loading ? "Cargando..." : `${patients.length} paciente${patients.length !== 1 ? "s" : ""} registrado${patients.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full max-w-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#136dec] focus:border-transparent"
          />
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-white border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <Users className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-700">Sin resultados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((p) => {
              const cfg = STATUS_CFG[p.status] ?? STATUS_CFG.active;
              const isOpen = expanded === p.id;
              return (
                <div key={p.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setExpanded(isOpen ? null : p.id)}
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                      {p.profiles?.full_name?.charAt(0)?.toUpperCase() ?? "P"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{p.profiles?.full_name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {p.profiles?.email} · {getAge(p.profiles?.birth_date)}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-100 p-4 bg-slate-50 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Correo</p>
                          <p className="font-medium mt-0.5">{p.profiles?.email}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Registro</p>
                          <p className="font-medium mt-0.5">
                            {p.profiles?.created_at
                              ? format(new Date(p.profiles.created_at), "d MMM yyyy", { locale: es })
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Edad</p>
                          <p className="font-medium mt-0.5">{getAge(p.profiles?.birth_date)}</p>
                        </div>
                      </div>

                      {p.clinical_history_summary && (
                        <div className="bg-white rounded-lg border border-slate-200 p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-3.5 w-3.5 text-[#136dec]" />
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Resumen Historia Clínica
                            </p>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {p.clinical_history_summary}
                          </p>
                        </div>
                      )}
                      {!p.clinical_history_summary && (
                        <p className="text-xs text-slate-400 italic">Sin resumen de historia clínica registrado.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
