"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
 Brain, Home, ClipboardList, BarChart3, Gamepad2,
 Calendar, BookOpen, LogOut, Menu, X,
} from "lucide-react";
import { createClient } from "../../../../utils/supabase/client";

interface Profile {
 full_name: string;
 email: string;
}

const navItems = [
 { icon: Home, label: "Inicio", href: "/paciente" },
 { icon: ClipboardList, label: "Mis Exámenes", href: "/paciente/examenes" },
 { icon: BarChart3, label: "Mis Resultados", href: "/paciente/resultados" },
 { icon: Calendar, label: "Mis Citas", href: "/paciente/citas" },
 { icon: BookOpen, label: "Mi Diario", href: "/paciente/diario" },
 { icon: Gamepad2, label: "Juegos Terapéuticos", href: "/paciente/juegos" },
];

export default function PacienteLayout({ children }: { children: React.ReactNode }) {
 const pathname = usePathname();
 const router = useRouter();
 const [profile, setProfile] = useState<Profile | null>(null);
 const [mobileOpen, setMobileOpen] = useState(false);

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

 useEffect(() => { setMobileOpen(false); }, [pathname]);

 const handleLogout = async () => {
 const supabase = createClient();
 await supabase.auth.signOut();
 router.push("/login");
 };

 const SidebarContent = () => (
 <>
 <Link href="/paciente" className="flex items-center gap-3 mb-6 px-2 group">
 <div className="h-8 w-8 rounded-lg bg-[#136dec] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
 <Brain className="h-5 w-5" />
 </div>
 <span className="font-bold text-lg">MentaLabs</span>
 </Link>

 {profile ? (
 <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 mb-6">
 <div className="h-9 w-9 rounded-full bg-[#136dec] flex items-center justify-center text-white font-bold text-sm shrink-0">
 {profile.full_name?.charAt(0)?.toUpperCase() ?? "P"}
 </div>
 <div className="min-w-0">
 <p className="font-semibold text-sm truncate">{profile.full_name}</p>
 <p className="text-xs text-slate-400 truncate">{profile.email}</p>
 </div>
 </div>
 ) : (
 <div className="h-[60px] mb-6 rounded-lg bg-slate-100 animate-pulse" />
 )}

 <nav className="space-y-0.5 flex-1">
 {navItems.map(({ icon: Icon, label, href }) => {
 const exact = href === "/paciente";
 const isActive = exact ? pathname === href : pathname.startsWith(href);
 return (
 <Link
 key={href}
 href={href}
 className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
 isActive
 ? "bg-blue-50 text-[#136dec] font-semibold"
 : "text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-700"
 }`}
 >
 {isActive && (
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
 className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 font-medium text-sm transition-colors"
 >
 <LogOut className="h-5 w-5" />
 <span>Cerrar Sesión</span>
 </button>
 </>
 );

 return (
 <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
 {/* Desktop sidebar */}
 <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white p-4 shrink-0 fixed h-full z-10">
 <SidebarContent />
 </aside>

 {/* Mobile top bar */}
 <div className="lg:hidden fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
 <Link href="/paciente" className="flex items-center gap-2">
 <div className="h-7 w-7 rounded-lg bg-[#136dec] text-white flex items-center justify-center">
 <Brain className="h-4 w-4" />
 </div>
 <span className="font-bold text-base">MentaLabs</span>
 </Link>
 <button
 onClick={() => setMobileOpen((v) => !v)}
 className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
 >
 {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
 </button>
 </div>

 {/* Mobile overlay */}
 {mobileOpen && (
 <>
 <div
 className="lg:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
 onClick={() => setMobileOpen(false)}
 />
 <aside className="lg:hidden fixed left-0 top-0 bottom-0 z-40 w-72 flex flex-col bg-white p-4 shadow-2xl">
 <SidebarContent />
 </aside>
 </>
 )}

 <main className="flex-1 lg:ml-64 min-h-screen pt-14 lg:pt-0">{children}</main>
 </div>
 );
}
