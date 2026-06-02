"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, Stethoscope, UserCheck, FileText,
  ClipboardList, ChevronRight, Activity, RefreshCw,
} from "lucide-react";
import { createClient } from "../../../../utils/supabase/client";
import { getAdminStats } from "../../../actions/admin";
import { revalidateAdminCache } from "../../../actions/cache";
import AdminSidebar from "../../../components/AdminSidebar";
import { ROLE_ROUTES, resolveUserRole } from "../../../lib/auth/role";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Stats {
  patients: number;
  specialists: number;
  tutors: number;
  exams: number;
  attempts: number;
}

export default function AdminOverviewPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ patients: 0, specialists: 0, tutors: 0, exams: 0, attempts: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, startRefresh] = useTransition();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) return;
      if (!user) { router.push("/login"); return; }

      const resolvedRole = await resolveUserRole(supabase, user);
      if (resolvedRole && resolvedRole !== "admin") {
        router.replace(ROLE_ROUTES[resolvedRole] ?? "/dashboard");
        return;
      }

      try {
        setLoading(true);
        const data = await getAdminStats();
        setStats(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router, refreshKey]);

  const handleRefresh = () => {
    startRefresh(async () => {
      await revalidateAdminCache();
      setRefreshKey((k) => k + 1);
    });
  };

  const kpis = [
    { label: "Pacientes",             value: stats.patients,     icon: Users },
    { label: "Especialistas",         value: stats.specialists,  icon: Stethoscope },
    { label: "Tutores",               value: stats.tutors,       icon: UserCheck },
    { label: "Examenes Publicados",   value: stats.exams,        icon: FileText },
    { label: "Intentos Totales",      value: stats.attempts,     icon: ClipboardList },
  ];

  const quickLinks = [
    { href: "/admin/banco-pruebas", icon: FileText,    title: "Banco de Pruebas",    desc: "Construye y gestiona examenes diagnosticos con el editor no-code" },
    { href: "/admin/reglas",        icon: Activity,    title: "Reglas Diagnosticas",  desc: "Configura umbrales de score, edades y recomendaciones automaticas" },
    { href: "/admin/psicologos",    icon: Stethoscope, title: "Psicologos",           desc: "Gestiona el equipo de especialistas activos en el sistema" },
    { href: "/admin/asignaciones",  icon: UserCheck,   title: "Asignaciones",         desc: "Vincula especialistas con sus pacientes asignados" },
    { href: "/admin/solicitudes",   icon: ClipboardList, title: "Solicitudes",        desc: "Revisa y gestiona solicitudes de citas y asignaciones pendientes" },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex font-sans">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64">
        {/* Toolbar */}
        <div className="bg-white border-b border-[#d9d9d9] px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#6a6a6a] mb-0.5">
              <span>MentaLabs</span>
              <ChevronRight className="h-3 w-3" />
              <span className="font-medium text-[#1d2d3e]">Resumen</span>
            </div>
            <h1 className="text-base font-bold text-[#1d2d3e]">Panel de Administracion</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[#6a6a6a] hidden sm:block">
              {format(new Date(), "dd 'de' MMMM yyyy", { locale: es })}
            </span>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#0070f2] border border-[#0070f2] hover:bg-[#eaf1fb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* KPI Tiles */}
          <section>
            <p className="text-[11px] font-bold text-[#6a6a6a] uppercase tracking-wider mb-2">
              Indicadores del Sistema
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-[#d9d9d9] border border-[#d9d9d9]">
              {kpis.map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-white px-4 py-4 hover:bg-[#f9f9f9] transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-[11px] font-semibold text-[#6a6a6a] uppercase tracking-wide leading-tight pr-2">
                      {label}
                    </p>
                    <Icon className="h-4 w-4 text-[#6a6a6a] shrink-0" />
                  </div>
                  {loading ? (
                    <div className="h-10 w-16 bg-[#f2f4f7] animate-pulse" />
                  ) : (
                    <p className="text-4xl font-bold text-[#1d2d3e]">{value}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Quick Access */}
          <section>
            <p className="text-[11px] font-bold text-[#6a6a6a] uppercase tracking-wider mb-2">
              Acceso Rapido
            </p>
            <div className="border border-[#d9d9d9] bg-white divide-y divide-[#e8e8e8]">
              {quickLinks.map(({ href, icon: Icon, title, desc }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between px-5 py-4 hover:bg-[#f5f5f5] transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 bg-[#eaf1fb] flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-[#0070f2]" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[#1d2d3e]">{title}</p>
                      <p className="text-xs text-[#6a6a6a] mt-0.5">{desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#6a6a6a] group-hover:text-[#0070f2] transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
