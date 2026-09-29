"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, MapPin, Search, SlidersHorizontal, Star, X } from "lucide-react";
import { getAvailability, requestAppointment, type AvailabilityDay } from "../../actions/specialists";
import type { SpecialistCard } from "../../lib/specialists";
import { formatPEN } from "../../lib/format";
import { createClient } from "../../../utils/supabase/client";
import { normalizeRole, type AppRole } from "../../lib/auth/role";
import { Monogram } from "../site/Monogram";

const TOPICS = [
  "Ansiedad", "Depresión", "TDAH/TDA", "Autismo (TEA)", "Desarrollo Infantil",
  "Dificultades de Aprendizaje", "Problemas de Conducta", "Estrés / Burnout", "Duelo y Pérdida", "Terapia de Parejas",
];
const AGES = ["Niños", "Adolescentes", "Adultos", "Adultos mayores"];
const MODES = [
  { id: "online", label: "Online" },
  { id: "presencial", label: "Presencial" },
];
const SORTS = [
  { id: "relevancia", label: "Mejor valorados" },
  { id: "precio", label: "Menor precio" },
  { id: "experiencia", label: "Más experiencia" },
];

type Filters = { q: string; tema: string; edad: string; modalidad: string; orden: string };
const EMPTY: Filters = { q: "", tema: "", edad: "", modalidad: "", orden: "relevancia" };

type Kid = { id: string; name: string };

