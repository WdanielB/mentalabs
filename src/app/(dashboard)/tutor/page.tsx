"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, ClipboardCheck, FileSignature, Plus, Search, Stethoscope } from "lucide-react";
import { createClient } from "../../../../utils/supabase/client";
import { useFamily } from "../../../lib/family/FamilyContext";
import { ageLabel, displayScore, firstName, formatDateLima, parseExamMeta, type ExamMeta } from "../../../lib/format";

interface Appointment { id: string; start_time: string; status: string; attention_type: string | null; specialist: string }
interface Attempt {
  id: string; status: string; total_score: number | null; assigned_at: string; completed_at: string | null;
  title: string; meta: ExamMeta; subcategory: string | null; recommendations: string[];
}
interface Report { id: string; signed_at: string; specialist: string; session: string | null; reason: string | null; plan: string | null; codes: string[] }

type Event = { at: string; kind: "cita" | "evaluacion" | "informe" | "proxima"; title: string; detail: string };

export default function TutorHomePage() {
  const { active, loading: familyLoading, children } = useFamily();
  const [data, setData] = useState<{ appts: Appointment[]; attempts: Attempt[]; reports: Report[] } | null>(null);

  useEffect(() => {
    if (!active) return;
    let alive = true;
    setData(null);
    (async () => {
      const supabase = createClient();
      const [{ data: appts }, { data: attempts }, { data: records }] = await Promise.all([
        supabase
          .from("appointments")
          .select("id, start_time, status, attention_type, specialists(display_name)")
          .eq("patient_id", active.id)
          .order("start_time"),
        supabase
          .from("exam_attempts")
          .select("id, status, total_score, assigned_at, completed_at, exams(title, description), diagnostics(generated_subcategory, recommendations)")
          .eq("patient_id", active.id)
          .order("assigned_at"),
        supabase
          .from("clinical_records")
          .select("id, signed_at, consultation_reason, treatment_plan, diagnostic_codes, specialists(display_name), appointments(attention_type)")
          .eq("patient_id", active.id)
          .eq("status", "signed_and_locked")
          .order("signed_at"),
      ]);
      if (!alive) return;
      setData({
        appts: (appts ?? []).map((a: any) => ({ ...a, specialist: a.specialists?.display_name ?? "Especialista" })),
        attempts: (attempts ?? []).map((a: any) => ({
          id: a.id, status: a.status, total_score: a.total_score, assigned_at: a.assigned_at, completed_at: a.completed_at,
          title: a.exams?.title ?? "Evaluación", meta: parseExamMeta(a.exams?.description),
          subcategory: a.diagnostics?.[0]?.generated_subcategory ?? null,
          recommendations: a.diagnostics?.[0]?.recommendations ?? [],
        })),
        reports: (records ?? []).map((r: any) => ({
          id: r.id, signed_at: r.signed_at, specialist: r.specialists?.display_name ?? "Especialista",
          session: (Array.isArray(r.appointments) ? r.appointments[0] : r.appointments)?.attention_type ?? null,
          reason: r.consultation_reason, plan: r.treatment_plan, codes: r.diagnostic_codes ?? [],
        })),
      });
    })();
    return () => { alive = false; };
  }, [active]);

  if (familyLoading) return <div className="p-8"><div className="h-40 animate-pulse rounded-3xl bg-band" /></div>;

  if (!active) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-bold tracking-[-0.03em]">Empecemos por tu hijo o hija</h1>
        <p className="mt-3 text-muted">Regístralo una sola vez y gestiona sus citas y evaluaciones desde tu cuenta.</p>
        <Link href="/tutor/familia" className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 font-medium text-surface">
          <Plus className="h-4 w-4" /> Registrar a mi hijo
        </Link>
      </div>
    );
  }

  const name = firstName(active.full_name);
  const now = Date.now();
  const next = data?.appts.find((a) => new Date(a.start_time).getTime() > now && a.status !== "cancelled");
  const todo = data?.attempts.filter((a) => a.status !== "completed" && a.meta.respondent !== "especialista") ?? [];
  const done = data?.attempts.filter((a) => a.status === "completed") ?? [];

  const events: Event[] = data
    ? [
        ...data.appts.map<Event>((a) => {
          const day = a.start_time.slice(0, 10);
          const signed = data.reports.some((r) => r.signed_at.slice(0, 10) === day);
          return {
            at: a.start_time,
            kind: new Date(a.start_time).getTime() > now ? "proxima" : signed ? "informe" : "cita",
            title: a.attention_type ?? "Consulta",
            detail: signed ? `${a.specialist} · informe firmado` : a.specialist,
          };
        }),
        ...done
          .filter((a) => a.meta.kind !== "games") // la batería ya aparece como la sesión de evaluación
          .map<Event>((a) => ({ at: a.completed_at!, kind: "evaluacion", title: a.title.split(" · ")[0], detail: a.subcategory ?? "Completada" })),
      ].sort((a, b) => a.at.localeCompare(b.at))
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{children.length > 1 ? "Perfil activo" : "Tu hijo"}</p>
          <h1 className="font-display text-[clamp(2rem,4vw,2.8rem)] font-bold leading-none tracking-[-0.035em]">{active.full_name}</h1>
          <p className="mt-2 text-muted">{ageLabel(active.birth_date)}</p>
        </div>
        <Link href={`/marketplace?para=${active.id}`} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm hover:border-ink/40">
          <Search className="h-4 w-4" /> Buscar especialista para {name}
        </Link>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-8">
          {/* Por hacer */}
          <section aria-labelledby="pendientes">
            <h2 id="pendientes" className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Por hacer</h2>
            {!data ? (
              <div className="mt-3 h-20 animate-pulse rounded-2xl bg-band" />
            ) : todo.length === 0 ? (
              <p className="mt-3 rounded-2xl bg-surface px-5 py-4 text-sm text-muted ring-1 ring-line">No hay cuestionarios pendientes para {name}.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {todo.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-4 rounded-2xl bg-surface px-5 py-4 ring-1 ring-brand/40">
                    <ClipboardCheck className="h-5 w-5 text-brand" aria-hidden="true" />
                    <div className="min-w-0 flex-1 basis-[220px]">
                      <p className="font-medium">{a.title}</p>
                      <p className="text-sm text-muted">
                        {a.meta.kind === "games" ? `Para que juegue ${name} (unos 15 min)` : `Lo respondes tú sobre ${name}`} · asignado el {formatDateLima(a.assigned_at)}
                      </p>
                    </div>
                    <Link href={`/examen?attempt=${a.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-medium text-surface hover:bg-brand-strong">
                      {a.meta.kind === "games" ? "Abrir juegos" : "Responder"} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Resultados */}
          <section aria-labelledby="resultados">
            <h2 id="resultados" className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Resultados de evaluaciones</h2>
            {data && done.length === 0 && <p className="mt-3 text-sm text-muted">Aún no hay resultados.</p>}
            <ul className="mt-3 space-y-3">
              {done.map((a) => (
                <li key={a.id} className="rounded-2xl bg-surface p-5 ring-1 ring-line">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{a.title}</p>
                      <p className="text-sm text-muted">
                        {a.meta.respondent === "especialista" ? "Aplicado por el especialista" : a.meta.kind === "games" ? `Jugado por ${name}` : "Respondido por ti"} · {formatDateLima(a.completed_at!)}
                      </p>
                    </div>
                    {a.meta.kind === "games" ? (
                      <p className="text-sm text-muted">Juegos completados</p>
                    ) : (
                      <p className="font-display text-2xl font-semibold tabular-nums">{displayScore(a.total_score, a.meta)}</p>
                    )}
                  </div>
                  {a.subcategory && <p className="mt-3 inline-block rounded-full bg-warn-soft px-3 py-1 text-sm font-medium text-warn">{a.subcategory}</p>}
                  {a.recommendations.length > 0 && (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink/80">
                      {a.recommendations.map((r) => <li key={r}>{r}</li>)}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            {done.length > 0 && (
              <p className="mt-3 text-xs text-muted">Son pruebas de tamizaje y observación: orientan al especialista, pero el diagnóstico lo da él en consulta.</p>
            )}
          </section>

          {/* Informes */}
          <section aria-labelledby="informes">
            <h2 id="informes" className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Informes del especialista</h2>
            {data && data.reports.length === 0 && <p className="mt-3 text-sm text-muted">Los informes aparecerán aquí cuando el especialista los firme.</p>}
            <ul className="mt-3 space-y-3">
              {data?.reports.map((r) => (
                <li key={r.id}>
                  <details className="group rounded-2xl bg-surface ring-1 ring-line open:ring-brand/40">
                    <summary className="flex cursor-pointer list-none items-center gap-4 p-5">
                      <FileSignature className="h-5 w-5 text-ok" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{r.session ?? "Informe"} · {formatDateLima(r.signed_at)}</span>
                        <span className="block text-sm text-muted">Firmado por {r.specialist}</span>
                      </span>
                      <span className="text-sm text-brand group-open:hidden">Leer</span>
                    </summary>
                    <div className="space-y-3 border-t border-line px-5 py-4 text-sm leading-relaxed">
                      {r.reason && <p><strong className="font-medium">Motivo:</strong> {r.reason}</p>}
                      {r.plan && <p><strong className="font-medium">Plan:</strong> {r.plan}</p>}
                      {r.codes.length > 0 && <p className="text-muted">Códigos CIE-10: {r.codes.join(", ")}</p>}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-8">
          {next ? (
            <div className="rounded-3xl bg-brand p-6 text-surface">
              <p className="text-xs uppercase tracking-[0.14em] text-surface/60">Próxima cita</p>
              <p className="mt-3 font-display text-2xl font-semibold first-letter:uppercase">
                {formatDateLima(next.start_time, { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <p className="mt-1 text-surface/80">
                {formatDateLima(next.start_time, { hour: "2-digit", minute: "2-digit" })} · {next.attention_type ?? "Consulta"}
              </p>
              <p className="mt-4 flex items-center gap-2 text-sm text-surface/80"><Stethoscope className="h-4 w-4" /> {next.specialist}</p>
            </div>
          ) : (
            data && (
              <Link href={`/marketplace?para=${active.id}`} className="block rounded-3xl border border-dashed border-brand/50 p-6 text-brand-strong hover:bg-brand-soft">
                <CalendarDays className="h-5 w-5" />
                <p className="mt-3 font-medium">Sin citas próximas</p>
                <p className="text-sm">Agenda con un especialista</p>
              </Link>
            )
          )}

          {/* Recorrido: cómo avanza el caso */}
          <section aria-labelledby="recorrido">
            <h2 id="recorrido" className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Recorrido de {name}</h2>
            {events.length > 0 && (
              <ol className="relative mt-4 space-y-5 border-l border-line pl-6">
                {events.map((e, i) => (
                  <li key={i} className="relative">
                    <span
                      className={`absolute -left-[1.95rem] top-1 h-3 w-3 rounded-full ring-4 ring-canvas ${
                        e.kind === "proxima" ? "bg-aji" : e.kind === "informe" ? "bg-ok" : e.kind === "evaluacion" ? "bg-brand" : "bg-ink/60"
                      }`}
                      aria-hidden="true"
                    />
                    <p className="text-xs text-muted">{formatDateLima(e.at, { day: "numeric", month: "short" })}{e.kind === "proxima" && " · próxima"}</p>
                    <p className="text-sm font-medium">{e.title}</p>
                    <p className="text-sm text-muted">{e.detail}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
