"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
 ClipboardList, Calendar, ArrowRight, Clock,
 CheckCircle2, Brain, BookOpen, User,
} from "lucide-react";
import { createClient } from "../../../../utils/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface PatientProfile {
 full_name: string;
 email: string;
 birth_date: string | null;
 status: string | null;
}

interface PendingExam {
 id: string;
 exam_title: string;
 assigned_at: string;
 assigned_by_name: string;
}

interface UpcomingAppointment {
 id: string;
 start_time: string;
 specialist_name: string;
 status: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
 active: { label: "Activo", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
 inactive: { label: "Inactivo", color: "bg-slate-100 text-slate-500 border-slate-200" },
 in_treatment: { label: "En tratamiento", color: "bg-blue-50 text-[#136dec] border-blue-200" },
};

export default function PacienteHomePage() {
 const [profile, setProfile] = useState<PatientProfile | null>(null);
 const [pendingExams, setPendingExams] = useState<PendingExam[]>([]);
 const [nextAppointment, setNextAppointment] = useState<UpcomingAppointment | null>(null);
 const [completedCount, setCompletedCount] = useState(0);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const load = async () => {
 const supabase = createClient();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return;

 const { data: prof } = await supabase
 .from("profiles")
 .select("full_name, email, birth_date")
 .eq("id", user.id)
 .single();

 const { data: patient } = await supabase
 .from("patients")
 .select("status")
 .eq("id", user.id)
 .maybeSingle();

 if (prof) {
 setProfile({
 full_name: prof.full_name,
 email: prof.email,
 birth_date: prof.birth_date ?? null,
 status: patient?.status ?? "active",
 });
 }

 const { data: pendingData } = await supabase
 .from("exam_attempts")
 .select(`
 id,
 assigned_at,
 exams!inner(title),
 specialists!inner(profiles!inner(full_name))
 `)
 .eq("patient_id", user.id)
 .in("status", ["pending", "in_progress"])
 .order("assigned_at", { ascending: false })
 .limit(3);

 if (pendingData) {
 setPendingExams(
 pendingData.map((a: any) => ({
 id: a.id,
 exam_title: a.exams?.title ?? "Examen",
 assigned_at: a.assigned_at,
 assigned_by_name: a.specialists?.profiles?.full_name ?? "Tu especialista",
 }))
 );
 }

 const { count } = await supabase
 .from("exam_attempts")
 .select("*", { count: "exact", head: true })
 .eq("patient_id", user.id)
 .eq("status", "completed");
 setCompletedCount(count ?? 0);

 const { data: appts } = await supabase
 .from("appointments")
 .select(`
 id,
 start_time,
 status,
 specialists!inner(profiles!inner(full_name))
 `)
 .eq("patient_id", user.id)
 .gte("start_time", new Date().toISOString())
 .in("status", ["scheduled", "confirmed"])
 .order("start_time", { ascending: true })
 .limit(1);

 if (appts && appts.length > 0) {
 const a = appts[0] as any;
 setNextAppointment({
 id: a.id,
 start_time: a.start_time,
 specialist_name: a.specialists?.profiles?.full_name ?? "Tu especialista",
 status: a.status,
 });
 }

 setLoading(false);
 };
 load();
 }, []);

 const firstName = profile?.full_name?.split(" ")[0] ?? "";
 const statusCfg = STATUS_LABELS[profile?.status ?? "active"] ?? STATUS_LABELS.active;

 return (
 <div className="p-6 lg:p-8">
 {/* Header */}
 <div className="mb-6">
 {loading ? (
 <div className="h-8 w-48 rounded-lg bg-slate-200 animate-pulse mb-2" />
 ) : (
 <h1 className="text-2xl font-bold text-slate-900 ">
 Hola, {firstName || "Bienvenido"}
 </h1>
 )}
 <p className="text-slate-500 text-sm mt-1">
 {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
 </p>
 </div>

 {/* Patient profile card */}
 <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 flex items-center gap-4">
 <div className="h-12 w-12 rounded-full bg-[#136dec] flex items-center justify-center text-white font-bold text-lg shrink-0">
 {profile?.full_name?.charAt(0)?.toUpperCase() ?? "P"}
 </div>
 <div className="flex-1 min-w-0">
 {loading ? (
 <div className="space-y-2">
 <div className="h-4 w-40 rounded bg-slate-200 animate-pulse" />
 <div className="h-3 w-52 rounded bg-slate-100 animate-pulse" />
 </div>
 ) : (
 <>
 <div className="flex items-center gap-2 flex-wrap">
 <p className="font-semibold">{profile?.full_name}</p>
 <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusCfg.color}`}>
 {statusCfg.label}
 </span>
 </div>
 <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
 <User className="h-3 w-3" /> {profile?.email}
 </p>
 </>
 )}
 </div>
 <Link
 href="/paciente/citas"
 className="shrink-0 px-4 py-2 bg-[#136dec] text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
 >
 Agendar cita
 </Link>
 </div>

 {/* Summary Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
 <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
 <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
 <ClipboardList className="h-5 w-5 text-amber-600" />
 </div>
 <div>
 {loading ? <div className="h-6 w-8 rounded bg-slate-200 animate-pulse mb-1" /> : (
 <p className="text-xl font-bold">{pendingExams.length}</p>
 )}
 <p className="text-xs text-slate-500">Exámenes Pendientes</p>
 </div>
 </div>

 <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
 <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
 <CheckCircle2 className="h-5 w-5 text-emerald-600" />
 </div>
 <div>
 {loading ? <div className="h-6 w-8 rounded bg-slate-200 animate-pulse mb-1" /> : (
 <p className="text-xl font-bold">{completedCount}</p>
 )}
 <p className="text-xs text-slate-500">Exámenes Completados</p>
 </div>
 </div>

 <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
 <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
 <Calendar className="h-5 w-5 text-[#136dec]" />
 </div>
 <div>
 {loading ? <div className="h-6 w-8 rounded bg-slate-200 animate-pulse mb-1" /> : (
 <p className="text-xl font-bold">{nextAppointment ? "1" : "0"}</p>
 )}
 <p className="text-xs text-slate-500">Próxima Cita</p>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
 {/* Pending Exams */}
 <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 overflow-hidden">
 <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 ">
 <h2 className="font-semibold text-sm">Exámenes Asignados</h2>
 <Link href="/paciente/examenes" className="text-xs font-semibold text-[#136dec] flex items-center gap-1 hover:underline">
 Ver todos <ArrowRight className="h-3.5 w-3.5" />
 </Link>
 </div>
 <div className="divide-y divide-slate-100 ">
 {loading && Array.from({ length: 2 }).map((_, i) => (
 <div key={i} className="px-5 py-4">
 <div className="h-4 w-40 rounded bg-slate-200 animate-pulse mb-2" />
 <div className="h-3 w-56 rounded bg-slate-100 animate-pulse" />
 </div>
 ))}
 {!loading && pendingExams.length === 0 && (
 <div className="px-5 py-10 text-center">
 <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500 opacity-60" />
 <p className="font-semibold text-slate-700 text-sm">Todo al día</p>
 <p className="text-slate-400 text-xs mt-1">No tienes exámenes pendientes</p>
 </div>
 )}
 {pendingExams.map((e) => (
 <div key={e.id} className="px-5 py-4 flex items-center justify-between gap-3">
 <div className="flex items-start gap-3">
 <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
 <Brain className="h-4 w-4 text-[#136dec]" />
 </div>
 <div>
 <p className="font-semibold text-sm">{e.exam_title}</p>
 <p className="text-xs text-slate-400">
 Por {e.assigned_by_name} · {formatDistanceToNow(new Date(e.assigned_at), { locale: es, addSuffix: true })}
 </p>
 </div>
 </div>
 <Link
 href="/examen"
 className="shrink-0 px-3 py-1.5 bg-[#136dec] text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors"
 >
 Comenzar
 </Link>
 </div>
 ))}
 </div>
 </div>

 {/* Right column */}
 <div className="lg:col-span-2 space-y-4">
 {/* Next Appointment */}
 <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
 <div className="px-5 py-4 border-b border-slate-100 ">
 <h2 className="font-semibold text-sm">Próxima Cita</h2>
 </div>
 <div className="p-5">
 {loading && <div className="h-20 rounded-lg bg-slate-100 animate-pulse" />}
 {!loading && !nextAppointment && (
 <div className="text-center py-4">
 <Calendar className="h-7 w-7 mx-auto mb-2 text-slate-300 " />
 <p className="text-sm text-slate-500">Sin citas próximas</p>
 <Link href="/paciente/citas" className="text-xs text-[#136dec] font-semibold hover:underline mt-1 block">
 Agendar una cita
 </Link>
 </div>
 )}
 {!loading && nextAppointment && (
 <div className="bg-[#136dec] rounded-xl p-4 text-white">
 <div className="flex items-center gap-2 mb-2">
 <Clock className="h-4 w-4 opacity-70" />
 <span className="text-xs font-medium opacity-70 uppercase tracking-wide">Confirmada</span>
 </div>
 <p className="font-bold text-lg leading-tight">
 {format(new Date(nextAppointment.start_time), "d 'de' MMMM", { locale: es })}
 </p>
 <p className="text-blue-100 text-sm font-medium">
 {format(new Date(nextAppointment.start_time), "HH:mm 'hrs'")}
 </p>
 <p className="text-blue-200 text-xs mt-1">Con {nextAppointment.specialist_name}</p>
 </div>
 )}
 </div>
 </div>

 {/* Diary shortcut */}
 <div className="bg-white rounded-xl border border-slate-200 p-5">
 <div className="flex items-center gap-3 mb-3">
 <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center">
 <BookOpen className="h-5 w-5 text-slate-500" />
 </div>
 <div>
 <p className="font-semibold text-sm">Mi Diario</p>
 <p className="text-xs text-slate-400">Espacio personal</p>
 </div>
 </div>
 <p className="text-xs text-slate-500 mb-4">
 Registra cómo te sientes. Tu especialista puede verlo como parte de tu seguimiento.
 </p>
 <Link
 href="/paciente/diario"
 className="flex items-center justify-center gap-2 w-full py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
 >
 Ir al diario <ArrowRight className="h-3.5 w-3.5" />
 </Link>
 </div>
 </div>
 </div>
 </div>
 );
}
