"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Brain, Search, Star, ChevronRight, X, Check, Clock, MessageSquare,
  Video, Loader2, Heart, Activity, Zap, Users, BookOpen, Sparkles,
  Shield, Moon, Flame, SlidersHorizontal
} from "lucide-react";
import { listSpecialists, requestAppointment, type SpecialistCard } from "../../actions/specialists";
import { createClient } from "../../../utils/supabase/client";

const SPECIALTIES = ["Todos", "Psicología", "Psiquiatría", "Neurología", "Terapia Ocupacional", "Fonoaudiología", "Terapia de Parejas"];

type AreaConfig = {
  id: string;
  label: string;
  Icon: React.ElementType;
  inactive: string;
  active: string;
  iconInactive: string;
  iconActive: string;
};

const CONDITION_AREAS: AreaConfig[] = [
  { id: "Depresión", label: "Depresión", Icon: Moon, inactive: "border-slate-200 text-slate-600 bg-white", active: "border-blue-400 text-blue-700 bg-blue-50", iconInactive: "bg-slate-100 text-slate-400", iconActive: "bg-blue-100 text-blue-600" },
  { id: "Ansiedad", label: "Ansiedad", Icon: Activity, inactive: "border-slate-200 text-slate-600 bg-white", active: "border-violet-400 text-violet-700 bg-violet-50", iconInactive: "bg-slate-100 text-slate-400", iconActive: "bg-violet-100 text-violet-600" },
  { id: "TDAH/TDA", label: "TDAH / TDA", Icon: Zap, inactive: "border-slate-200 text-slate-600 bg-white", active: "border-amber-400 text-amber-700 bg-amber-50", iconInactive: "bg-slate-100 text-slate-400", iconActive: "bg-amber-100 text-amber-600" },
  { id: "Autismo (TEA)", label: "Autismo (TEA)", Icon: Brain, inactive: "border-slate-200 text-slate-600 bg-white", active: "border-emerald-400 text-emerald-700 bg-emerald-50", iconInactive: "bg-slate-100 text-slate-400", iconActive: "bg-emerald-100 text-emerald-600" },
  { id: "Terapia de Parejas", label: "Terapia de Parejas", Icon: Users, inactive: "border-slate-200 text-slate-600 bg-white", active: "border-rose-400 text-rose-700 bg-rose-50", iconInactive: "bg-slate-100 text-slate-400", iconActive: "bg-rose-100 text-rose-600" },
  { id: "Duelo y Pérdida", label: "Duelo y Pérdida", Icon: Heart, inactive: "border-slate-200 text-slate-600 bg-white", active: "border-slate-400 text-slate-700 bg-slate-100", iconInactive: "bg-slate-100 text-slate-400", iconActive: "bg-slate-200 text-slate-600" },
  { id: "Estrés / Burnout", label: "Estrés / Burnout", Icon: Flame, inactive: "border-slate-200 text-slate-600 bg-white", active: "border-orange-400 text-orange-700 bg-orange-50", iconInactive: "bg-slate-100 text-slate-400", iconActive: "bg-orange-100 text-orange-600" },
  { id: "Problemas de Conducta", label: "Conducta", Icon: Shield, inactive: "border-slate-200 text-slate-600 bg-white", active: "border-red-400 text-red-700 bg-red-50", iconInactive: "bg-slate-100 text-slate-400", iconActive: "bg-red-100 text-red-600" },
  { id: "Dificultades de Aprendizaje", label: "Aprendizaje", Icon: BookOpen, inactive: "border-slate-200 text-slate-600 bg-white", active: "border-cyan-400 text-cyan-700 bg-cyan-50", iconInactive: "bg-slate-100 text-slate-400", iconActive: "bg-cyan-100 text-cyan-600" },
  { id: "Desarrollo Infantil", label: "Desarrollo Infantil", Icon: Sparkles, inactive: "border-slate-200 text-slate-600 bg-white", active: "border-purple-400 text-purple-700 bg-purple-50", iconInactive: "bg-slate-100 text-slate-400", iconActive: "bg-purple-100 text-purple-600" },
];

