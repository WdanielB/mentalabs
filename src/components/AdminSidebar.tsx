"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain, Activity, FileText, ShieldCheck, Users,
  Stethoscope, UserPlus, CalendarCheck, LogOut,
} from "lucide-react";
import { signOutAndRedirect } from "../lib/auth/client";
import { useSessionProfile } from "../lib/auth/useSessionProfile";

const NAV_SECTIONS = [
  {
    label: "Gestion",
    items: [
      { icon: Activity,      label: "Resumen",       href: "/admin" },
      { icon: Stethoscope,   label: "Psicologos",    href: "/admin/psicologos" },
      { icon: Users,         label: "Pacientes",     href: "/admin/pacientes" },
      { icon: UserPlus,      label: "Asignaciones",  href: "/admin/asignaciones" },
      { icon: CalendarCheck, label: "Solicitudes",   href: "/admin/solicitudes" },
    ],
  },
  {
    label: "Configuracion",
    items: [
      { icon: FileText,    label: "Banco de Pruebas",    href: "/admin/banco-pruebas" },
      { icon: ShieldCheck, label: "Reglas Diagnosticas", href: "/admin/reglas" },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  // Sincroniza cierre de sesión entre pestañas y aplica el cierre por inactividad.
  useSessionProfile("Admin");

  const handleLogout = () => signOutAndRedirect();

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-line bg-surface shrink-0 fixed h-full z-10">
      {/* Product header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-line bg-band shrink-0">
        <div className="h-7 w-7 bg-brand flex items-center justify-center shrink-0">
          <Brain className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm text-ink leading-tight">MentaLabs</p>
          <p className="text-[10px] text-muted leading-tight mt-0.5">Administracion del Sistema</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-2">
            <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold text-muted uppercase tracking-wider">
              {section.label}
            </p>
            {section.items.map(({ icon: Icon, label, href }) => {
              const exact  = href === "/admin";
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`mx-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-brand-soft text-brand-strong font-medium"
                      : "text-ink/80 hover:bg-band hover:text-ink"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-line p-3 shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-muted hover:text-bad hover:bg-bad-soft transition-colors rounded"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Cerrar Sesion
        </button>
      </div>
    </aside>
  );
}
