"use client";

import { useEffect, useState, useTransition } from "react";
import { Stethoscope, CheckCircle2, XCircle, Clock, Star, ChevronDown, ChevronUp } from "lucide-react";
import {
  listSpecialistsAdmin,
  updateSpecialistStatus,
} from "../../../../actions/admin";
import AdminSidebar from "../../../../components/AdminSidebar";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:   { label: "Pendiente",  color: "bg-amber-50 text-amber-700 border-amber-200",    icon: Clock },
  active:    { label: "Activo",     color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  suspended: { label: "Suspendido", color: "bg-red-50 text-red-600 border-red-200",          icon: XCircle },
};

export default function AdminPsicologosPage() {
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = async () => {
    const data = await listSpecialistsAdmin();
    setSpecialists(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleStatus = (id: string, status: "active" | "suspended" | "pending") => {
    startTransition(async () => {
      await updateSpecialistStatus(id, status);
      await load();
    });
  };

  const pending  = specialists.filter((s) => s.status === "pending");
  const active   = specialists.filter((s) => s.status === "active");
  const suspended = specialists.filter((s) => s.status === "suspended");

  const SpecialistCard = ({ s }: { s: any }) => {
    const cfg = STATUS_CFG[s.status] ?? STATUS_CFG.active;
    const StatusIcon = cfg.icon;
    const isOpen = expanded === s.id;
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => setExpanded(isOpen ? null : s.id)}
          className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 transition-colors"
        >
          <div className="h-10 w-10 rounded-full bg-[#136dec] flex items-center justify-center text-white font-bold shrink-0">
            {s.profiles?.full_name?.charAt(0)?.toUpperCase() ?? "E"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm">{s.profiles?.full_name}</p>
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
                <StatusIcon className="h-3 w-3" /> {cfg.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{s.specialty} · {s.profiles?.email}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-amber-500 shrink-0">
            <Star className="h-3.5 w-3.5 fill-amber-400" />
            {Number(s.rating).toFixed(1)}
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
        </button>

        {isOpen && (
          <div className="border-t border-slate-100 p-4 bg-slate-50 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Especialidad</p>
                <p className="font-medium mt-0.5">{s.specialty}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Tarifa / hora</p>
                <p className="font-medium mt-0.5">S/ {Number(s.hourly_rate).toFixed(0)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Registro</p>
                <p className="font-medium mt-0.5">
                  {s.profiles?.created_at
                    ? format(new Date(s.profiles.created_at), "d MMM yyyy", { locale: es })
                    : "—"}
                </p>
              </div>
              {s.bio && (
                <div className="col-span-full">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Bio</p>
                  <p className="text-slate-600 mt-0.5">{s.bio}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              {s.status !== "active" && (
                <button
                  onClick={() => handleStatus(s.id, "active")}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Aprobar
                </button>
              )}
              {s.status !== "suspended" && (
                <button
                  onClick={() => handleStatus(s.id, "suspended")}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  <XCircle className="h-3.5 w-3.5" /> Suspender
                </button>
              )}
              {s.status === "suspended" && (
                <button
                  onClick={() => handleStatus(s.id, "pending")}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-200 disabled:opacity-50 transition-colors"
                >
                  Reactivar
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const Section = ({ title, items, badge }: { title: string; items: any[]; badge?: string }) => (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-semibold text-sm text-slate-700">{title}</h2>
        {badge && (
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">{badge}</span>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center bg-white rounded-xl border border-slate-100">
          Sin psicólogos en esta categoría.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((s) => <SpecialistCard key={s.id} s={s} />)}
        </div>
      )}
    </section>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Psicólogos</h1>
          <p className="text-slate-500 text-sm mt-1">
            {loading ? "Cargando..." : `${specialists.length} registrado${specialists.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-white border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <Section title="Pendientes de aprobación" items={pending} badge={pending.length > 0 ? String(pending.length) : undefined} />
            <Section title="Activos" items={active} />
            <Section title="Suspendidos" items={suspended} />
          </>
        )}
      </main>
    </div>
  );
}
