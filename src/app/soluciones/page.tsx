import Link from "next/link";
import { Brain, Check, ArrowRight, ChevronRight } from "lucide-react";

const SOLUTIONS = [
 {
 id: "tdah",
 label: "TDAH",
 full: "Trastorno por Déficit de Atención e Hiperactividad",
 color: "#136dec",
 bg: "bg-blue-50 ",
 border: "border-blue-200 ",
 desc: "Evaluaciones estandarizadas para adultos, adolescentes y niños. Escalas Conners, CAARS, ADHD Rating Scale y más.",
 tools: ["Batería Conners 3", "Escala CAARS adultos", "Juego de atención sostenida", "Reglas diagnósticas por edad"],
 },
 {
 id: "tea",
 label: "TEA",
 full: "Trastorno del Espectro Autista",
 color: "#a855f7",
 bg: "bg-purple-50 ",
 border: "border-purple-200 ",
 desc: "Herramientas de cribado y diagnóstico diferencial. Evaluación de comunicación, socialización y comportamientos repetitivos.",
 tools: ["ADOS-2 adaptado", "M-CHAT-R/F cribado", "Evaluación sensorial", "Perfil comunicativo"],
 },
 {
 id: "ansiedad",
 label: "Ansiedad",
 full: "Trastornos de Ansiedad",
 color: "#f59e0b",
 bg: "bg-yellow-50 ",
 border: "border-yellow-200 ",
 desc: "GAD-7, STAI y escalas complementarias para ansiedad generalizada, social y específica.",
 tools: ["GAD-7 completo", "STAI estado/rasgo", "Escala visual analógica", "Registro de síntomas"],
 },
 {
 id: "depresion",
 label: "Depresión",
 full: "Trastornos Depresivos",
 color: "#3b82f6",
 bg: "bg-blue-50 ",
 border: "border-blue-200 ",
 desc: "PHQ-9, BDI-II y escalas complementarias para depresión mayor, distimia y evaluación de riesgo.",
 tools: ["PHQ-9 estandarizado", "BDI-II completo", "Evaluación de riesgo", "Seguimiento longitudinal"],
 },
 {
 id: "dislexia",
 label: "Dislexia",
 full: "Dificultades de Aprendizaje",
 color: "#0bda5e",
 bg: "bg-green-50 ",
 border: "border-green-200 ",
 desc: "Evaluación de conciencia fonológica, lectura y escritura para detección temprana.",
 tools: ["Prueba fonológica", "Test de fluidez lectora", "Evaluación ortografía", "Perfil de aprendizaje"],
 },
 {
 id: "general",
 label: "Evaluación General",
 full: "Evaluación Neuropsicológica Completa",
 color: "#06b6d4",
 bg: "bg-cyan-50 ",
 border: "border-cyan-200 ",
 desc: "Baterías completas de evaluación cognitiva, emocional y conductual para diagnóstico diferencial.",
 tools: ["Perfil cognitivo global", "Evaluación ejecutiva", "Escalas emocionales", "Informe integrado"],
 },
];

export default function SolucionesPage() {
 return (
 <div className="min-h-screen bg-white text-slate-900 ">
 {/* Nav */}
 <nav className="fixed top-0 z-50 w-full border-b border-slate-100/80 bg-white/90 backdrop-blur-xl ">
 <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
 <Link href="/" className="flex items-center gap-2.5">
 <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#136dec] text-white"><Brain className="h-5 w-5" /></div>
 <span className="font-display text-lg font-700">Menta<span className="text-[#0bda5e]">Labs</span></span>
 </Link>
 <Link href="/registro" className="rounded-xl bg-[#136dec] px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-600 transition-all">
 Comenzar
 </Link>
 </div>
 </nav>

 {/* Header */}
 <div className="pt-32 pb-16 px-6 lg:px-8 max-w-7xl mx-auto">
 <div className="text-center mb-16">
 <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#136dec] mb-4">
 <span className="h-px w-8 bg-[#136dec]" /> Plataforma de diagnóstico <span className="h-px w-8 bg-[#136dec]" />
 </div>
 <h1 className="font-display text-5xl lg:text-6xl font-800 tracking-tight text-slate-900 mb-6">
 Soluciones para cada diagnóstico
 </h1>
 <p className="text-lg text-slate-500 max-w-2xl mx-auto">
 Baterías de evaluación validadas clínicamente para el espectro completo de neurodivergencias.
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {SOLUTIONS.map((s) => (
 <div key={s.id} className={`group rounded-3xl border ${s.border} ${s.bg} p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
 <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 text-white" style={{ background: s.color }}>
 {s.label}
 </span>
 <h3 className="font-display text-xl font-700 text-slate-900 mb-3">{s.full}</h3>
 <p className="text-sm text-slate-600 mb-6 leading-relaxed">{s.desc}</p>
 <ul className="space-y-2 mb-6">
 {s.tools.map((t) => (
 <li key={t} className="flex items-center gap-2 text-xs text-slate-600 ">
 <Check className="h-3.5 w-3.5 shrink-0" style={{ color: s.color }} /> {t}
 </li>
 ))}
 </ul>
 <Link href="/registro" className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors" style={{ color: s.color }}>
 Empezar evaluación <ChevronRight className="h-4 w-4" />
 </Link>
 </div>
 ))}
 </div>

 <div className="mt-16 text-center">
 <Link href="/marketplace" className="inline-flex items-center gap-2 rounded-2xl bg-[#136dec] px-8 py-4 text-base font-bold text-white shadow-xl shadow-[#136dec]/30 hover:bg-blue-600 transition-all">
 Buscar especialista <ArrowRight className="h-5 w-5" />
 </Link>
 </div>
 </div>
 </div>
 );
}
