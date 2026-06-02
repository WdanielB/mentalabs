"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, ClipboardList, Calendar, ChevronRight,
  CheckCircle2, Clock, AlertCircle, TrendingUp,
  Check, Loader2,
} from "lucide-react";
import { createClient } from "../../../../utils/supabase/client";
import { updateSpecialistFocusAreas } from "../../../actions/specialists";
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

const FOCUS_AREAS = [
  "Depresion", "Ansiedad", "TDAH/TDA", "Autismo (TEA)",
  "Terapia de Parejas", "Duelo y Perdida", "Estres / Burnout",
  "Problemas de Conducta", "Dificultades de Aprendizaje", "Desarrollo Infantil",
];

const STATUS_LABELS: Record<string, { label: string; dot: string; text: string }> = {
  active:       { label: "Activo",         dot: "bg-[#107e3e]", text: "text-[#107e3e]" },
  inactive:     { label: "Inactivo",       dot: "bg-[#6a6a6a]", text: "text-[#6a6a6a]" },
  in_treatment: { label: "En tratamiento", dot: "bg-[#0070f2]", text: "text-[#0070f2]" },
};

const EXAM_STATUS: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pending:     { label: "Pendiente",   icon: Clock,        color: "text-[#e9730c]", bg: "bg-[#fff8f1]" },
  in_progress: { label: "En progreso", icon: AlertCircle,  color: "text-[#0070f2]", bg: "bg-[#eaf1fb]" },
  completed:   { label: "Completado",  icon: CheckCircle2, color: "text-[#107e3e]", bg: "bg-[#f1fdf6]" },
};

