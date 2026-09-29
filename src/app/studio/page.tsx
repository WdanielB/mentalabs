import Link from "next/link";
import { Brain, ArrowRight, Lock, Zap, BarChart3, Gamepad2, ClipboardList, ChevronRight } from "lucide-react";

import { SiteHeader } from "../../components/site/SiteHeader";
export default function StudioPage() {
 return (
 <div className="min-h-screen bg-surface text-slate-900 ">
 <SiteHeader />

 {/* Hero */}
 <div className="pt-32 pb-20 px-6 lg:px-8 max-w-7xl mx-auto">
 <div className="max-w-3xl">
 <div className="inline-flex items-center gap-2 text-sm font-semibold text-brand mb-6">
 <Zap className="h-4 w-4" /> Studio No-Code
 </div>
 <h1 className="font-display text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
 El poder clínico,<br />sin una línea de código.
 </h1>
 <p className="text-lg text-slate-500 leading-relaxed mb-10">
 El Studio de MentaLabs es el entorno de creación de baterías diagnósticas. Arrastra, configura y publica evaluaciones clínicas complejas en minutos.
 </p>
 <div className="flex flex-wrap gap-4">
 <Link href="/login" className="inline-flex items-center gap-2 rounded-2xl bg-brand px-8 py-4 text-base font-bold text-white shadow-xl shadow-brand/30 hover:bg-blue-600 transition-all">
 Abrir Studio <ArrowRight className="h-5 w-5" />
 </Link>
 <Link href="/como-funciona" className="inline-flex items-center gap-2 px-6 py-4 text-base font-semibold text-slate-600 hover:text-brand transition-colors group">
 Ver cómo funciona <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
 </Link>
 </div>
 </div>
 </div>

 {/* Features */}
 <div className="bg-slate-50 py-20 px-6 lg:px-8">
 <div className="max-w-7xl mx-auto">
 <h2 className="font-display text-3xl font-extrabold text-slate-900 mb-10">
 Todo lo que necesitas para evaluar
 </h2>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 {[
 { icon: ClipboardList, color: "#6a48b9", title: "5 tipos de pregunta", desc: "Likert, Sí/No, Escala visual, Opción única y Texto libre con scores configurables." },
 { icon: Gamepad2, color: "#a855f7", title: "Juegos cognitivos", desc: "Memoria, reacción, atención sostenida y clasificación. Métricas automáticas." },
 { icon: BarChart3, color: "#33a36d", title: "Reglas diagnósticas", desc: "Score + edad = diagnóstico automático con recomendaciones personalizadas." },
 { icon: Lock, color: "#f59e0b", title: "Control de acceso", desc: "Borradores solo visibles para admin. Publicados disponibles para especialistas." },
 ].map(({ icon: Icon, color, title, desc }) => (
 <div key={title} className="p-6 bg-surface rounded-2xl border border-slate-200 ">
 <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}18` }}>
 <Icon className="h-5 w-5" style={{ color }} />
 </div>
 <h3 className="font-display font-bold text-slate-900 mb-2">{title}</h3>
 <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* CTA */}
 <div className="py-20 px-6 lg:px-8 text-center">
 <p className="text-slate-500 mb-6">Solo disponible para administradores y especialistas registrados.</p>
 <Link href="/login" className="inline-flex items-center gap-2 rounded-2xl bg-brand px-8 py-4 text-base font-bold text-white shadow-xl shadow-brand/30 hover:bg-blue-600 transition-all">
 Iniciar sesión <ArrowRight className="h-5 w-5" />
 </Link>
 </div>
 </div>
 );
}
