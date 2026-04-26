"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, FileText, Globe, ClipboardList, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { listExams } from "../../../../actions/exams";

interface Exam {
 id: string;
 title: string;
 description: string | null;
 created_at: string;
 question_count: number;
 estimated_time: string;
}

export default function EspecialistaExamenesPage() {
 const [exams, setExams] = useState<Exam[]>([]);
 const [filtered, setFiltered] = useState<Exam[]>([]);
 const [search, setSearch] = useState("");
 const [loading, setLoading] = useState(true);
 const [expanded, setExpanded] = useState<Set<string>>(new Set());

 useEffect(() => {
 const load = async () => {
 const data = await listExams({ onlyPublished: true });
 const enriched = data.map((e: any) => {
 const n = e.question_count ?? 0;
 return { ...e, estimated_time: `~${Math.max(1, Math.ceil(n * 1.5))} min` };
 });
 setExams(enriched);
 setFiltered(enriched);
 setLoading(false);
 };
 load();
 }, []);

 useEffect(() => {
 const q = search.toLowerCase();
 setFiltered(q ? exams.filter(e => e.title.toLowerCase().includes(q)) : exams);
 }, [search, exams]);

 const toggle = (id: string) =>
 setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

 return (
 <div className="p-6 lg:p-8">
 <div className="mb-8">
 <h1 className="text-2xl font-black">Biblioteca de Exámenes</h1>
 <p className="text-slate-500 text-sm mt-1">
 {loading ? "Cargando..." : `${exams.length} examen${exams.length !== 1 ? "es" : ""} disponible${exams.length !== 1 ? "s" : ""} para asignar`}
 </p>
 </div>

 {/* Info banner */}
 <div className="mb-6 flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200 ">
 <Globe className="h-5 w-5 text-[#136dec] shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-semibold text-[#136dec]">Exámenes creados por el equipo clínico</p>
 <p className="text-xs text-blue-600 mt-0.5">
 Asigna exámenes a tus pacientes desde{" "}
 <Link href="/especialista/pacientes" className="underline font-semibold">Mis Pacientes</Link>{" "}
 → botón "Asignar Examen".
 </p>
 </div>
 </div>

 {/* Search */}
 <div className="relative mb-6 max-w-sm">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
 <input type="text" value={search} onChange={e => setSearch(e.target.value)}
 placeholder="Buscar examen..."
 className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-[#136dec] focus:border-transparent outline-none transition-all" />
 </div>

 {loading && (
 <div className="space-y-3">
 {Array.from({ length: 3 }).map((_, i) => (
 <div key={i} className="h-20 rounded-2xl bg-white border border-slate-200 animate-pulse" />
 ))}
 </div>
 )}

 {!loading && filtered.length === 0 && (
 <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 ">
 <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300 " />
 <p className="font-bold text-slate-500 text-lg">
 {search ? "Sin resultados" : "No hay exámenes publicados aún"}
 </p>
 </div>
 )}

 <div className="space-y-3">
 {filtered.map(exam => {
 const isOpen = expanded.has(exam.id);
 return (
 <div key={exam.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
 <button onClick={() => toggle(exam.id)}
 className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50 transition-colors">
 <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
 <FileText className="h-5 w-5 text-[#136dec]" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-bold text-sm">{exam.title}</p>
 <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 flex-wrap">
 <span className="flex items-center gap-1"><ClipboardList className="h-3 w-3" />{exam.question_count} preguntas</span>
 <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{exam.estimated_time}</span>
 <span>{format(new Date(exam.created_at), "d MMM yyyy", { locale: es })}</span>
 </div>
 </div>
 <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700 shrink-0">
 <Globe className="h-3 w-3" /> Publicado
 </span>
 {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
 </button>

 {isOpen && (
 <div className="px-5 pb-5 border-t border-slate-100 ">
 {exam.description && (
 <p className="text-sm text-slate-600 mt-4 mb-4 leading-relaxed">{exam.description}</p>
 )}
 <Link href="/especialista/pacientes"
 className="inline-flex items-center gap-2 px-4 py-2 bg-[#136dec] text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors shadow-md shadow-[#136dec]/20">
 <ClipboardList className="h-4 w-4" /> Ir a Mis Pacientes para asignar
 </Link>
 </div>
 )}
 </div>
 );
 })}
 </div>
 </div>
 );
}
