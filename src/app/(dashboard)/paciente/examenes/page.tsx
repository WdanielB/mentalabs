"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Clock, CheckCircle2, PlayCircle } from "lucide-react";
import { createClient } from "../../../../../utils/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ExamAttempt {
 id: string;
 exam_title: string;
 exam_description: string | null;
 status: string;
 total_score: number | null;
 assigned_at: string;
 completed_at: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
 pending: { label: "Pendiente", icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50 " },
 in_progress: { label: "En Progreso", icon: PlayCircle, color: "text-blue-600", bg: "bg-blue-50 " },
 completed: { label: "Completado", icon: CheckCircle2, color: "text-[#0bda5e]", bg: "bg-green-50 " },
};

export default function PacienteExamenesPage() {
 const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const load = async () => {
 const supabase = createClient();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return;

 const { data } = await supabase
 .from("exam_attempts")
 .select(`
 id,
 status,
 total_score,
 assigned_at,
 completed_at,
 exams!inner(title, description)
 `)
 .eq("patient_id", user.id)
 .order("assigned_at", { ascending: false });

 if (data) {
 setAttempts(
 data.map((a: any) => ({
 id: a.id,
 exam_title: a.exams?.title ?? "Examen",
 exam_description: a.exams?.description ?? null,
 status: a.status,
 total_score: a.total_score,
 assigned_at: a.assigned_at,
 completed_at: a.completed_at,
 }))
 );
 }
 setLoading(false);
 };
 load();
 }, []);

 const pending = attempts.filter((a) => a.status !== "completed");
 const completed = attempts.filter((a) => a.status === "completed");

 return (
 <div className="p-6 lg:p-8">
 <div className="mb-8">
 <h1 className="text-2xl font-black">Mis Exámenes</h1>
 <p className="text-slate-500 text-sm mt-1">
 {loading ? "Cargando..." : `${pending.length} pendiente${pending.length !== 1 ? "s" : ""} · ${completed.length} completado${completed.length !== 1 ? "s" : ""}`}
 </p>
 </div>

 {loading && (
 <div className="space-y-4">
 {Array.from({ length: 3 }).map((_, i) => (
 <div key={i} className="h-28 rounded-2xl bg-white border border-slate-200 animate-pulse" />
 ))}
 </div>
 )}

 {!loading && attempts.length === 0 && (
 <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 ">
 <ClipboardList className="h-14 w-14 mx-auto mb-4 text-slate-300 " />
 <p className="font-bold text-slate-700 text-lg">Sin exámenes asignados</p>
 <p className="text-slate-400 text-sm mt-2">Tu especialista te asignará exámenes cuando los necesite.</p>
 </div>
 )}

 {/* Pending */}
 {!loading && pending.length > 0 && (
 <section className="mb-8">
 <h2 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4">Pendientes</h2>
 <div className="space-y-4">
 {pending.map((a) => {
 const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.pending;
 const StatusIcon = cfg.icon;
 return (
 <div key={a.id} className="flex items-center gap-5 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
 <div className={`h-12 w-12 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
 <StatusIcon className={`h-6 w-6 ${cfg.color}`} />
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-bold">{a.exam_title}</p>
 {a.exam_description && (
 <p className="text-sm text-slate-500 truncate mt-0.5">{a.exam_description}</p>
 )}
 <p className="text-xs text-slate-400 mt-1">
 Asignado {formatDistanceToNow(new Date(a.assigned_at), { locale: es, addSuffix: true })}
 </p>
 </div>
 <Link
 href="/examen"
 className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-[#136dec] text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors shadow-md shadow-[#136dec]/20"
 >
 {a.status === "in_progress" ? "Continuar" : "Comenzar"}
 </Link>
 </div>
 );
 })}
 </div>
 </section>
 )}

 {/* Completed */}
 {!loading && completed.length > 0 && (
 <section>
 <h2 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4">Completados</h2>
 <div className="space-y-3">
 {completed.map((a) => (
 <div key={a.id} className="flex items-center gap-5 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm opacity-80">
 <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
 <CheckCircle2 className="h-5 w-5 text-[#0bda5e]" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-semibold text-sm">{a.exam_title}</p>
 <p className="text-xs text-slate-400 mt-0.5">
 Completado el {a.completed_at ? format(new Date(a.completed_at), "d 'de' MMMM yyyy", { locale: es }) : "—"}
 </p>
 </div>
 {a.total_score !== null && (
 <div className="text-right shrink-0">
 <p className="text-xl font-black text-[#136dec]">{a.total_score}</p>
 <p className="text-xs text-slate-400">Score</p>
 </div>
 )}
 <Link href="/paciente/resultados" className="text-xs font-semibold text-[#136dec] hover:underline shrink-0">
 Ver resultado
 </Link>
 </div>
 ))}
 </div>
 </section>
 )}
 </div>
 );
}
