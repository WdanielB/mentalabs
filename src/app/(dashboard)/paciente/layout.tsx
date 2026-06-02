"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Brain, Home, ClipboardList, BarChart3, Gamepad2,
  Calendar, BookOpen, LogOut, Menu, X,
} from "lucide-react";
import { createClient } from "../../../../utils/supabase/client";
import { ROLE_ROUTES, resolveUserRole } from "../../../lib/auth/role";

interface Profile {
  full_name: string;
  email: string;
}

const NAV_SECTIONS = [
  {
    label: "Mi Portal",
    items: [
      { icon: Home,          label: "Inicio",         href: "/paciente" },
      { icon: ClipboardList, label: "Mis Examenes",   href: "/paciente/examenes" },
      { icon: BarChart3,     label: "Mis Resultados", href: "/paciente/resultados" },
      { icon: Calendar,      label: "Mis Citas",      href: "/paciente/citas" },
    ],
  },
  {
    label: "Herramientas",
    items: [
      { icon: BookOpen, label: "Mi Diario",           href: "/paciente/diario" },
      { icon: Gamepad2, label: "Juegos Terapeuticos", href: "/paciente/juegos" },
    ],
  },
];

export default function PacienteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && mounted) router.replace("/login");
    });

    (async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!mounted) return;
      if (userError) return;
      if (!user) { router.replace("/login"); return; }

      const resolvedRole = await resolveUserRole(supabase, user);
      if (!mounted) return;

      if (resolvedRole && resolvedRole !== "paciente") {
        router.replace(ROLE_ROUTES[resolvedRole] ?? "/dashboard");
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, email, role")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;
      if (profileError || !data) {
        setProfile({
          full_name: (user.user_metadata?.full_name as string | undefined) ?? "Paciente",
          email: user.email ?? "",
        });
        return;
      }

      if (data.role !== "paciente") {
        router.replace(ROLE_ROUTES[data.role as keyof typeof ROLE_ROUTES] ?? "/dashboard");
        return;
      }

      setProfile(data);
    })();

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [router]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#d9d9d9] bg-[#f2f4f7] shrink-0">
        <div className="h-7 w-7 bg-[#0070f2] flex items-center justify-center shrink-0">
          <Brain className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm text-[#1d2d3e] leading-tight">MentaLabs</p>
          <p className="text-[10px] text-[#6a6a6a] leading-tight mt-0.5">Portal del Paciente</p>
        </div>
      </div>

      {profile ? (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#d9d9d9] bg-white shrink-0">
          <div className="h-8 w-8 bg-[#1d2d3e] flex items-center justify-center text-white font-bold text-xs shrink-0">
            {profile.full_name?.charAt(0)?.toUpperCase() ?? "P"}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-[#1d2d3e] truncate leading-tight">{profile.full_name}</p>
            <p className="text-[10px] text-[#6a6a6a] truncate leading-tight mt-0.5">{profile.email}</p>
          </div>
        </div>
      ) : (
        <div className="h-[52px] border-b border-[#d9d9d9] bg-[#f5f5f5] animate-pulse shrink-0" />
      )}

      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-2">
            <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold text-[#6a6a6a] uppercase tracking-wider">
              {section.label}
            </p>
            {section.items.map(({ icon: Icon, label, href }) => {
              const exact = href === "/paciente";
              const isActive = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm border-l-[3px] transition-colors ${
                    isActive
                      ? "border-[#0070f2] bg-[#eaf1fb] text-[#0070f2] font-semibold"
                      : "border-transparent text-[#1d2d3e] hover:bg-[#f5f5f5] font-medium"
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

      <div className="border-t border-[#d9d9d9] p-3 shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-[#6a6a6a] hover:text-[#bb0000] hover:bg-[#fff0f0] transition-colors rounded"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Cerrar Sesion
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#1d2d3e] flex font-sans">
      <aside className="hidden lg:flex w-64 flex-col border-r border-[#d9d9d9] bg-white shrink-0 fixed h-full z-10">
        <SidebarContent />
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-white border-b border-[#d9d9d9]">
        <Link href="/paciente" className="flex items-center gap-2">
          <div className="h-7 w-7 bg-[#0070f2] flex items-center justify-center">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm text-[#1d2d3e]">MentaLabs</span>
        </Link>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="p-2 text-[#1d2d3e] hover:bg-[#f5f5f5] transition-colors"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 z-30 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 z-40 w-72 flex flex-col bg-white border-r border-[#d9d9d9]">
            <SidebarContent />
          </aside>
        </>
      )}

      <main className="flex-1 lg:ml-64 min-h-screen pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
