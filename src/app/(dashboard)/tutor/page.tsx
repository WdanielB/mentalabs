"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, ChevronRight, ClipboardList, AlertCircle, BarChart3, Calendar,
} from "lucide-react";
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

const STATUS: Record<string, { label: string; dot: string; text: string }> = {
  active:       { label: "Activo",         dot: "bg-[#107e3e]", text: "text-[#107e3e]" },
  inactive:     { label: "Inactivo",       dot: "bg-[#6a6a6a]", text: "text-[#6a6a6a]" },
  in_treatment: { label: "En tratamiento", dot: "bg-[#0070f2]", text: "text-[#0070f2]" },
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
        .from("profiles").select("full_name").eq("id", user.id).single();
      if (prof) setProfileName(prof.full_name);

      const { data: links } = await supabase
        .from("tutor_patient_links")
        .select(`patient_id, patients!inner(id, status, profiles!inner(full_name, email))`)
        .eq("tutor_id", user.id);

      if (!links || links.length === 0) {
        setLoading(false);
        return;
      }

      const patientIds = links.map((l: any) => l.patient_id);

      const { data: pending } = await supabase
        .from("exam_attempts").select("patient_id")
        .in("patient_id", patientIds).eq("status", "pending");

      const { data: completed } = await supabase
        .from("exam_attempts")
        .select(`patient_id, total_score, exams!inner(title)`)
        .in("patient_id", patientIds).eq("status", "completed")
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

      setPatients(links.map((l: any) => ({
        id: l.patients.id,
        full_name: l.patients.profiles?.full_name ?? "Paciente",
        email: l.patients.profiles?.email ?? "",
        status: l.patients.status ?? "active",
        pendingExams: pendingMap[l.patient_id] ?? 0,
        lastScore: latestExamMap[l.patient_id]?.score ?? null,
        lastExamTitle: latestExamMap[l.patient_id]?.title ?? null,
      })));

      setLoading(false);
    };
    load();
  }, []);

  const totalPending = patients.reduce((s, p) => s + p.pendingExams, 0);

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
          <div className="h-5 w-44 bg-[#f2f4f7] animate-pulse" />
        ) : (
          <h1 className="text-base font-bold text-[#1d2d3e]">
            Panel de {profileName.split(" ")[0] || "Tutor"}
          </h1>
        )}
        <p className="text-xs text-[#6a6a6a] mt-0.5">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI Tiles */}
        <section>
          <p className="text-[11px] font-bold text-[#6a6a6a] uppercase tracking-wider mb-2">Resumen General</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#d9d9d9] border border-[#d9d9d9]">
            <div className="bg-white px-5 py-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-[#eaf1fb] flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-[#0070f2]" />
              </div>
              <div>
                {loading ? <div className="h-8 w-10 bg-[#f2f4f7] animate-pulse mb-1" /> : (
                  <p className="text-3xl font-bold text-[#1d2d3e]">{patients.length}</p>
                )}
                <p className="text-xs text-[#6a6a6a] font-medium">Pacientes Vinculados</p>
              </div>
            </div>
            <div className="bg-white px-5 py-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-[#fff8f1] flex items-center justify-center shrink-0">
                <ClipboardList className="h-5 w-5 text-[#e9730c]" />
              </div>
              <div>
                {loading ? <div className="h-8 w-10 bg-[#f2f4f7] animate-pulse mb-1" /> : (
                  <p className="text-3xl font-bold text-[#1d2d3e]">{totalPending}</p>
                )}
                <p className="text-xs text-[#6a6a6a] font-medium">Examenes Pendientes (total)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Patient Table */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold text-[#6a6a6a] uppercase tracking-wider">Mis Pacientes</p>
            <Link href="/tutor/pacientes" className="text-[11px] font-semibold text-[#0070f2] flex items-center gap-1 hover:underline">
              Ver detalle <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="border border-[#d9d9d9] bg-white overflow-hidden">
            {loading && (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 bg-[#f2f4f7] animate-pulse" />
                ))}
              </div>
            )}
            {!loading && patients.length === 0 && (
              <div className="px-6 py-14 text-center">
                <Users className="h-10 w-10 mx-auto mb-3 text-[#d9d9d9]" />
                <p className="font-semibold text-sm text-[#1d2d3e]">Sin pacientes vinculados</p>
                <p className="text-[#6a6a6a] text-xs mt-1">
                  Contacta a un especialista para vincular a tus pacientes.
                </p>
              </div>
            )}
            {patients.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f2f4f7] border-b border-[#d9d9d9]">
                    <th className="px-5 py-2.5 text-left text-[10px] font-bold text-[#6a6a6a] uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-[#6a6a6a] uppercase tracking-wider hidden sm:table-cell">
                      Ultimo Examen
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-[#6a6a6a] uppercase tracking-wider">
                      Pendientes
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-[#6a6a6a] uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8e8e8]">
                  {patients.map((p) => {
                    const st = STATUS[p.status] ?? STATUS.active;
                    return (
                      <tr key={p.id} className="hover:bg-[#f5f5f5] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-7 w-7 bg-[#1d2d3e] flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {p.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-[#1d2d3e]">{p.full_name}</p>
                              <p className="text-[10px] text-[#6a6a6a]">{p.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden sm:table-cell">
                          {p.lastExamTitle ? (
                            <div>
                              <p className="text-xs text-[#1d2d3e] truncate max-w-[180px]">{p.lastExamTitle}</p>
                              {p.lastScore !== null && (
                                <p className="text-[10px] text-[#6a6a6a]">Score: {p.lastScore}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-[#6a6a6a]">Sin examenes</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {p.pendingExams > 0 ? (
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#e9730c]">
                              <AlertCircle className="h-3.5 w-3.5" />
                              {p.pendingExams}
                            </span>
                          ) : (
                            <span className="text-xs text-[#6a6a6a]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`flex items-center gap-1.5 text-xs font-medium ${st.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Quick Links */}
        <section>
          <p className="text-[11px] font-bold text-[#6a6a6a] uppercase tracking-wider mb-2">Acceso Rapido</p>
          <div className="border border-[#d9d9d9] bg-white divide-y divide-[#e8e8e8]">
            {[
              { href: "/tutor/pacientes", icon: Users,     label: "Ver Pacientes" },
              { href: "/tutor/agenda",    icon: Calendar,  label: "Ver Agenda" },
              { href: "/tutor/reportes",  icon: BarChart3, label: "Ver Reportes" },
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
      </div>
    </div>
  );
}
