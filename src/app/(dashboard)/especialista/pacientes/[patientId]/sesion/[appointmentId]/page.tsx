"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "../../../../../../../../utils/supabase/client";
import ClinicalHistoryView from "../../../../../../../components/ClinicalHistoryView";

interface SessionData {
  patientId: string;
  patientName: string;
  patientBirthDate: string | null;
  specialistId: string;
  specialistName: string;
}

export default function EspecialistaSesionPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.appointmentId as string;
  const patientId = params.patientId as string;

  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [specRes, patRes] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).single(),
        supabase.from("patients")
          .select("id, profiles!inner(full_name, birth_date)")
          .eq("id", patientId)
          .single(),
      ]);

      setData({
        patientId,
        patientName:     (patRes.data as any)?.profiles?.full_name ?? "Paciente",
        patientBirthDate: (patRes.data as any)?.profiles?.birth_date ?? null,
        specialistId:    user.id,
        specialistName:  specRes.data?.full_name ?? "Especialista",
      });
      setLoading(false);
    };
    load();
  }, [patientId, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#111822]">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#136dec] border-t-transparent" />
          Cargando sesión...
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col h-screen">
      {/* Breadcrumb bar */}
      <div className="shrink-0 px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2432] flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Agenda
        </button>
        <span className="text-slate-300 dark:text-slate-700">/</span>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Sesión — {data.patientName}
        </span>
      </div>

      {/* Clinical view fills remaining height */}
      <div className="flex-1 min-h-0">
        <ClinicalHistoryView
          appointmentId={appointmentId}
          patientId={data.patientId}
          patientName={data.patientName}
          patientBirthDate={data.patientBirthDate}
          specialistId={data.specialistId}
          specialistName={data.specialistName}
        />
      </div>
    </div>
  );
}
