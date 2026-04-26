import Link from "next/link";
import { Brain, ArrowRight, Users, ClipboardList, BarChart3, Gamepad2, Shield, Clock } from "lucide-react";

const STEPS = [
  {
    n: "01", icon: Users, color: "#136dec",
    title: "Crea tu cuenta",
    desc: "Elige tu rol: paciente, tutor o especialista. El proceso toma 2 minutos. El especialista configura su perfil clínico con especialidad y tarifas.",
  },
  {
    n: "02", icon: ClipboardList, color: "#0bda5e",
    title: "El especialista diseña la batería",
    desc: "Con el constructor no-code, el especialista crea exámenes con 5 tipos de pregunta: Likert, Sí/No, Escala visual, Opción única y Texto libre. También puede añadir juegos cognitivos.",
  },
  {
    n: "03", icon: BarChart3, color: "#a855f7",
    title: "Define las reglas diagnósticas",
    desc: "El especialista configura rangos de score y grupos de edad. El sistema generará diagnósticos automáticos con recomendaciones clínicas personalizadas.",
  },
  {
    n: "04", icon: Gamepad2, color: "#f59e0b",
    title: "Asigna evaluaciones al paciente",
    desc: "Con un click, el especialista asigna la batería al paciente. El paciente ve las evaluaciones pendientes en su dashboard y las puede resolver desde cualquier dispositivo.",
  },
  {
    n: "05", icon: Shield, color: "#ef4444",
    title: "El paciente completa la evaluación",
    desc: "Interfaz guiada, navegación por preguntas, marcadores para revisión y indicador de progreso. Los juegos cognitivos capturan métricas automáticamente.",
  },
  {
    n: "06", icon: Clock, color: "#06b6d4",
    title: "Diagnóstico y seguimiento",
    desc: "Al completar, se genera el diagnóstico automático. El especialista revisa, el paciente y tutor ven resultados y recomendaciones. Todo queda en el historial clínico.",
  },
];

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0d1520] text-slate-900 dark:text-slate-100">
      <nav className="fixed top-0 z-50 w-full border-b border-slate-100/80 bg-white/90 backdrop-blur-xl dark:border-slate-800/80 dark:bg-[#0d1520]/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#136dec] text-white"><Brain className="h-5 w-5" /></div>
            <span className="font-display text-lg font-700">Menta<span className="text-[#0bda5e]">Labs</span></span>
          </Link>
          <Link href="/registro" className="rounded-xl bg-[#136dec] px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-600 transition-all">
            Comenzar gratis
          </Link>
        </div>
      </nav>

      <div className="pt-32 pb-16 px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h1 className="font-display text-5xl lg:text-6xl font-800 tracking-tight text-slate-900 dark:text-white mb-6">
            Cómo funciona MentaLabs
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Desde la evaluación hasta el diagnóstico, en un flujo clínico diseñado para ser simple y riguroso a la vez.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Connector line */}
          <div className="absolute left-8 top-16 bottom-16 w-px bg-gradient-to-b from-[#136dec] via-[#0bda5e] to-[#06b6d4] hidden lg:block" />

          <div className="space-y-8">
            {STEPS.map(({ n, icon: Icon, color, title, desc }) => (
              <div key={n} className="relative flex gap-8 items-start">
                <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-4 border-white dark:border-[#0d1520] shadow-lg" style={{ background: color }}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1 pt-3 pb-8">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Paso {n}</div>
                  <h3 className="font-display text-xl font-700 text-slate-900 dark:text-white mb-2">{title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center bg-slate-50 dark:bg-[#0a1018] rounded-3xl p-12">
          <h2 className="font-display text-3xl font-800 text-slate-900 dark:text-white mb-4">
            Listo para empezar
          </h2>
          <p className="text-slate-500 mb-8">Crea tu cuenta en 2 minutos. Sin tarjeta de crédito.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/registro" className="inline-flex items-center gap-2 rounded-2xl bg-[#136dec] px-8 py-4 text-base font-bold text-white shadow-xl shadow-[#136dec]/30 hover:bg-blue-600 transition-all">
              Registrarse <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/marketplace" className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-slate-600 dark:text-slate-300 hover:text-[#136dec] transition-colors">
              Buscar especialista
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
