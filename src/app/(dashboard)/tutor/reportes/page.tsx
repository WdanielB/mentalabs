"use client";

import { BarChart3 } from "lucide-react";

export default function TutorReportesPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black">Reportes</h1>
        <p className="text-slate-500 text-sm mt-1">Vista consolidada del progreso de tus pacientes</p>
      </div>
      <div className="text-center py-20 bg-white dark:bg-[#1a2432] rounded-2xl border border-slate-200 dark:border-slate-800">
        <BarChart3 className="h-14 w-14 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
        <p className="font-bold text-slate-700 dark:text-slate-300 text-lg">Próximamente</p>
        <p className="text-slate-400 text-sm mt-2">Los reportes consolidados estarán disponibles pronto.</p>
      </div>
    </div>
  );
}
