"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, ClipboardList, Calendar, ArrowRight,
  CheckCircle2, Clock, AlertCircle, TrendingUp
} from "lucide-react";
import { createClient } from "../../../../utils/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Stats {
  patients: number;
  pendingExams: number;
  todayAppointments: number;
}

interface RecentPatient {
  id: string;
  full_name: string;
  status: string;
  email: string;
}

interface RecentActivity {
  id: string;
  exam_title: string;
  patient_name: string;
  status: string;
  assigned_at: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:       { label: "Activo",         color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  inactive:     { label: "Inactivo",       color: "bg-slate-100 text-slate-500 dark:bg-slate-800" },
  in_treatment: { label: "En tratamiento", color: "bg-blue-100 text-[#136dec] dark:bg-blue-900/20" },
};

const EXAM_STATUS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending:     { label: "Pendiente",   icon: Clock,         color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20" },
  in_progress: { label: "En progreso", icon: AlertCircle,   color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
  completed:   { label: "Completado",  icon: CheckCircle2,  color: "text-green-600 bg-green-50 dark:bg-green-900/20" },
};

export default function EspecialistaHomePage() {
  const [stats, setStats] = useState<Stats>({ patients: 0, pendingExams: 0, todayAppointments: 0 });
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [profileName, setProfileName] = useState("Especialista");
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

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [pRes, eRes, aRes] = await Promise.all([
        supabase
          .from("appointments")
          .select("patient_id")
          .eq("specialist_id", user.id),
        supabase
          .from("exam_attempts")
          .select("*", { count: "exact", head: true })
          .eq("assigned_by", user.id)
          .eq("status", "pending"),
        supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("specialist_id", user.id)
          .gte("start_time", today.toISOString())
          .lt("start_time", tomorrow.toISOString())
          .in("status", ["scheduled", "confirmed"]),
      ]);

      const uniquePatients = new Set(pRes.data?.map((r: any) => r.patient_id) ?? []);
      setStats({
        patients: uniquePatients.size,
        pendingExams: eRes.count ?? 0,
        todayAppointments: aRes.count ?? 0,
      });

      // Recent patients via appointments
      const { data: appts } = await supabase
        .from("appointments")
        .select("patient_id")
        .eq("specialist_id", user.id)
        .order("start_time", { ascending: false })
        .limit(20);

      if (appts && appts.length > 0) {
        const ids = [...new Set(appts.map((a: any) => a.patient_id))].slice(0, 5);
        const { data: pts } = await supabase
          .from("patients")
          .select("id, status, profiles!inner(full_name, email)")
          .in("id", ids);

        if (pts) {
          setRecentPatients(
            pts.map((p: any) => ({
              id: p.id,
              full_name: p.profiles?.full_name ?? "Paciente",
              email: p.profiles?.email ?? "",
              status: p.status ?? "active",
            }))
          );
        }
      }

      // Recent exam activity
      const { data: attempts } = await supabase
        .from("exam_attempts")
        .select(`
          id,
          status,
          assigned_at,
          exams!inner(title),
          patients!inner(profiles!inner(full_name))
        `)
        .eq("assigned_by", user.id)
        .order("assigned_at", { ascending: false })
        .limit(5);

      if (attempts) {
        setRecentActivity(
          attempts.map((a: any) => ({
            id: a.id,
            exam_title: a.exams?.title ?? "Examen",
            patient_name: a.patients?.profiles?.full_name ?? "Paciente",
            status: a.status,
            assigned_at: a.assigned_at,
          }))
        );
      }

      setLoading(false);
    };
    load();
  }, []);

  const statsCards = [
    { label: "Pacientes Activos",    value: stats.patients,          icon: Users,          color: "from-[#136dec] to-blue-400",  bg: "bg-blue-50 dark:bg-blue-900/20",  text: "text-[#136dec]" },
    { label: "Exámenes Pendientes",  value: stats.pendingExams,       icon: ClipboardList,  color: "from-yellow-400 to-orange-400", bg: "bg-yellow-50 dark:bg-yellow-900/20", text: "text-yellow-600" },
    { label: "Citas Hoy",            value: stats.todayAppointments,  icon: Calendar,       color: "from-[#0bda5e] to-teal-400",   bg: "bg-green-50 dark:bg-green-900/20",  text: "text-[#0bda5e]" },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        {loading ? (
          <div className="h-8 w-56 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse mb-2" />
        ) : (
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Bienvenido, {profileName.split(" ")[0]} 👋
          </h1>
        )}
        <p className="text-slate-500 text-sm mt-1">
          {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statsCards.map(({ label, value, icon: Icon, bg, text }) => (
          <div key={label} className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2432] p-5 flex items-center gap-4 shadow-sm`}>
            <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`h-6 w-6 ${text}`} />
            </div>
            <div>
              {loading ? (
                <div className="h-7 w-12 rounded bg-slate-200 dark:bg-slate-700 animate-pulse mb-1" />
              ) : (
                <p className="text-2xl font-black">{value}</p>
              )}
              <p className="text-xs text-slate-500 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Patients */}
        <div className="lg:col-span-3 bg-white dark:bg-[#1a2432] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold text-base">Pacientes Recientes</h2>
            <Link href="/especialista/pacientes" className="text-sm font-semibold text-[#136dec] flex items-center gap-1 hover:underline">
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700 animate-pulse mb-1" />
                    <div className="h-3 w-48 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  </div>
                </div>
              ))
            )}
            {!loading && recentPatients.length === 0 && (
              <div className="px-6 py-12 text-center">
                <Users className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <p className="text-slate-500 text-sm font-medium">Aún no tienes pacientes registrados</p>
              </div>
            )}
            {recentPatients.map((p) => {
              const st = STATUS_LABELS[p.status] ?? STATUS_LABELS.active;
              return (
                <div key={p.id} className="px-6 py-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#0bda5e] to-[#136dec] flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {p.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{p.full_name}</p>
                      <p className="text-xs text-slate-400">{p.email}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${st.color}`}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1a2432] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold text-base">Actividad Reciente</h2>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </div>
          <div className="p-4 space-y-3">
            {loading && (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))
            )}
            {!loading && recentActivity.length === 0 && (
              <div className="py-10 text-center">
                <ClipboardList className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-slate-500 text-sm">Sin actividad reciente</p>
              </div>
            )}
            {recentActivity.map((a) => {
              const st = EXAM_STATUS[a.status] ?? EXAM_STATUS.pending;
              const StatusIcon = st.icon;
              return (
                <div key={a.id} className={`flex items-start gap-3 p-3 rounded-xl ${st.color}`}>
                  <StatusIcon className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{a.exam_title}</p>
                    <p className="text-xs opacity-70 truncate">{a.patient_name}</p>
                    <p className="text-xs opacity-60 mt-0.5">
                      {format(new Date(a.assigned_at), "d MMM, HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/especialista/pacientes" className="group flex items-center justify-between p-4 bg-white dark:bg-[#1a2432] rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#136dec]/50 shadow-sm transition-all">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-[#136dec]" />
            <span className="font-semibold text-sm">Gestionar Pacientes</span>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#136dec] group-hover:translate-x-1 transition-all" />
        </Link>
        <Link href="/especialista/agenda" className="group flex items-center justify-between p-4 bg-white dark:bg-[#1a2432] rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#136dec]/50 shadow-sm transition-all">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-[#136dec]" />
            <span className="font-semibold text-sm">Ver Agenda</span>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#136dec] group-hover:translate-x-1 transition-all" />
        </Link>
        <Link href="/admin/banco-pruebas" className="group flex items-center justify-between p-4 bg-white dark:bg-[#1a2432] rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#136dec]/50 shadow-sm transition-all">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-[#136dec]" />
            <span className="font-semibold text-sm">Crear Examen</span>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#136dec] group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </div>
  );
}
