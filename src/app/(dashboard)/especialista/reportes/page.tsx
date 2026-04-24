"use client";

import { useEffect, useState } from "react";
import { BarChart3, Download, Search, Filter } from "lucide-react";
import { createClient } from "../../../../../utils/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DiagnosticReport {
  id: string;
  patient_name: string;
  exam_title: string;
  total_score: number | null;
  subcategory: string;
  completed_at: string;
}

export default function EspecialistaReportesPage() {
  const [reports, setReports] = useState<DiagnosticReport[]>([]);
  const [filtered, setFiltered] = useState<DiagnosticReport[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("diagnostics")
        .select(`
          id,
          generated_subcategory,
          created_at,
          exam_attempts!inner(
            total_score,
            completed_at,
            assigned_by,
            patients!inner(profiles!inner(full_name)),
            exams!inner(title)
          )
        `)
        .eq("exam_attempts.assigned_by", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setReports(
          data.map((d: any) => ({
            id: d.id,
            patient_name: d.exam_attempts?.patients?.profiles?.full_name ?? "Paciente",
            exam_title: d.exam_attempts?.exams?.title ?? "Examen",
            total_score: d.exam_attempts?.total_score ?? null,
            subcategory: d.generated_subcategory ?? "—",
            completed_at: d.exam_attempts?.completed_at ?? d.created_at,
          }))
        );
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q
        ? reports.filter(
            (r) =>
              r.patient_name.toLowerCase().includes(q) ||
              r.exam_title.toLowerCase().includes(q) ||
              r.subcategory.toLowerCase().includes(q)
          )
        : reports
    );
  }, [search, reports]);

  const exportPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Reporte de Diagnósticos - MentaLabs", 20, 20);
      doc.setFontSize(10);
      doc.text(`Generado: ${format(new Date(), "d 'de' MMMM yyyy", { locale: es })}`, 20, 30);

      let y = 45;
      filtered.forEach((r, i) => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFontSize(11);
        doc.text(`${i + 1}. ${r.patient_name}`, 20, y);
        doc.setFontSize(9);
        doc.text(`   Examen: ${r.exam_title} | Score: ${r.total_score ?? "—"} | Resultado: ${r.subcategory}`, 20, y + 6);
        doc.text(`   Fecha: ${format(new Date(r.completed_at), "d MMM yyyy HH:mm", { locale: es })}`, 20, y + 12);
        y += 22;
      });

      doc.save(`reporte-diagnosticos-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    } catch {
      alert("Error al generar el PDF. Asegúrate de tener jspdf instalado.");
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black">Reportes Diagnósticos</h1>
          <p className="text-slate-500 text-sm mt-1">
            {loading ? "Cargando..." : `${reports.length} diagnóstico${reports.length !== 1 ? "s" : ""} registrado${reports.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={exportPDF}
          disabled={loading || filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#136dec] hover:bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-md shadow-[#136dec]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4" /> Exportar PDF
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por paciente, examen o resultado..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2432] text-sm focus:ring-2 focus:ring-[#136dec] focus:border-transparent outline-none transition-all"
          />
        </div>
        <button className="flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2432] font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <Filter className="h-4 w-4" /> Filtros
        </button>
      </div>

      <div className="bg-white dark:bg-[#1a2432] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="hidden md:grid grid-cols-5 gap-4 px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#111822]">
          {["Paciente", "Examen", "Score", "Resultado", "Fecha"].map((h) => (
            <span key={h} className="text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</span>
          ))}
        </div>

        {loading && Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="h-4 w-full max-w-xs rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-500">
              {search ? "Sin resultados" : "Aún no hay diagnósticos generados"}
            </p>
          </div>
        )}

        {filtered.map((r) => (
          <div key={r.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors items-center">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#0bda5e] to-[#136dec] flex items-center justify-center text-white font-bold text-xs shrink-0">
                {r.patient_name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold truncate">{r.patient_name}</span>
            </div>
            <span className="text-sm text-slate-600 dark:text-slate-300 truncate">{r.exam_title}</span>
            <span className="text-sm font-bold text-[#136dec]">{r.total_score ?? "—"}</span>
            <span className="text-sm text-slate-600 dark:text-slate-300">{r.subcategory}</span>
            <span className="text-xs text-slate-400">
              {format(new Date(r.completed_at), "d MMM yyyy", { locale: es })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