export default function EspecialistaHomePage() {
  const [stats, setStats] = useState<Stats>({ patients: 0, pendingExams: 0, todayAppointments: 0 });
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [profileName, setProfileName] = useState("Especialista");
  const [loading, setLoading] = useState(true);
  const [currentAreas, setCurrentAreas] = useState<string[]>([]);
  const [savingAreas, setSavingAreas] = useState(false);
  const [areasSaved, setAreasSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles").select("full_name").eq("id", user.id).single();
      if (prof) setProfileName(prof.full_name);

      const { data: specData } = await supabase
        .from("specialists").select("focus_areas").eq("id", user.id).single();
      if (specData?.focus_areas) setCurrentAreas(specData.focus_areas);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [assignRes, pRes, eRes, aRes] = await Promise.all([
        supabase.from("specialist_patient_assignments").select("patient_id").eq("specialist_id", user.id),
        supabase.from("appointments").select("patient_id").eq("specialist_id", user.id),
        supabase.from("exam_attempts").select("*", { count: "exact", head: true }).eq("assigned_by", user.id).eq("status", "pending"),
        supabase.from("appointments").select("*", { count: "exact", head: true }).eq("specialist_id", user.id)
          .gte("start_time", today.toISOString()).lt("start_time", tomorrow.toISOString()).in("status", ["scheduled", "confirmed"]),
      ]);

      const uniquePatients = new Set([
        ...(assignRes.data?.map((r: any) => r.patient_id) ?? []),
        ...(pRes.data?.map((r: any) => r.patient_id) ?? []),
      ]);
      setStats({ patients: uniquePatients.size, pendingExams: eRes.count ?? 0, todayAppointments: aRes.count ?? 0 });

      const { data: recentAssignments } = await supabase
        .from("specialist_patient_assignments").select("patient_id, assigned_at")
        .eq("specialist_id", user.id).order("assigned_at", { ascending: false }).limit(20);

      const { data: appts } = await supabase
        .from("appointments").select("patient_id")
        .eq("specialist_id", user.id).order("start_time", { ascending: false }).limit(20);

      const recentIds = [
        ...(recentAssignments?.map((a: any) => a.patient_id) ?? []),
        ...(appts?.map((a: any) => a.patient_id) ?? []),
      ];

      if (recentIds.length > 0) {
        const ids = [...new Set(recentIds)].slice(0, 5);
        const { data: pts } = await supabase
          .from("patients").select("id, status, profiles!inner(full_name, email)").in("id", ids);
        if (pts) {
          setRecentPatients(pts.map((p: any) => ({
            id: p.id,
            full_name: p.profiles?.full_name ?? "Paciente",
            email: p.profiles?.email ?? "",
            status: p.status ?? "active",
          })));
        }
      }

      const { data: attempts } = await supabase
        .from("exam_attempts")
        .select(`id, status, assigned_at, exams!inner(title), patients!inner(profiles!inner(full_name))`)
        .eq("assigned_by", user.id).order("assigned_at", { ascending: false }).limit(5);

      if (attempts) {
        setRecentActivity(attempts.map((a: any) => ({
          id: a.id,
          exam_title: a.exams?.title ?? "Examen",
          patient_name: a.patients?.profiles?.full_name ?? "Paciente",
          status: a.status,
          assigned_at: a.assigned_at,
        })));
      }

      setLoading(false);
    };
    load();
  }, []);

  const handleSaveAreas = async () => {
    setSavingAreas(true);
    try {
      await updateSpecialistFocusAreas(currentAreas);
      setAreasSaved(true);
      setTimeout(() => setAreasSaved(false), 2500);
    } catch (e: any) {
      console.error(e.message);
    }
    setSavingAreas(false);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="bg-white border-b border-[#d9d9d9] px-6 py-3">
        <div className="flex items-center gap-1.5 text-xs text-[#6a6a6a] mb-0.5">
          <span>MentaLabs</span>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-[#1d2d3e]">Inicio</span>
        </div>
        {loading ? (
          <div className="h-5 w-52 bg-[#f2f4f7] animate-pulse" />
        ) : (
          <h1 className="text-base font-bold text-[#1d2d3e]">
            Panel de {profileName.split(" ")[0]}
          </h1>
        )}
        <p className="text-xs text-[#6a6a6a] mt-0.5">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI Tiles */}
        <section>
          <p className="text-[11px] font-bold text-[#6a6a6a] uppercase tracking-wider mb-2">Resumen del Dia</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#d9d9d9] border border-[#d9d9d9]">
            {[
              { label: "Pacientes Activos",   value: stats.patients,          icon: Users },
              { label: "Examenes Pendientes", value: stats.pendingExams,      icon: ClipboardList },
              { label: "Citas Hoy",           value: stats.todayAppointments, icon: Calendar },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white px-5 py-4 flex items-center gap-4">
                <div className="h-10 w-10 bg-[#eaf1fb] flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-[#0070f2]" />
                </div>
                <div>
                  {loading ? (
                    <div className="h-8 w-12 bg-[#f2f4f7] animate-pulse mb-1" />
                  ) : (
                    <p className="text-3xl font-bold text-[#1d2d3e]">{value}</p>
                  )}
                  <p className="text-xs text-[#6a6a6a] font-medium">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Patients + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Recent Patients */}
          <section className="lg:col-span-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold text-[#6a6a6a] uppercase tracking-wider">Pacientes Recientes</p>
              <Link href="/especialista/pacientes" className="text-[11px] font-semibold text-[#0070f2] flex items-center gap-1 hover:underline">
                Ver todos <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="border border-[#d9d9d9] bg-white">
              {loading && Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-5 py-3.5 flex items-center gap-3 border-b border-[#e8e8e8] last:border-0">
                  <div className="h-8 w-8 bg-[#f2f4f7] animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-36 bg-[#f2f4f7] animate-pulse" />
                    <div className="h-3 w-52 bg-[#f2f4f7] animate-pulse" />
                  </div>
                </div>
              ))}
              {!loading && recentPatients.length === 0 && (
                <div className="px-5 py-10 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-[#d9d9d9]" />
                  <p className="text-sm text-[#6a6a6a]">Sin pacientes registrados</p>
                </div>
              )}
              {recentPatients.map((p, i) => {
                const st = STATUS_LABELS[p.status] ?? STATUS_LABELS.active;
                return (
                  <div
                    key={p.id}
                    className={`px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-[#f5f5f5] transition-colors ${i < recentPatients.length - 1 ? "border-b border-[#e8e8e8]" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-[#1d2d3e] flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {p.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-[#1d2d3e]">{p.full_name}</p>
                        <p className="text-xs text-[#6a6a6a]">{p.email}</p>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs font-medium shrink-0 ${st.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Recent Activity */}
          <section className="lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold text-[#6a6a6a] uppercase tracking-wider">Actividad Reciente</p>
              <TrendingUp className="h-3.5 w-3.5 text-[#6a6a6a]" />
            </div>
            <div className="border border-[#d9d9d9] bg-white">
              {loading && Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-4 py-3 border-b border-[#e8e8e8] last:border-0 space-y-1.5">
                  <div className="h-3.5 w-36 bg-[#f2f4f7] animate-pulse" />
                  <div className="h-3 w-24 bg-[#f2f4f7] animate-pulse" />
                </div>
              ))}
              {!loading && recentActivity.length === 0 && (
                <div className="px-5 py-8 text-center">
                  <ClipboardList className="h-7 w-7 mx-auto mb-2 text-[#d9d9d9]" />
                  <p className="text-sm text-[#6a6a6a]">Sin actividad reciente</p>
                </div>
              )}
              {recentActivity.map((a, i) => {
                const st = EXAM_STATUS[a.status] ?? EXAM_STATUS.pending;
                const StatusIcon = st.icon;
                return (
                  <div
                    key={a.id}
                    className={`px-4 py-3 hover:bg-[#f5f5f5] transition-colors ${i < recentActivity.length - 1 ? "border-b border-[#e8e8e8]" : ""}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <StatusIcon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${st.color}`} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-[#1d2d3e] truncate">{a.exam_title}</p>
                        <p className="text-xs text-[#6a6a6a] truncate">{a.patient_name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 ${st.bg} ${st.color}`}>
                            {st.label}
                          </span>
                          <span className="text-[10px] text-[#6a6a6a]">
                            {format(new Date(a.assigned_at), "d MMM, HH:mm", { locale: es })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Quick Actions */}
        <section>
          <p className="text-[11px] font-bold text-[#6a6a6a] uppercase tracking-wider mb-2">Acciones Rapidas</p>
          <div className="border border-[#d9d9d9] bg-white divide-y divide-[#e8e8e8]">
            {[
              { href: "/especialista/pacientes", icon: Users,         label: "Gestionar Pacientes" },
              { href: "/especialista/agenda",    icon: Calendar,      label: "Ver Agenda" },
              { href: "/especialista/examenes",  icon: ClipboardList, label: "Biblioteca de Examenes" },
            ].map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-[#f5f5f5] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-[#0070f2]" />
                  <span className="font-medium text-sm text-[#1d2d3e]">{label}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-[#6a6a6a] group-hover:text-[#0070f2] transition-colors" />
              </Link>
            ))}
          </div>
        </section>

        {/* Focus Areas */}
        <section>
          <div className="border border-[#d9d9d9] bg-white">
            <div className="px-5 py-3 border-b border-[#d9d9d9] bg-[#f2f4f7] flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-semibold text-[#1d2d3e]">Areas de Enfoque</p>
                <p className="text-xs text-[#6a6a6a] mt-0.5">Seleccione las condiciones en que se especializa. Visible en el perfil publico.</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {areasSaved && (
                  <span className="flex items-center gap-1.5 text-xs text-[#107e3e] font-semibold">
                    <Check className="h-3.5 w-3.5" /> Guardado
                  </span>
                )}
                <button
                  onClick={handleSaveAreas}
                  disabled={savingAreas}
                  className="flex items-center gap-2 px-4 py-1.5 bg-[#0070f2] text-white text-xs font-semibold hover:bg-[#0057c2] transition-colors disabled:opacity-50"
                >
                  {savingAreas && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Guardar
                </button>
              </div>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap gap-2">
                {FOCUS_AREAS.map((area) => {
                  const isActive = currentAreas.includes(area);
                  return (
                    <button
                      key={area}
                      onClick={() => setCurrentAreas((prev) =>
                        isActive ? prev.filter((a) => a !== area) : [...prev, area]
                      )}
                      className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                        isActive
                          ? "border-[#0070f2] bg-[#eaf1fb] text-[#0070f2]"
                          : "border-[#d9d9d9] bg-white text-[#1d2d3e] hover:bg-[#f5f5f5]"
                      }`}
                    >
                      {area}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
