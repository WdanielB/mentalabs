"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Stethoscope, UserCheck, FileText, ClipboardList, ArrowRight, Activity } from "lucide-react";
import { createClient } from "../../../../utils/supabase/client";
import { getAdminStats } from "../../../actions/admin";
import AdminSidebar from "../../../components/AdminSidebar";

interface Stats { patients: number; specialists: number; tutors: number; exams: number; attempts: number }

export default function AdminOverviewPage() {
 const router = useRouter();
 const [stats, setStats] = useState<Stats>({ patients: 0, specialists: 0, tutors: 0, exams: 0, attempts: 0 });
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const load = async () => {
 const supabase = createClient();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) { router.push("/login"); return; }
 const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
 if (!prof || prof.role !== "admin") { router.push("/login"); return; }

 const data = await getAdminStats();
 setStats(data);
 setLoading(false);
 };
 load();
 }, [router]);

 const cards = [
 { label: "Pacientes", value: stats.patients, icon: Users, color: "bg-blue-50 ", text: "text-[#136dec]" },
 { label: "Especialistas", value: stats.specialists, icon: Stethoscope, color: "bg-green-50 ", text: "text-green-600" },
 { label: "Tutores", value: stats.tutors, icon: UserCheck, color: "bg-purple-50 ",text: "text-purple-600" },
 { label: "Exámenes Publicados", value: stats.exams, icon: FileText, color: "bg-yellow-50 ",text: "text-yellow-600" },
 { label: "Intentos Totales", value: stats.attempts, icon: ClipboardList,color: "bg-red-50 ", text: "text-red-500" },
 ];

 return (
 <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
 <AdminSidebar />
 <main className="flex-1 lg:ml-64 p-6 lg:p-8">
 <div className="mb-8">
 <h1 className="text-2xl font-black">Panel de Administración</h1>
 <p className="text-slate-500 text-sm mt-1">Resumen del sistema MentaLabs</p>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
 {cards.map(({ label, value, icon: Icon, color, text }) => (
 <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
 <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
 <Icon className={`h-5 w-5 ${text}`} />
 </div>
 {loading ? <div className="h-7 w-12 rounded bg-slate-200 animate-pulse mb-1" /> : <p className="text-3xl font-black">{value}</p>}
 <p className="text-xs text-slate-500 font-medium mt-1">{label}</p>
 </div>
 ))}
 </div>
 <h2 className="font-bold text-lg mb-4">Acceso Rápido</h2>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {[
 { href: "/admin/banco-pruebas", icon: FileText, color: "bg-blue-50 ", text: "text-[#136dec]", title: "Banco de Pruebas", desc: "Construye y gestiona exámenes diagnósticos con el editor no-code." },
 { href: "/admin/reglas", icon: Activity, color: "bg-green-50 ", text: "text-green-600", title: "Reglas Diagnósticas", desc: "Configura umbrales de score, edades y recomendaciones automáticas." },
 ].map(({ href, icon: Icon, color, text, title, desc }) => (
 <Link key={href} href={href} className="group flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-200 hover:border-[#136dec]/50 shadow-sm transition-all">
 <div className="flex items-start gap-4">
 <div className={`h-12 w-12 rounded-xl ${color} flex items-center justify-center shrink-0`}><Icon className={`h-6 w-6 ${text}`} /></div>
 <div><p className="font-bold">{title}</p><p className="text-sm text-slate-500 mt-0.5">{desc}</p></div>
 </div>
 <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-[#136dec] group-hover:translate-x-1 transition-all shrink-0 ml-4" />
 </Link>
 ))}
 </div>
 </main>
 </div>
 );
}
