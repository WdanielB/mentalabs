"use client";

import Link from "next/link";
import { 
  FileText, 
  Brain, 
  Activity, 
  Settings, 
  ShieldCheck, 
  AlertTriangle,
  Plus,
  Save,
  CheckCircle,
  ToggleLeft
} from "lucide-react";
import { useState } from "react";

export default function DiagnosticRulesPage() {
  const [activeRule, setActiveRule] = useState(1);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#111822] text-slate-900 dark:text-slate-100 flex font-sans">
      
      {/* Sidebar Admin Menu */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2432] p-4 shrink-0 transition-all">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="h-8 w-8 rounded-lg bg-[#136dec] text-white flex items-center justify-center font-bold">M</div>
          <span className="font-bold text-lg hidden lg:block">Admin Center</span>
        </div>
        
        <nav className="space-y-1 flex-1">
          <Link href="/admin/banco-pruebas" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors">
            <FileText className="h-5 w-5" />
            <span className="hidden lg:block">Banco de Pruebas</span>
          </Link>
          <Link href="/admin/reglas" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-50 text-[#136dec] dark:bg-[#136dec]/10 font-semibold relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#136dec] rounded-r-md"></div>
            <Brain className="h-5 w-5" />
            <span className="hidden lg:block">Reglas Diagnósticas</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors">
            <Activity className="h-5 w-5" />
            <span className="hidden lg:block">Métricas Clínicas</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 flex items-center justify-between px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111822] shrink-0">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-[#0bda5e]" /> Configuración de Reglas
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Gestor de Umbrales y Variables Clínicas (Admin Nivel 1)</p>
          </div>
          
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#136dec] text-white rounded-lg font-bold shadow-lg shadow-[#136dec]/20 hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all hidden sm:flex">
            <Save className="h-4 w-4" /> Guardar Cambios Globales
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px]">
          <div className="max-w-5xl mx-auto space-y-6">
            
            {/* Rule Header Config */}
            <section className="bg-white dark:bg-[#1a2432] rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden ring-1 ring-slate-900/5">
              <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 px-6 py-4 flex items-center justify-between">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5 text-slate-400" />
                  Módulo de Calificación: <span className="text-[#136dec]">TDAH Adultos</span>
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Estado General</span>
                  <div className="w-10 h-5 bg-[#0bda5e] rounded-full relative shadow-inner cursor-pointer">
                    <div className="absolute right-1 top-[2px] w-4 h-4 bg-white rounded-full shadow-sm"></div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Umbral Base (Min Score)</label>
                  <div className="relative">
                    <input type="number" defaultValue="45" className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 font-bold text-lg focus:ring-2 focus:ring-[#136dec] outline-none transition-all pl-12" />
                    <Activity className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">Puntaje mínimo para detonar revisión clínica.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Umbral Crítico (Max Score)</label>
                  <div className="relative">
                    <input type="number" defaultValue="85" className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 font-bold text-lg text-red-500 focus:ring-2 focus:ring-red-500 outline-none transition-all pl-12" />
                    <AlertTriangle className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-red-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">Marcador automático rojo en expediente.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Restricción de Edad</label>
                  <div className="flex items-center gap-2">
                    <input type="number" defaultValue="18" placeholder="Min" className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-center font-bold focus:ring-[#136dec] outline-none" />
                    <span className="text-slate-400 font-bold">-</span>
                    <input type="number" defaultValue="65" placeholder="Max" className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-center font-bold focus:ring-[#136dec] outline-none" />
                  </div>
                </div>
              </div>
            </section>

            {/* Sub-rules list */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Reglas Específicas de Bifurcación <span className="bg-[#136dec]/10 text-[#136dec] px-2 py-0.5 rounded text-xs">3 Reglas</span>
                </h3>
                <button className="flex items-center gap-1.5 text-xs font-bold text-[#136dec] hover:text-blue-600 transition-colors bg-white dark:bg-[#1a2432] border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg shadow-sm">
                  <Plus className="h-4 w-4" /> Añadir Regla
                </button>
              </div>

              <div className="space-y-4">
                {/* Rule Item 1 */}
                <div onClick={() => setActiveRule(1)} className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${activeRule === 1 ? 'bg-white dark:bg-[#1a2432] border-[#136dec] shadow-md' : 'bg-white/50 dark:bg-[#1a2432]/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">1</div>
                      <h4 className="font-bold text-lg">Predominancia Inatenta</h4>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1 rounded bg-[#0bda5e]/10 text-[#0bda5e] text-xs font-bold uppercase">
                      <CheckCircle className="h-3 w-3" /> Activa
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 font-mono text-slate-500">
                    <span className="font-bold text-[#136dec]">IF</span> (Score_Inatencion <span className="font-bold text-slate-900 dark:text-white">&gt; 25</span>)
                    <span className="font-bold text-[#136dec]">AND</span> (Score_Hiperactividad <span className="font-bold text-slate-900 dark:text-white">&lt; 10</span>)
                  </div>
                </div>

                {/* Rule Item 2 */}
                <div onClick={() => setActiveRule(2)} className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${activeRule === 2 ? 'bg-white dark:bg-[#1a2432] border-[#136dec] shadow-md' : 'bg-white/50 dark:bg-[#1a2432]/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">2</div>
                      <h4 className="font-bold text-lg">Presentación Combinada</h4>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1 rounded bg-[#0bda5e]/10 text-[#0bda5e] text-xs font-bold uppercase">
                      <CheckCircle className="h-3 w-3" /> Activa
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 font-mono text-slate-500">
                    <span className="font-bold text-[#136dec]">IF</span> (Score_Inatencion <span className="font-bold text-slate-900 dark:text-white">&gt; 20</span>)
                    <span className="font-bold text-[#136dec]">AND</span> (Score_Hiperactividad <span className="font-bold text-slate-900 dark:text-white">&gt; 20</span>)
                  </div>
                </div>

                 {/* Generator JSON Preview (Mock) */}
                 {activeRule === 1 && (
                  <div className="mt-4 p-4 rounded-xl bg-[#0f172a] text-green-400 font-mono text-xs overflow-hidden shadow-inner border border-slate-800">
                    <div className="flex items-center justify-between mb-2 text-slate-500">
                      <span>Payload JSON Generado (Lectura DB)</span>
                    </div>
                    <pre>
{`{
  "rule_id": "uuid-v4",
  "name": "Predominancia Inatenta",
  "conditions": {
    "module_A": { "operator": ">", "value": 25 },
    "module_B": { "operator": "<", "value": 10 }
  },
  "action": "trigger_recommendations",
  "recommendations": ["Terapia Cog-Conductual", "Revisión en 3 Meses"]
}`}
                    </pre>
                  </div>
                )}
              </div>
            </section>

          </div>
        </div>

      </main>
    </div>
  );
}