const normalize = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function MarketplaceDirectory({ specialists }: { specialists: SpecialistCard[] }) {
  const params = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => ({
    q: params.get("q") ?? "",
    tema: params.get("tema") ?? "",
    edad: params.get("edad") ?? "",
    modalidad: params.get("modalidad") ?? "",
    orden: params.get("orden") ?? "relevancia",
  }));
  const [expanded, setExpanded] = useState<string | null>(params.get("especialista"));
  const [showFilters, setShowFilters] = useState(false);
  const [role, setRole] = useState<AppRole | null | undefined>(undefined);
  // Un tutor agenda para uno de sus hijos (cuenta única, ver FamilyContext).
  const [kids, setKids] = useState<Kid[]>([]);
  const [forChild, setForChild] = useState<string | null>(params.get("para"));

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const r = normalizeRole(data.session?.user.app_metadata?.role) ?? null;
      setRole(r);
      if (r !== "tutor" || !data.session) return;
      const { data: links } = await supabase
        .from("tutor_patient_links")
        .select("patient_id, profiles:patient_id(full_name)")
        .eq("tutor_id", data.session.user.id)
        .order("created_at");
      const list = (links ?? []).map((l: any) => ({ id: l.patient_id as string, name: (l.profiles?.full_name as string) ?? "Hijo" }));
      setKids(list);
      setForChild((cur) => (cur && list.some((k) => k.id === cur) ? cur : list[0]?.id ?? null));
    });
  }, []);

  // Filtros en la URL: el enlace se puede compartir y "atrás" no los pierde.
  useEffect(() => {
    const sp = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v && !(k === "orden" && v === "relevancia")) sp.set(k, v);
    });
    if (expanded) sp.set("especialista", expanded);
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [filters, expanded]);

  // Abrir el especialista que viene en el enlace (desde la landing).
  const didScroll = useRef(false);
  useEffect(() => {
    if (didScroll.current || !expanded) return;
    didScroll.current = true;
    document.getElementById(`esp-${expanded}`)?.scrollIntoView({ block: "center" });
  }, [expanded]);

  const results = useMemo(() => {
    const q = normalize(filters.q.trim());
    const list = specialists.filter((s) => {
      if (filters.tema && !s.focus_areas.includes(filters.tema)) return false;
      if (filters.edad && !s.age_groups.includes(filters.edad)) return false;
      if (filters.modalidad && !s.modalities.includes(filters.modalidad)) return false;
      if (!q) return true;
      return normalize(
        [s.full_name, s.specialty, s.title, s.city, ...s.focus_areas, ...s.approaches].filter(Boolean).join(" ")
      ).includes(q);
    });
    const sorters: Record<string, (a: SpecialistCard, b: SpecialistCard) => number> = {
      relevancia: (a, b) => b.rating - a.rating || b.review_count - a.review_count,
      precio: (a, b) => a.hourly_rate - b.hourly_rate,
      experiencia: (a, b) => b.years_experience - a.years_experience,
    };
    return list.sort(sorters[filters.orden] ?? sorters.relevancia);
  }, [specialists, filters]);

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const activeCount = [filters.tema, filters.edad, filters.modalidad].filter(Boolean).length;

  return (
    <div className="mt-12 grid gap-10 lg:grid-cols-[260px_1fr] lg:gap-14">
      {/* ── Filtros ── */}
      <aside aria-label="Filtros" className="lg:sticky lg:top-28 lg:self-start">
        <label className="relative block">
          <span className="sr-only">Buscar</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={filters.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Nombre, ciudad o enfoque"
            className="h-12 w-full rounded-full border border-line bg-surface pl-11 pr-4 text-[0.95rem] outline-none transition-colors placeholder:text-muted focus:border-brand"
          />
        </label>

        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-controls="panel-filtros"
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" /> Filtros{activeCount > 0 && ` (${activeCount})`}
        </button>

        <div id="panel-filtros" className={`${showFilters ? "block" : "hidden"} lg:block`}>
          <FilterGroup label="¿Qué te preocupa?" options={TOPICS.map((t) => ({ id: t, label: t }))} value={filters.tema} onChange={(tema) => set({ tema })} />
          <FilterGroup label="Para quién" options={AGES.map((a) => ({ id: a, label: a }))} value={filters.edad} onChange={(edad) => set({ edad })} />
          <FilterGroup label="Modalidad" options={MODES} value={filters.modalidad} onChange={(modalidad) => set({ modalidad })} />
          {activeCount > 0 && (
            <button type="button" onClick={() => setFilters({ ...EMPTY, q: filters.q, orden: filters.orden })} className="mt-6 text-sm text-brand underline-offset-4 hover:underline">
              Quitar filtros
            </button>
          )}
        </div>
      </aside>

      {/* ── Resultados ── */}
      <section aria-labelledby="resultados-titulo">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <p id="resultados-titulo" className="text-sm text-muted" aria-live="polite">
            {results.length === 1 ? "1 especialista" : `${results.length} especialistas`}
          </p>
          <label className="flex items-center gap-2 text-sm text-muted">
            Ordenar
            <select
              value={filters.orden}
              onChange={(e) => set({ orden: e.target.value })}
              className="rounded-full border border-line bg-surface px-3 py-1.5 text-ink outline-none focus:border-brand"
            >
              {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
        </div>

        {results.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-display text-2xl font-semibold tracking-tight">Nadie coincide con todos esos filtros</p>
            <p className="mt-2 text-muted">Prueba quitando uno; muchos especialistas atienden más de un tema.</p>
            <button type="button" onClick={() => setFilters(EMPTY)} className="mt-6 rounded-full bg-ink px-5 py-2.5 text-sm text-surface">
              Ver a todos
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {results.map((s) => (
              <SpecialistRow
                key={s.id}
                s={s}
                role={role}
                kids={kids}
                forChild={forChild}
                onForChild={setForChild}
                open={expanded === s.id}
                onToggle={() => setExpanded((cur) => (cur === s.id ? null : s.id))}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function FilterGroup({
  label, options, value, onChange,
}: { label: string; options: { id: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset className="mt-8">
      <legend className="text-xs font-medium uppercase tracking-[0.14em] text-muted">{label}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? "" : o.id)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                active ? "border-ink bg-ink text-surface" : "border-line bg-surface text-ink/80 hover:border-ink/40"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

interface BookingContext {
  role: AppRole | null | undefined;
  kids: Kid[];
  forChild: string | null;
  onForChild: (id: string) => void;
}

function SpecialistRow({
  s, open, onToggle, ...booking
}: { s: SpecialistCard; open: boolean; onToggle: () => void } & BookingContext) {
  const panelId = `agenda-${s.id}`;
  return (
    <li id={`esp-${s.id}`} className="scroll-mt-28 py-8">
      <article className="grid gap-5 sm:grid-cols-[auto_1fr_auto] sm:gap-7">
        <Monogram id={s.id} name={s.full_name} className="h-16 w-16 text-xl" />

        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">{s.full_name}</h2>
          <p className="mt-0.5 text-muted">
            {s.title ?? s.specialty}
            {s.license_number && <span className="text-muted/80"> · {s.license_number}</span>}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-ink/80">
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 fill-aji text-aji" aria-hidden="true" />
              <span className="font-medium">{s.rating.toFixed(1)}</span>
              <span className="text-muted">({s.review_count} reseñas)</span>
            </span>
            {s.city && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4 text-muted" aria-hidden="true" />{s.city}</span>}
            {s.years_experience > 0 && <span>{s.years_experience} años de experiencia</span>}
            <span className="capitalize">{s.modalities.join(" y ")}</span>
          </div>

          {s.bio && <p className="mt-4 max-w-[62ch] leading-relaxed text-ink/80">{s.bio}</p>}

          {s.focus_areas.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Temas">
              {s.focus_areas.map((a) => (
                <li key={a} className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-strong">{a}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-start">
          <p className="text-sm text-muted sm:text-right">
            <span className="block font-display text-2xl font-semibold text-ink">{formatPEN(s.hourly_rate)}</span>
            sesión de 60 min
          </p>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={panelId}
            className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
              open ? "bg-band text-ink" : "bg-brand text-surface hover:bg-brand-strong"
            }`}
          >
            {open ? "Ocultar horarios" : "Ver horarios"}
          </button>
        </div>
      </article>

      <div id={panelId} className="collapse-rows" data-open={open}>
        <div>{open && <BookingPanel specialist={s} {...booking} />}</div>
      </div>
    </li>
  );
}

const dayLabel = (ymd: string) =>
  new Intl.DateTimeFormat("es-PE", { weekday: "short", day: "numeric", month: "short", timeZone: "America/Lima" }).format(
    new Date(`${ymd}T12:00:00-05:00`)
  );

function BookingPanel({ specialist, role, kids, forChild, onForChild }: { specialist: SpecialistCard } & BookingContext) {
  const [days, setDays] = useState<AvailabilityDay[] | null>(null);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getAvailability(specialist.id)
      .then((d) => alive && setDays(d))
      .catch(() => alive && setDays([]));
    return () => { alive = false; };
  }, [specialist.id]);

  const book = async () => {
    if (!slot) return;
    setState("saving");
    setError(null);
    try {
      await requestAppointment(specialist.id, slot, role === "tutor" ? forChild ?? undefined : undefined);
      setState("done");
    } catch (e: any) {
      setError(e.message ?? "No se pudo agendar.");
      setState("idle");
      // Refresca: si el horario se ocupó, desaparece de la lista.
      getAvailability(specialist.id).then(setDays);
      setSlot(null);
    }
  };

  const next = `/marketplace?especialista=${specialist.id}`;

  return (
    <div className="mt-6 rounded-3xl bg-surface p-5 ring-1 ring-line sm:ml-[5.75rem] sm:p-7">
      {state === "done" ? (
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ok-soft text-ok"><Check className="h-5 w-5" /></span>
          <div className="flex-1">
            <p className="font-medium">Solicitud enviada a {specialist.full_name}</p>
            <p className="text-sm text-muted">Te avisaremos en tu panel cuando la confirme.</p>
          </div>
          <Link href={role === "tutor" ? "/tutor" : "/paciente/citas"} className="rounded-full bg-ink px-5 py-2.5 text-sm text-surface">
            {role === "tutor" ? "Ver en mi portal" : "Ver mis citas"}
          </Link>
        </div>
      ) : days === null ? (
        <p className="flex items-center gap-2 text-sm text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Buscando horarios libres…</p>
      ) : days.length === 0 ? (
        <p className="text-sm text-muted">No hay horarios libres en las próximas dos semanas.</p>
      ) : (
        <>
          <div role="tablist" aria-label="Días disponibles" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
            {days.map((d, i) => (
              <button
                key={d.date}
                role="tab"
                type="button"
                aria-selected={day === i}
                onClick={() => { setDay(i); setSlot(null); }}
                className={`shrink-0 rounded-2xl border px-4 py-2 text-sm capitalize transition-colors ${
                  day === i ? "border-ink bg-ink text-surface" : "border-line hover:border-ink/40"
                }`}
              >
                {dayLabel(d.date)}
              </button>
            ))}
          </div>

          <div role="tabpanel" className="mt-4 flex flex-wrap gap-2">
            {days[day]?.slots.map((t) => (
              <button
                key={t.iso}
                type="button"
                aria-pressed={slot === t.iso}
                onClick={() => setSlot(t.iso)}
                className={`rounded-full border px-4 py-2 text-sm tabular-nums transition-colors ${
                  slot === t.iso ? "border-brand bg-brand text-surface" : "border-line hover:border-brand"
                }`}
              >
                {t.time}
              </button>
            ))}
          </div>

          {error && <p role="alert" className="mt-4 rounded-2xl bg-bad-soft px-4 py-3 text-sm text-bad">{error}</p>}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <p className="text-sm text-muted">Hora de Lima · {formatPEN(specialist.hourly_rate)} por sesión</p>
            {role === null ? (
              <Link href={`/login?next=${encodeURIComponent(next)}`} className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-surface">
                Ingresa para agendar
              </Link>
            ) : role === "tutor" && kids.length === 0 ? (
              <Link href="/tutor/familia" className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-surface">
                Registra primero a tu hijo
              </Link>
            ) : role && role !== "paciente" && role !== "tutor" ? (
              <p className="text-sm text-muted">Solo pacientes y familias pueden agendar.</p>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
              {role === "tutor" && (
                <label className="flex items-center gap-2 text-sm text-muted">
                  Para
                  <select
                    value={forChild ?? ""}
                    onChange={(e) => onForChild(e.target.value)}
                    className="rounded-full border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-brand"
                  >
                    {kids.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
                  </select>
                </label>
              )}
              <button
                type="button"
                onClick={book}
                disabled={!slot || state === "saving"}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
              >
                {state === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
                Solicitar cita
              </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
