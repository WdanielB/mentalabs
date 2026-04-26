"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, ArrowRight, TrendingUp, ClipboardList, AlertCircle } from "lucide-react";
import { createClient } from "../../../../utils/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface LinkedPatient {
 id: string;
 full_name: string;
 email: string;
 status: string;
 pendingExams: number;
 lastScore: number | null;
 lastExamTitle: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
 active: { label: "Activo", color: "bg-green-100 text-green-700 " },
 inactive: { label: "Inactivo", color: "bg-slate-100 text-slate-500 " },
 in_treatment: { label: "En tratamiento", color: "bg-blue-100 text-[#136dec] " },
};

export default function TutorHomePage() {
 const [profileName, setProfileName] = useState("");
 const [patients, setPatients] = useState<LinkedPatient[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const load = async () => {
 const supabase = createClient();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return;

 const { data: prof } = await supabase
 .from("profiles")
 .select("full_name")
 .eq("id", user.id)
 .single();
 if (prof) setProfileName(prof.full_name);

 // Get linked patients
 const { data: links } = await supabase
 .from("tutor_patient_links")
 .select(`
 patient_id,
 patients!inner(
 id,
 status,
 profiles!inner(full_name, email)
 )
 `)
 .eq("tutor_id", user.id);

 if (!links || links.length === 0) {
 setLoading(false);
 return;
 }

 const patientIds = links.map((l: any) => l.patient_id);

 // Pending exams per patient
 const { data: pending } = await supabase
 .from("exam_attempts")
 .select("patient_id")
 .in("patient_id", patientIds)
 .eq("status", "pending");

 // Latest completed exam per patient
 const { data: completed } = await supabase
 .from("exam_attempts")
 .select(`
 patient_id,
 total_score,
 exams!inner(title)
 `)
 .in("patient_id", patientIds)
 .eq("status", "completed")
 .order("completed_at", { ascending: false });

 const pendingMap: Record<string, number> = {};
 pending?.forEach((p: any) => {
 pendingMap[p.patient_id] = (pendingMap[p.patient_id] ?? 0) + 1;
 });

 const latestExamMap: Record<string, { score: number; title: string }> = {};
 completed?.forEach((c: any) => {
 if (!latestExamMap[c.patient_id]) {
 latestExamMap[c.patient_id] = { score: c.total_score, title: c.exams?.title };
 }
 });

 const enriched: LinkedPatient[] = links.map((l: any) => ({
 id: l.patients.id,
 full_name: l.patients.profiles?.full_name ?? "Paciente",
 email: l.patients.profiles?.email ?? "",
 status: l.patients.status ?? "active",
 pendingExams: pendingMap[l.patient_id] ?? 0,
 lastScore: latestExamMap[l.patient_id]?.score ?? null,
 lastExamTitle: latestExamMap[l.patient_id]?.title ?? null,
 }));

 setPatients(enriched);
 setLoading(false);
 };
 load();
 }, []);

 const firstName = profileName.split(" ")[0];

 return (
 <div className="p-6 lg:p-8">
 {/* Header */}
 <div className="mb-8">
 {loading ? (
 <div className="h-8 w-52 rounded-lg bg-slate-200 animate-pulse mb-2" />
 ) : (
 <h1 className="text-2xl font-bold text-slate-900 ">
 Bienvenido, {firstName || "Tutor"}
 </h1>
 )}
 <p className="text-slate-500 text-sm mt-1">
 {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
 </p>
 </div>

 {/* Summary */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
 <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-4 shadow-sm">
 <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
 <Users className="h-6 w-6 text-[#136dec]" />
 </div>
 <div>
 {loading ? <div className="h-7 w-8 rounded bg-slate-200 animate-pulse mb-1" /> : (
 <p className="text-2xl font-black">{patients.length}</p>
 )}
 <p className="text-xs text-slate-500 font-medium">Pacientes Vinculados</p>
 </div>
 </div>
 <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-4 shadow-sm">
 <div className="h-12 w-12 rounded-xl bg-yellow-50 flex items-center justify-center shrink-0">
 <ClipboardList className="h-6 w-6 text-yellow-600" />
 </div>
 <div>
 {loading ? <div className="h-7 w-8 rounded bg-slate-200 animate-pulse mb-1" /> : (
 <p className="text-2xl font-black">
 {patients.reduce((sum, p) => sum + p.pendingExams, 0)}
 </p>
 )}
 <p className="text-xs text-slate-500 font-medium">Exámenes Pendientes</p>
 </div>
 </div>
 </div>

 {/* Patients Overview */}
 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
 <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 ">
 <h2 className="font-bold text-base">Mis Pacientes</h2>
 <Link href="/tutor/pacientes" className="text-sm font-semibold text-[#136dec] flex items-center gap-1 hover:underline">
 Ver detalle <ArrowRight className="h-4 w-4" />
 </Link>
 </div>

 {loading && (
 <div className="p-6 space-y-4">
 {Array.from({ length: 2 }).map((_, i) => (
 <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
 ))}
 </div>
 )}

 {!loading && patients.length === 0 && (
 <div className="px-6 py-16 text-center">
 <Users className="h-12 w-12 mx-auto mb-4 text-slate-300 " />
 <p className="font-semibold text-slate-700 ">Sin pacientes vinculados</p>
 <p className="text-slate-400 text-sm mt-1">
 Contacta a un especialista para vincular a tus pacientes.
 </p>
 </div>
 )}

 <div className="divide-y divide-slate-100 ">
 {patients.map((p) => {
 const st = STATUS_LABELS[p.status] ?? STATUS_LABELS.active;
 return (
 <div key={p.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
 <div className="flex items-center gap-3 min-w-0">
 <div className="h-10 w-10 rounded-full bg-slate-400 flex items-center justify-center text-white font-bold shrink-0">
 {p.full_name.charAt(0).toUpperCase()}
 </div>
 <div className="min-w-0">
 <p className="font-semibold text-sm truncate">{p.full_name}</p>
 {p.lastExamTitle ? (
 <p className="text-xs text-slate-500 truncate">
 Último: {p.lastExamTitle}
 {p.lastScore !== null && ` · Score: ${p.lastScore}`}
 </p>
 ) : (
 <p className="text-xs text-slate-500">Sin exámenes completados</p>
 )}
 </div>
 </div>
 <div className="flex items-center gap-3 shrink-0">
 {p.pendingExams > 0 && (
 <span className="flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
 <AlertCircle className="h-3 w-3" />
 {p.pendingExams} pendiente{p.pendingExams > 1 ? "s" : ""}
 </span>
 )}
 <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${st.color}`}>
 {st.label}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </div>
 );
}
