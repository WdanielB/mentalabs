"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Brain, Home, ClipboardList, BarChart3, Gamepad2, Calendar, LogOut } from "lucide-react";
import { createClient } from "../../../../utils/supabase/client";

interface Profile {
  full_name: string;
  email: string;
}

const navItems = [
  { icon: Home,          label: "Inicio",                href: "/paciente" },
  { icon: ClipboardList, label: "Mis Exámenes",          href: "/paciente/examenes" },
  { icon: BarChart3,     label: "Mis Resultados",        href: "/paciente/resultados" },
  { icon: Gamepad2,      label: "Juegos Terapéuticos",   href: "/paciente/juegos" },
  { icon: Calendar,      label: "Mis Citas",             href: "/paciente/citas" },
];

export default function PacienteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, role")
        .eq("id", user.id)
        .single();

      if (!data || data.role !== "paciente") { router.push("/login"); return; }
      setProfile(data);
    };
    init();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#111822] text-slate-900 dark:text-slate-100 flex font-sans">
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2432] p-4 shrink-0 fixed h-full z-10">
        <Link href="/paciente" className="flex items-center gap-3 mb-6 px-2 group">
          <div className="h-8 w-8 rounded-lg bg-[#0bda5e] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
            <Brain className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg">MentaLabs</span>
        </Link>

        {profile ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#111822] mb-6">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#0bda5e] to-[#136dec] flex items-center justify-center text-white font-bold text-sm shrink-0">
              {profile.full_name?.charAt(0)?.toUpperCase() ?? "P"}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{profile.full_name}</p>
              <p className="text-xs text-slate-400 truncate">{profile.email}</p>
            </div>
          </div>
        ) : (
          <div className="h-[60px] mb-6 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        )}

        <nav className="space-y-1 flex-1">
          {navItems.map(({ icon: Icon, label, href }) => {
            const exact = href === "/paciente";
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  isActive
                    ? "bg-green-50 text-[#0bda5e] dark:bg-[#0bda5e]/10 font-semibold"
                    : "text-slate-500 font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#0bda5e] rounded-r-md" />
                )}
                <Icon className="h-5 w-5 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 font-medium text-sm transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Cerrar Sesión</span>
        </button>
      </aside>

      <main className="flex-1 lg:ml-64 min-h-screen">{children}</main>
    </div>
  );
}