const AREA_TAG_COLORS: Record<string, string> = {
  "Depresión": "bg-blue-50 text-blue-700 border border-blue-200",
  "Ansiedad": "bg-violet-50 text-violet-700 border border-violet-200",
  "TDAH/TDA": "bg-amber-50 text-amber-700 border border-amber-200",
  "Autismo (TEA)": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Terapia de Parejas": "bg-rose-50 text-rose-700 border border-rose-200",
  "Duelo y Pérdida": "bg-slate-100 text-slate-600 border border-slate-200",
  "Estrés / Burnout": "bg-orange-50 text-orange-700 border border-orange-200",
  "Problemas de Conducta": "bg-red-50 text-red-700 border border-red-200",
  "Dificultades de Aprendizaje": "bg-cyan-50 text-cyan-700 border border-cyan-200",
  "Desarrollo Infantil": "bg-purple-50 text-purple-700 border border-purple-200",
};

const SLOTS = ["Lun 09:00","Lun 11:00","Mar 10:00","Mar 15:00","Mié 09:00","Jue 11:00","Vie 10:00","Vie 16:00"];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className={`h-3.5 w-3.5 ${n <= Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : "text-slate-200"}`} />
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
      const d = new Date(now);
      d.setDate(now.getDate() + diff);
      const [h, m] = time.split(":").map(Number);
      d.setHours(h, m, 0, 0);
      await requestAppointment(specialist.id, patientId, d.toISOString());
      setSuccess(true);
    } catch (e: any) {
      setErr(e.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="font-display font-700 text-slate-900">{specialist.full_name}</h2>
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
                    className={`py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${selected === t ? "border-[#136dec] bg-blue-50 text-[#136dec]" : "border-slate-200 text-slate-700 hover:border-slate-300"}`}>
                    {t}
                  </button>
                ))}
              </div>
              {err && <div className="mb-4 p-3 bg-red-50 rounded-xl text-sm text-red-600 border border-red-200">{err}</div>}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div>
                  <p className="text-xs text-slate-500">Sesión 60 min</p>
                  <p className="font-display font-800 text-2xl text-slate-900">${specialist.hourly_rate}</p>
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
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<SpecialistCard | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setPatientId(user.id);
      const data = await listSpecialists();
      setAll(data);
      setFiltered(data);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    let list = all;
    if (selectedArea) {
      list = list.filter(s => s.focus_areas.length === 0 || s.focus_areas.includes(selectedArea));
    }
    if (specialty !== "Todos") {
      list = list.filter(s => s.specialty.toLowerCase().includes(specialty.toLowerCase()));
    }
    if (search) {
      list = list.filter(s =>
        s.full_name.toLowerCase().includes(search.toLowerCase()) ||
        s.specialty.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(list);
  }, [search, specialty, selectedArea, all]);

  const hasActiveFilters = selectedArea !== null || specialty !== "Todos" || search !== "";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#136dec] text-white">
              <Brain className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-700">Menta<span className="text-[#0bda5e]">Labs</span></span>
          </Link>
          <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-[#136dec] transition-colors">
            Iniciar sesión
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0d3b8c] via-[#0c4ea8] to-[#136dec]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 lg:py-20">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-semibold text-white mb-6">
            <div className="h-2 w-2 rounded-full bg-[#0bda5e] animate-pulse" />
            Especialistas verificados disponibles
          </div>
          <h1 className="font-display text-4xl lg:text-5xl font-800 tracking-tight text-white mb-4 leading-tight">
            Encuentra el apoyo<br className="hidden sm:block" /> que necesitas hoy
          </h1>
          <p className="text-white/65 text-lg mb-10 max-w-lg">
            Especialistas certificados en salud mental y neurodivergencias, listos para acompañarte.
          </p>
          <div className="relative max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o especialidad..."
              className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white text-slate-900 text-sm shadow-2xl focus:ring-2 focus:ring-[#0bda5e] outline-none transition-all border-0"
            />
          </div>
        </div>
      </div>

      {/* Condition areas */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-8">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Encuentra apoyo para...</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {CONDITION_AREAS.map(({ id, label, Icon, inactive, active, iconInactive, iconActive }) => {
              const isActive = selectedArea === id;
              return (
                <button
                  key={id}
                  onClick={() => setSelectedArea(isActive ? null : id)}
                  className={`flex items-center gap-2.5 p-3 rounded-2xl border-2 text-left transition-all duration-200 ${isActive ? active : inactive + " hover:shadow-sm hover:border-slate-300"}`}
                >
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isActive ? iconActive : iconInactive}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold leading-tight">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Specialty tabs */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-slate-200 sticky top-[64px] z-30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center gap-2.5 py-3 overflow-x-auto scrollbar-hide">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            {SPECIALTIES.map(s => (
              <button
                key={s}
                onClick={() => setSpecialty(s)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  specialty === s
                    ? "bg-[#136dec] text-white border-[#136dec]"
                    : "bg-white text-slate-600 border-slate-200 hover:border-[#136dec]/50 hover:text-[#136dec]"
                }`}
              >
                {s}
              </button>
            ))}
            {hasActiveFilters && (
              <button
                onClick={() => { setSearch(""); setSpecialty("Todos"); setSelectedArea(null); }}
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-red-500 rounded-full border border-slate-200 hover:border-red-200 transition-all ml-auto"
              >
                <X className="h-3 w-3" /> Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <p className="text-sm text-slate-500">
            {loading ? "Buscando especialistas..." : `${filtered.length} especialista${filtered.length !== 1 ? "s" : ""}`}
          </p>
          {selectedArea && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#136dec]/10 text-[#136dec] rounded-full text-xs font-bold">
              {selectedArea}
              <button onClick={() => setSelectedArea(null)} className="hover:text-blue-800">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 rounded-3xl bg-white border border-slate-200 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && all.length === 0 && (
          <div className="text-center p-12 bg-blue-50 rounded-3xl border border-blue-200">
            <p className="text-[#136dec] font-semibold mb-2">No hay especialistas registrados aún</p>
            <p className="text-sm text-slate-500 mb-6">Los especialistas aparecerán aquí cuando se registren.</p>
            <Link href="/registro" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#136dec] text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors">
              Registrarse como especialista <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {!loading && all.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-700 font-bold text-lg mb-1">Sin resultados</p>
            <p className="text-slate-500 text-sm mb-4">Ningún especialista coincide con los filtros actuales.</p>
            <button
              onClick={() => { setSearch(""); setSpecialty("Todos"); setSelectedArea(null); }}
              className="text-sm text-[#136dec] font-semibold hover:underline"
            >
              Limpiar filtros
            </button>
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
                    <h3 className="font-display font-700 text-slate-900">{spec.full_name}</h3>
                    <p className="text-sm text-[#136dec] font-semibold">{spec.specialty}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-700 text-slate-900">${spec.hourly_rate}</p>
                    <p className="text-xs text-slate-400">/hora</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <StarRating rating={spec.rating} />
                  <span className="text-xs text-slate-500 font-semibold">{spec.rating.toFixed(1)}</span>
                </div>
                {spec.bio && <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">{spec.bio}</p>}
                {spec.focus_areas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {spec.focus_areas.slice(0, 3).map(area => (
                      <span key={area} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${AREA_TAG_COLORS[area] ?? "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                        {area}
                      </span>
                    ))}
                    {spec.focus_areas.length > 3 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                        +{spec.focus_areas.length - 3}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs text-slate-400 mb-5">
                  <span className="flex items-center gap-1"><Video className="h-3.5 w-3.5" /> Online</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 60 min</span>
                  <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> Chat</span>
                </div>
                <button
                  onClick={() => setBooking(spec)}
                  className="w-full py-3 rounded-2xl bg-[#136dec] text-white font-bold text-sm hover:bg-blue-600 transition-all shadow-lg shadow-[#136dec]/20 active:scale-95"
                >
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
