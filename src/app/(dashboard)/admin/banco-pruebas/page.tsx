"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
 Plus, Globe, Lock, ClipboardList, MoreVertical,
 Trash2, Pencil, Search, FileText, X, Clock
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import AdminSidebar from "../../../../components/AdminSidebar";
import { createExam, updateExamMeta, deleteExam, togglePublishExam, listExams } from "../../../../actions/exams";

/* ── Meta helpers ── */
interface ExamMeta { text: string; battery: string; diagnosis_type: string }

function parseMeta(desc: string | null): ExamMeta {
 if (!desc) return { text: "", battery: "", diagnosis_type: "" };
 try {
 const p = JSON.parse(desc);
 if (p && typeof p === "object") return { text: p.text ?? "", battery: p.battery ?? "", diagnosis_type: p.diagnosis_type ?? "" };
 return { text: desc, battery: "", diagnosis_type: "" };
 } catch { return { text: desc, battery: "", diagnosis_type: "" }; }
}
function serializeMeta(text: string, battery: string, diagnosis_type: string) {
 return JSON.stringify({ text, battery, diagnosis_type });
}

const DIAGNOSIS_TYPES = ["TDAH","TEA","Ansiedad","Depresión","TOC","TEPT","Dislexia","Bipolar","General","Otro"];
const STATUS_FILTER = ["Todos","Publicados","En Desarrollo"] as const;
type StatusFilter = typeof STATUS_FILTER[number];

interface Exam {
 id: string; title: string; description: string | null;
 is_published: boolean; created_at: string;
 question_count: number;
 meta: ExamMeta;
}

