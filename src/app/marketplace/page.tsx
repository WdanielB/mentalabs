"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
 Brain, Search, Star, ChevronRight, X, Check,
 Clock, MessageSquare, Video, Loader2
} from "lucide-react";
import { listSpecialists, requestAppointment, type SpecialistCard } from "../../actions/specialists";
import { createClient } from "../../../utils/supabase/client";

const SPECIALTIES = ["Todos", "Psicología", "Psiquiatría", "Neurología", "Terapia Ocupacional", "Fonoaudiología"];

const SLOTS = ["Lun 09:00","Lun 11:00","Mar 10:00","Mar 15:00","Mié 09:00","Jue 11:00","Vie 10:00","Vie 16:00"];

function StarRating({ rating }: { rating: number }) {
 return (
 <div className="flex items-center gap-0.5">
 {[1,2,3,4,5].map(n => (
 <Star key={n} className={`h-3.5 w-3.5 ${n <= Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : "text-slate-200 "}`} />
 ))}
 </div>
 );
}

function BookModal({ specialist, patientId, onClose }: { specialist: SpecialistCard; patientId: string | null; onClose: () => void }) {
 const [selected, setSelected] = useState<string | null>(null);
 const [submitting, setSubmitting] = useState(false);
 const [success, setSuccess] = useState(false);
 const [err, setErr] = useState<string | null>(null);

 const handleBook = async () => {
 if (!selected) return;
 if (!patientId) { setErr("Inicia sesión como paciente para agendar."); return; }
 setSubmitting(true);
 try {
 const dayMap: Record<string, number> = { Lun:1, Mar:2, Mié:3, Jue:4, Vie:5 };
 const [day, time] = selected.split(" ");
 const now = new Date();
 const diff = (dayMap[day] - now.getDay() + 7) % 7 || 7;
 const d = new Date(now); d.setDate(now.getDate() + diff);
 const [h, m] = time.split(":").map(Number);
 d.setHours(h, m, 0, 0);
 await requestAppointment(specialist.id, patientId, d.toISOString());
 setSuccess(true);
 } catch (e: any) { setErr(e.message); }
 setSubmitting(false);
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
 <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
 <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 ">
 <div>
 <h2 className="font-display font-700 text-slate-900 ">{specialist.full_name}</h2>
 <p className="text-xs text-slate-500 mt-0.5">{specialist.specialty}</p>
 </div>
 <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
 <X className="h-5 w-5" />
 </button>
 </div>
 <div className="p-6">
 {success ? (
 <div className="text-center py-6">
 <div className="h-16 w-16 rounded-full bg-[#0bda5e]/15 flex items-center justify-center mx-auto mb-4">
 <Check className="h-8 w-8 text-[#0bda5e]" />
 </div>
 <h3 className="font-display font-700 text-xl text-slate-900 mb-2">¡Cita agendada!</h3>
 <p className="text-sm text-slate-500 mb-6">Revisa tu panel de citas para más detalles.</p>
 <div className="flex gap-3 justify-center">
 <Link href="/paciente/citas" className="px-5 py-2.5 bg-[#136dec] text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors">Ver citas</Link>
 <button onClick={onClose} className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors">Cerrar</button>
 </div>
 </div>
 ) : (
 <>
 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Selecciona un horario</h3>
 <div className="grid grid-cols-2 gap-2 mb-6">
 {SLOTS.map(t => (
 <button key={t} onClick={() => setSelected(t)}
 className={`py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${selected === t ? "border-[#136dec] bg-blue-50 text-[#136dec]" : "border-slate-200 text-slate-700 hover:border-slate-300 "}`}>
 {t}
 </button>
 ))}
 </div>
 {err && <div className="mb-4 p-3 bg-red-50 rounded-xl text-sm text-red-600 border border-red-200 ">{err}</div>}
 <div className="flex items-center justify-between pt-4 border-t border-slate-100 ">
 <div>
 <p className="text-xs text-slate-500">Sesión 60 min</p>
 <p className="font-display font-800 text-2xl text-slate-900 ">${specialist.hourly_rate}</p>
 </div>
 <button onClick={handleBook} disabled={!selected || submitting}
 className="flex items-center gap-2 px-6 py-3 bg-[#136dec] text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-lg shadow-[#136dec]/20 disabled:opacity-50 disabled:cursor-not-allowed">
 {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
 Confirmar cita
 </button>
 </div>
 </>
 )}
 </div>
 </div>
 </div>
 );
}

export default function MarketplacePage() {
 const [all, setAll] = useState<SpecialistCard[]>([]);
 const [filtered, setFiltered] = useState<SpecialistCard[]>([]);
 const [search, setSearch] = useState("");
 const [specialty, setSpecialty] = useState("Todos");
 const [loading, setLoading] = useState(true);
 const [booking, setBooking] = useState<SpecialistCard | null>(null);
 const [patientId, setPatientId] = useState<string | null>(null);

 useEffect(() => {
 const init = async () => {
 const supabase = createClient();
 const { data: { user } } = await supabase.auth.getUser();
 if (user) setPatientId(user.id);
 const data = await listSpecialists();
 setAll(data); setFiltered(data); setLoading(false);
 };
 init();
 }, []);

 useEffect(() => {
 let list = all;
 if (specialty !== "Todos") list = list.filter(s => s.specialty.toLowerCase().includes(specialty.toLowerCase()));
 if (search) list = list.filter(s => s.full_name.toLowerCase().includes(search.toLowerCase()) || s.specialty.toLowerCase().includes(search.toLowerCase()));
 setFiltered(list);
 }, [search, specialty, all]);

 return (
 <div className="min-h-screen bg-slate-50 text-slate-900 ">
 <nav className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-xl ">
 <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
 <Link href="/" className="flex items-center gap-2.5">
 <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#136dec] text-white"><Brain className="h-5 w-5" /></div>
 <span className="font-display text-lg font-700">Menta<span className="text-[#0bda5e]">Labs</span></span>
 </Link>
 <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-[#136dec] transition-colors">Iniciar sesión</Link>
 </div>
 </nav>

 <div className="bg-white border-b border-slate-200 ">
 <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12">
 <h1 className="font-display text-4xl lg:text-5xl font-800 tracking-tight text-slate-900 mb-3">Encuentra a tu especialista</h1>
 <p className="text-slate-500 mb-8">Especialistas certificados en neurodivergencias, listos para evaluarte.</p>
 <div className="flex flex-wrap gap-3">
 <div className="relative flex-1 min-w-[200px] max-w-sm">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
 <input type="text" value={search} onChange={e => setSearch(e.target.value)}
 placeholder="Nombre o especialidad..."
 className="w-full h-11 pl-11 pr-4 rounded-2xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-[#136dec] focus:border-transparent outline-none transition-all" />
 </div>
 <div className="flex items-center gap-2 overflow-x-auto">
 {SPECIALTIES.map(s => (
 <button key={s} onClick={() => setSpecialty(s)}
 className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${specialty === s ? "bg-[#136dec] text-white border-[#136dec]" : "bg-white text-slate-600 border-slate-200 hover:border-[#136dec]/50"}`}>
 {s}
 </button>
 ))}
 </div>
 </div>
 </div>
 </div>

 <div className="mx-auto max-w-7xl px-6 lg:px-8 py-10">
 <p className="text-sm text-slate-500 mb-6">
 {loading ? "Buscando especialistas..." : `${filtered.length} especialista${filtered.length !== 1 ? "s" : ""}`}
 </p>

 {loading && (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {Array.from({ length: 6 }).map((_, i) => (
 <div key={i} className="h-64 rounded-3xl bg-white border border-slate-200 animate-pulse" />
 ))}
 </div>
 )}

 {!loading && all.length === 0 && (
 <div className="text-center p-12 bg-blue-50 rounded-3xl border border-blue-200 ">
 <p className="text-[#136dec] font-semibold mb-2">No hay especialistas registrados aún</p>
 <p className="text-sm text-slate-500 mb-6">Los especialistas aparecerán aquí cuando se registren.</p>
 <Link href="/registro" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#136dec] text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors">
 Registrarse como especialista <ChevronRight className="h-4 w-4" />
 </Link>
 </div>
 )}

 {!loading && all.length > 0 && filtered.length === 0 && (
 <div className="text-center py-16">
 <p className="text-slate-500 font-semibold">Sin resultados</p>
 <button onClick={() => { setSearch(""); setSpecialty("Todos"); }} className="mt-3 text-sm text-[#136dec] font-semibold hover:underline">Limpiar filtros</button>
 </div>
 )}

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {filtered.map(spec => (
 <div key={spec.id} className="group bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
 <div className="relative h-20 bg-gradient-to-br from-[#136dec] to-[#0043b5]">
 <div className="absolute -bottom-8 left-6">
 <div className="h-16 w-16 rounded-2xl border-4 border-white bg-gradient-to-tr from-[#0bda5e] to-[#136dec] flex items-center justify-center text-white font-display font-800 text-2xl shadow-lg">
 {spec.full_name.charAt(0).toUpperCase()}
 </div>
 </div>
 <div className="absolute top-3 right-4 flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1">
 <div className="h-2 w-2 rounded-full bg-[#0bda5e] animate-pulse" />
 <span className="text-white text-xs font-semibold">Disponible</span>
 </div>
 </div>
 <div className="pt-10 px-6 pb-6">
 <div className="flex items-start justify-between mb-3">
 <div>
 <h3 className="font-display font-700 text-slate-900 ">{spec.full_name}</h3>
 <p className="text-sm text-[#136dec] font-semibold">{spec.specialty}</p>
 </div>
 <div className="text-right">
 <p className="font-display font-700 text-slate-900 ">${spec.hourly_rate}</p>
 <p className="text-xs text-slate-400">/hora</p>
 </div>
 </div>
 <div className="flex items-center gap-2 mb-4">
 <StarRating rating={spec.rating} />
 <span className="text-xs text-slate-500 font-semibold">{spec.rating.toFixed(1)}</span>
 </div>
 {spec.bio && <p className="text-sm text-slate-500 leading-relaxed mb-5 line-clamp-2">{spec.bio}</p>}
 <div className="flex items-center gap-3 text-xs text-slate-400 mb-5">
 <span className="flex items-center gap-1"><Video className="h-3.5 w-3.5" /> Online</span>
 <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 60 min</span>
 <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> Chat</span>
 </div>
 <button onClick={() => setBooking(spec)}
 className="w-full py-3 rounded-2xl bg-[#136dec] text-white font-bold text-sm hover:bg-blue-600 transition-all shadow-lg shadow-[#136dec]/20 active:scale-95">
 Agendar consulta
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>

 {booking && <BookModal specialist={booking} patientId={patientId} onClose={() => setBooking(null)} />}
 </div>
 );
}
