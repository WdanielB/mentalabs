"use client";

import Link from "next/link";
import { 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  Brain, 
  History, 
  Activity, 
  FolderTree, 
  Tag, 
  MoreVertical,
  ChevronRight,
  UserCircle
} from "lucide-react";

export default function TestBankPage() {
  // Mock data for the test bank
  const questions = [
    { id: 1, content: "¿Con qué frecuencia tiene dificultad para mantener la atención?", category: "Atención", tags: ["TDAH", "Adultos", "Base"], difficulty: 1 },
    { id: 2, content: "¿Se siente inquieto o como si estuviera impulsado por un motor?", category: "Hiperactividad", tags: ["TDAH", "Motor", "Crítico"], difficulty: 2 },
    { id: 3, content: "¿Dificultad para comprender sarcasmo o doble sentido?", category: "Social", tags: ["TEA", "Comunicación"], difficulty: 3 },
    { id: 4, content: "¿Hipersensibilidad a ruidos fuertes o luces brillantes?", category: "Sensorial", tags: ["TEA", "Sensorial"], difficulty: 1 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#111822] text-slate-900 dark:text-slate-100 flex font-sans">
      
      {/* Sidebar Admin Menu */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2432] p-4 shrink-0">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="h-8 w-8 rounded-lg bg-[#136dec] text-white flex items-center justify-center font-bold">M</div>
          <span className="font-bold text-lg">Admin Center</span>
        </div>
        
        <nav className="space-y-1 flex-1">
          <Link href="/admin/banco-pruebas" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-50 text-[#136dec] dark:bg-[#136dec]/10 font-semibold relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#136dec] rounded-r-md"></div>
            <FileText className="h-5 w-5" />
            <span>Banco de Pruebas</span>
          </Link>
          <Link href="/admin/reglas" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors">
            <Brain className="h-5 w-5" />
            <span>Reglas Diagnósticas</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors">
            <Activity className="h-5 w-5" />
            <span>Métricas Clínicas</span>
          </Link>
        </nav>
      </aside>

      {/* Main Split Layout */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden h-screen">
        
        {/* Left Panel: Library / Banco de Pruebas */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 dark:border-slate-800">
          <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111822]">
            <h1 className="font-bold text-xl">Librería de Reactivos</h1>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#136dec] hover:bg-blue-600 text-white rounded-lg font-semibold text-sm shadow-md shadow-[#136dec]/20 transition-all">
              <Plus className="h-4 w-4" /> Nuevo Reactivo
            </button>
          </header>

          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#111822]">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar por contenido, categoría o tag..." 
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2432] text-sm focus:ring-2 focus:ring-[#136dec] focus:border-transparent outline-none transition-all"
                />
              </div>
              <button className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2432] font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Filter className="h-4 w-4" /> Filtros
              </button>
            </div>
            
            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">Categorías:</span>
              {["Todas", "Atención", "Hiperactividad", "Social", "Sensorial"].map(cat => (
                <button key={cat} className="px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2432] text-xs font-medium hover:border-[#136dec] dark:hover:border-[#136dec] transition-colors whitespace-nowrap">
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {questions.map((q) => (
              <div key={q.id} className="group bg-white dark:bg-[#1a2432] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-[#136dec]/50 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-[#136dec] text-xs font-bold">
                      <FolderTree className="h-3 w-3" /> {q.category}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${
                      q.difficulty === 1 ? 'bg-green-400' : q.difficulty === 2 ? 'bg-yellow-400' : 'bg-red-400'
                    }`} title={`Dificultad: Nivel ${q.difficulty}`}></span>
                  </div>
                  <button className="text-slate-400 opacity-0 group-hover:opacity-100 hover:text-slate-900 dark:hover:text-white transition-all">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-4 line-clamp-2">
                  {q.content}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {q.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#111822]">
                      <Tag className="h-3 w-3" /> {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Clinical History & Patient Context Viewer */}
        <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-[#111822]">
          <header className="h-16 flex items-center gap-2 px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1a2432]">
            <History className="h-5 w-5 text-slate-400" />
            <h2 className="font-bold">Contexto Clínico</h2>
          </header>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-[#0bda5e] to-[#136dec] p-1 mb-3">
                <div className="h-full w-full rounded-full bg-white dark:bg-[#1a2432] flex items-center justify-center">
                  <UserCircle className="h-12 w-12 text-slate-300" />
                </div>
              </div>
              <h3 className="font-bold text-lg">Paciente Anónimo #84A</h3>
              <p className="text-sm text-slate-500">28 Años · Masculino</p>
              <div className="mt-3 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 font-bold text-xs">
                Evaluación en Progreso
              </div>
            </div>

            <div className="space-y-6">
              <section>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Historial Resumido</h4>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1a2432] border border-slate-100 dark:border-slate-800 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Derivado por médico general por problemas graves de concentración en ámbito laboral y ansiedad social incipiente. Posible comorbilidad TDAH/TEA.
                </div>
              </section>

              <section>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Métricas Recientes</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111822] shadow-sm">
                    <div className="text-slate-500 text-xs font-medium mb-1">Score Inicial</div>
                    <div className="text-xl font-bold text-[#136dec]">42/100</div>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111822] shadow-sm">
                    <div className="text-slate-500 text-xs font-medium mb-1">Riesgo</div>
                    <div className="text-xl font-bold text-red-500">Alto</div>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Línea de Tiempo Clínico</h4>
                <div className="relative pl-3 border-l-2 border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="relative">
                    <div className="absolute -left-[17px] top-1 h-3 w-3 rounded-full bg-[#136dec] ring-4 ring-white dark:ring-[#111822]"></div>
                    <p className="text-xs text-slate-500 mb-0.5">Hoy, 10:45 AM</p>
                    <p className="text-sm font-medium">Asignación de "Módulo Hiperactividad"</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[17px] top-1 h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-600 ring-4 ring-white dark:ring-[#111822]"></div>
                    <p className="text-xs text-slate-500 mb-0.5">Hace 2 días</p>
                    <p className="text-sm font-medium">Completó evaluación base (Score: 42)</p>
                  </div>
                </div>
              </section>

            </div>
          </div>
          
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2432]">
            <button className="w-full py-2.5 rounded-lg border border-[#136dec] text-[#136dec] dark:text-[#3b82f6] dark:border-[#3b82f6] font-semibold text-sm hover:bg-blue-50 dark:hover:bg-[#136dec]/10 transition-colors flex items-center justify-center gap-2">
              Ver Expediente Completo <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </main>

    </div>
  );
}