/* ── Create/Edit Modal ── */
function ExamFormModal({
 initial, onClose, onSave,
}: {
 initial?: { id: string; title: string; meta: ExamMeta };
 onClose: () => void;
 onSave: (title: string, meta: ExamMeta) => Promise<void>;
}) {
 const [title, setTitle] = useState(initial?.title ?? "");
 const [battery, setBattery] = useState(initial?.meta.battery ?? "");
 const [dtype, setDtype] = useState(initial?.meta.diagnosis_type ?? "");
 const [desc, setDesc] = useState(initial?.meta.text ?? "");
 const [saving, setSaving] = useState(false);

 const handleSubmit = async () => {
 if (!title.trim()) return;
 setSaving(true);
 await onSave(title.trim(), { text: desc, battery, diagnosis_type: dtype });
 setSaving(false);
 onClose();
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
 <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
 <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 ">
 <h2 className="font-bold text-base">{initial ? "Editar Examen" : "Nuevo Examen"}</h2>
 <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 "><X className="h-5 w-5" /></button>
 </div>
 <div className="p-6 space-y-4">
 <div>
 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre del Examen *</label>
 <input type="text" autoFocus value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()}
 placeholder="Ej. PHQ-9: Escala de Depresión"
 className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#136dec] focus:border-transparent transition-all" />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Batería</label>
 <input type="text" value={battery} onChange={e => setBattery(e.target.value)}
 placeholder="Ej. Batería TDAH"
 className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-[#136dec] focus:border-transparent transition-all" />
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tipo de Diagnóstico</label>
 <select value={dtype} onChange={e => setDtype(e.target.value)}
 className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-[#136dec] transition-all">
 <option value="">Sin clasificar</option>
 {DIAGNOSIS_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
 </select>
 </div>
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Descripción / Instrucciones</label>
 <textarea rows={3} value={desc} onChange={e => setDesc(e.target.value)}
 placeholder="Instrucciones generales del examen, período de evaluación, etc."
 className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm resize-none outline-none focus:ring-2 focus:ring-[#136dec] focus:border-transparent transition-all" />
 </div>
 </div>
 <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
 <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Cancelar</button>
 <button onClick={handleSubmit} disabled={!title.trim() || saving}
 className="px-5 py-2 bg-[#136dec] text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors shadow-md shadow-[#136dec]/20 disabled:opacity-50">
 {saving ? "Guardando..." : initial ? "Guardar Cambios" : "Crear y Editar"}
 </button>
 </div>
 </div>
 </div>
 );
}

/* ── Main Page ── */
export default function BancoPruebasPage() {
 const router = useRouter();
 const [exams, setExams] = useState<Exam[]>([]);
 const [search, setSearch] = useState("");
 const [status, setStatus] = useState<StatusFilter>("Todos");
 const [dtFilter,setDtFilter]= useState("");
 const [loading, setLoading] = useState(true);
 const [modal, setModal] = useState<"create" | { id: string; title: string; meta: ExamMeta } | null>(null);
 const [menuOpen,setMenuOpen]= useState<string | null>(null);
 const menuRef = useRef<HTMLDivElement>(null);

 const load = async () => {
 const data = await listExams();
 setExams(data.map((e: any) => ({ ...e, meta: parseMeta(e.description) })));
 setLoading(false);
 };

 useEffect(() => { load(); }, []);

 useEffect(() => {
 const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(null); };
 document.addEventListener("mousedown", h);
 return () => document.removeEventListener("mousedown", h);
 }, []);

 const filtered = exams.filter(e => {
 if (status === "Publicados" && !e.is_published) return false;
 if (status === "En Desarrollo" && e.is_published) return false;
 if (dtFilter && e.meta.diagnosis_type !== dtFilter) return false;
 if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
 return true;
 });

 // Group by battery
 const grouped: Record<string, Exam[]> = {};
 for (const e of filtered) {
 const key = e.meta.battery || "Sin Batería";
 if (!grouped[key]) grouped[key] = [];
 grouped[key].push(e);
 }

 const handleCreate = async (title: string, meta: ExamMeta) => {
 try {
 const id = await createExam(title, serializeMeta(meta.text, meta.battery, meta.diagnosis_type));
 router.push(`/admin/banco-pruebas/${id}`);
 } catch (e: any) {
 alert(`Error al crear: ${e.message}`);
 }
 };

 const handleEdit = async (id: string, title: string, meta: ExamMeta) => {
 try {
 await updateExamMeta(id, title, serializeMeta(meta.text, meta.battery, meta.diagnosis_type));
 setExams(prev => prev.map(e => e.id === id ? { ...e, title, meta } : e));
 } catch (e: any) {
 alert(`Error al editar: ${e.message}`);
 }
 };

 const handleDelete = async (id: string) => {
 if (!confirm("¿Eliminar este examen y todas sus preguntas y reglas?")) return;
 try {
 await deleteExam(id);
 setExams(prev => prev.filter(e => e.id !== id));
 setMenuOpen(null);
 } catch (e: any) {
 alert(`Error al eliminar: ${e.message}`);
 }
 };

 const handleTogglePublish = async (id: string, current: boolean) => {
 try {
 await togglePublishExam(id, !current);
 setExams(prev => prev.map(e => e.id === id ? { ...e, is_published: !current } : e));
 setMenuOpen(null);
 } catch (e: any) {
 alert(`Error: ${e.message}`);
 }
 };

 const estimatedTime = (n: number) => `~${Math.max(1, Math.ceil(n * 1.5))} min`;

 return (
 <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
 <AdminSidebar />
 <main className="flex-1 lg:ml-64 p-6 lg:p-8" ref={menuRef}>

 {/* Header */}
 <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
 <div>
 <h1 className="text-2xl font-black">Banco de Pruebas</h1>
 <p className="text-slate-500 text-sm mt-1">{loading ? "Cargando..." : `${exams.length} examen${exams.length !== 1 ? "es" : ""}`}</p>
 </div>
 <button onClick={() => setModal("create")}
 className="flex items-center gap-2 px-4 py-2.5 bg-[#136dec] hover:bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md shadow-[#136dec]/20 transition-all hover:scale-105 active:scale-95">
 <Plus className="h-4 w-4" /> Nuevo Examen
 </button>
 </div>

 {/* Filters */}
 <div className="flex flex-wrap gap-3 mb-6">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
 <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar examen..."
 className="h-9 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-[#136dec] focus:border-transparent outline-none transition-all w-48" />
 </div>
 <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
 {STATUS_FILTER.map(s => (
 <button key={s} onClick={() => setStatus(s)}
 className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${status === s ? "bg-white shadow-sm text-[#136dec]" : "text-slate-500 hover:text-slate-700 "}`}>
 {s}
 </button>
 ))}
 </div>
 <select value={dtFilter} onChange={e => setDtFilter(e.target.value)}
 className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-[#136dec] transition-all">
 <option value="">Todos los diagnósticos</option>
 {DIAGNOSIS_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
 </select>
 </div>

 {loading && (
 <div className="space-y-4">
 {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-32 rounded-2xl bg-white border border-slate-200 animate-pulse" />)}
 </div>
 )}

 {!loading && filtered.length === 0 && (
 <div className="text-center py-20">
 <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300 " />
 <p className="font-bold text-slate-500 text-lg">{search || dtFilter ? "Sin resultados" : "No hay exámenes aún"}</p>
 {!search && !dtFilter && <button onClick={() => setModal("create")} className="mt-4 text-sm font-semibold text-[#136dec] hover:underline">Crear el primer examen</button>}
 </div>
 )}

 {/* Grouped by battery */}
 {Object.entries(grouped).map(([battery, items]) => (
 <div key={battery} className="mb-8">
 <div className="flex items-center gap-3 mb-3">
 <h2 className="font-bold text-sm text-slate-500">{battery}</h2>
 <div className="flex-1 h-px bg-slate-200 " />
 <span className="text-xs text-slate-400">{items.length} examen{items.length !== 1 ? "es" : ""}</span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {items.map(exam => (
 <div key={exam.id} className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden">
 <div className={`h-1.5 w-full ${exam.is_published ? "bg-gradient-to-r from-[#0bda5e] to-[#136dec]" : "bg-slate-200 "}`} />
 <div className="p-5">
 {/* Badges */}
 <div className="flex flex-wrap gap-2 mb-3">
 {exam.meta.diagnosis_type && (
 <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#136dec] ">{exam.meta.diagnosis_type}</span>
 )}
 <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${exam.is_published ? "bg-green-100 text-green-700 " : "bg-slate-100 text-slate-500 "}`}>
 {exam.is_published ? <><Globe className="h-3 w-3" /> Publicado</> : <><Lock className="h-3 w-3" /> En Desarrollo</>}
 </span>
 </div>

 {/* Title + menu */}
 <div className="flex items-start justify-between gap-2 mb-2">
 <Link href={`/admin/banco-pruebas/${exam.id}`} className="flex-1 min-w-0">
 <h3 className="font-bold text-base hover:text-[#136dec] transition-colors truncate">{exam.title}</h3>
 </Link>
 <div className="relative shrink-0">
 <button onClick={() => setMenuOpen(menuOpen === exam.id ? null : exam.id)}
 className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all">
 <MoreVertical className="h-4 w-4" />
 </button>
 {menuOpen === exam.id && (
 <div className="absolute right-0 top-8 z-20 w-48 bg-white rounded-xl border border-slate-200 shadow-lg py-1">
 <Link href={`/admin/banco-pruebas/${exam.id}`} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 transition-colors">
 <Pencil className="h-4 w-4 text-slate-400" /> Editar preguntas
 </Link>
 <button onClick={() => { setModal({ id: exam.id, title: exam.title, meta: exam.meta }); setMenuOpen(null); }}
 className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 transition-colors">
 <Pencil className="h-4 w-4 text-slate-400" /> Editar datos
 </button>
 <button onClick={() => handleTogglePublish(exam.id, exam.is_published)}
 className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 transition-colors">
 {exam.is_published ? <><Lock className="h-4 w-4 text-slate-400" /> Pasar a borrador</> : <><Globe className="h-4 w-4 text-slate-400" /> Publicar</>}
 </button>
 <button onClick={() => handleDelete(exam.id)}
 className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
 <Trash2 className="h-4 w-4" /> Eliminar
 </button>
 </div>
 )}
 </div>
 </div>

 {exam.meta.text && <p className="text-xs text-slate-500 line-clamp-2 mb-3">{exam.meta.text}</p>}

 <div className="flex items-center justify-between text-xs text-slate-400">
 <div className="flex items-center gap-3">
 <span className="flex items-center gap-1"><ClipboardList className="h-3.5 w-3.5" /> {exam.question_count} preg.</span>
 <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {estimatedTime(exam.question_count)}</span>
 </div>
 <span>{format(new Date(exam.created_at), "d MMM yyyy", { locale: es })}</span>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 ))}
 </main>

 {/* Modal */}
 {modal === "create" && (
 <ExamFormModal onClose={() => setModal(null)} onSave={handleCreate} />
 )}
 {modal && typeof modal === "object" && (
 <ExamFormModal
 initial={modal}
 onClose={() => setModal(null)}
 onSave={(title, meta) => handleEdit(modal.id, title, meta)}
 />
 )}
 </div>
 );
}
