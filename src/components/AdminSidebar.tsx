"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Brain, Activity, FileText, ShieldCheck, Users,
  Stethoscope, UserPlus, CalendarCheck, LogOut,
} from "lucide-react";
import { createClient } from "../../utils/supabase/client";

const NAV = [
  { icon: Activity,      label: "Resumen",             href: "/admin" },
  { icon: Stethoscope,   label: "Psicólogos",          href: "/admin/psicologos" },
  { icon: Users,         label: "Pacientes",           href: "/admin/pacientes" },
  { icon: UserPlus,      label: "Asignaciones",        href: "/admin/asignaciones" },
  { icon: CalendarCheck, label: "Solicitudes",         href: "/admin/solicitudes" },
  { icon: FileText,      label: "Banco de Pruebas",    href: "/admin/banco-pruebas" },
  { icon: ShieldCheck,   label: "Reglas Diagnósticas", href: "/admin/reglas" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white p-4 shrink-0 fixed h-full z-10">
      <Link href="/admin" className="flex items-center gap-3 mb-8 px-2 group">
        <div className="h-8 w-8 rounded-lg bg-[#136dec] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
          <Brain className="h-5 w-5" />
        </div>
        <span className="font-bold text-lg text-slate-900">Admin</span>
      </Link>

      <nav className="space-y-0.5 flex-1">
        {NAV.map(({ icon: Icon, label, href }) => {
          const exact  = href === "/admin";
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-blue-50 text-[#136dec] font-semibold"
                  : "text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#136dec] rounded-r" />
              )}
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 font-medium text-sm transition-colors"
      >
        <LogOut className="h-4 w-4" />
        <span>Cerrar Sesión</span>
      </button>
    </aside>
  );
}
