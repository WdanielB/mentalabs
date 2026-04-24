"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Brain, Activity, FileText, ShieldCheck, LogOut } from "lucide-react";
import { createClient } from "../../utils/supabase/client";

const NAV = [
  { icon: Activity,    label: "Resumen",            href: "/admin" },
  { icon: FileText,    label: "Banco de Pruebas",    href: "/admin/banco-pruebas" },
  { icon: ShieldCheck, label: "Reglas Diagnósticas", href: "/admin/reglas" },
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
    <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2432] p-4 shrink-0 fixed h-full z-10">
      <Link href="/admin" className="flex items-center gap-3 mb-8 px-2 group">
        <div className="h-8 w-8 rounded-lg bg-[#136dec] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
          <Brain className="h-5 w-5" />
        </div>
        <span className="font-bold text-lg">Admin Center</span>
      </Link>

      <nav className="space-y-1 flex-1">
        {NAV.map(({ icon: Icon, label, href }) => {
          const exact  = href === "/admin";
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${active ? "bg-blue-50 text-[#136dec] dark:bg-[#136dec]/10 font-semibold" : "text-slate-500 font-medium hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
              {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#136dec] rounded-r-md" />}
              <Icon className="h-5 w-5 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <button onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 font-medium text-sm transition-colors">
        <LogOut className="h-5 w-5" />
        <span>Cerrar Sesión</span>
      </button>
    </aside>
  );
}
