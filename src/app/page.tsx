import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarDays, MapPin, Star, Video } from "lucide-react";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { LandingMotion } from "../components/site/LandingMotion";
import { Faq } from "../components/site/Faq";
import { Monogram } from "../components/site/Monogram";
import { getPublicSpecialists } from "../lib/specialists";
import { formatPEN } from "../lib/format";

// El listado de especialistas cambia poco: se regenera cada 10 minutos.
export const revalidate = 600;

const CONDITIONS = ["TDAH", "Autismo (TEA)", "Ansiedad", "Depresión", "Dislexia", "Duelo", "Estrés laboral", "Conducta", "Lenguaje", "Pareja"];

const STEPS = [
  {
    title: "Encuentra a alguien que entienda tu caso",
    body: "Filtra por lo que te preocupa, la edad de quien necesita ayuda y si prefieres sesiones online o presenciales. Todos los perfiles muestran su número de colegiatura.",
  },
  {
    title: "Agenda sin llamadas ni esperas",
    body: "Eliges un horario libre y queda reservado. El especialista recibe tu solicitud en su agenda y la confirma.",
  },
  {
    title: "Evaluaciones desde casa",
    body: "Tu especialista te asigna cuestionarios y juegos cognitivos que completas a tu ritmo. Los resultados le llegan ordenados antes de la sesión.",
  },
  {
    title: "Seguimiento que se ve",
    body: "Diario de ánimo, resultados y citas en un mismo lugar. Si eres padre o madre, ves el avance de tu hijo sin depender de un informe en papel.",
  },
];

const PRO_FEATURES = [
  ["Agenda y horarios", "Define tu disponibilidad; las reservas del marketplace entran directo a tu calendario."],
  ["Historia clínica firmada", "Registros por sesión con códigos de intervención y diagnóstico. Una vez firmados, no se editan."],
  ["Banco de pruebas sin código", "Arma cuestionarios Likert, escalas visuales o texto libre y define reglas de puntaje por edad."],
  ["Juegos cognitivos con métricas", "Memoria, atención sostenida y tiempo de reacción, medidos automáticamente en cada partida."],
  ["Reportes en PDF", "Exporta resultados y evolución para el colegio, otro profesional o la familia."],
  ["Vista para tutores", "Los padres ven el progreso de su hijo sin acceder a tus notas clínicas."],
];

const PRIVACY = [
  ["Cada rol ve solo lo suyo", "Las reglas de acceso viven en la base de datos, no solo en la pantalla: un paciente no puede leer datos de otro aunque lo intente."],
  ["Tus notas no son públicas", "El perfil del especialista en el marketplace no expone correos ni teléfonos, y las historias clínicas nunca salen del panel."],
  ["Sesión bajo tu control", "En una computadora compartida, desmarca “Mantener sesión” y se cerrará al cerrar el navegador o tras 30 minutos sin uso."],
];

const FAQ = [
  {
    q: "¿MentaLabs da diagnósticos automáticos?",
    a: "No. Las evaluaciones ayudan al especialista a reunir información y detectar patrones, pero el diagnóstico siempre lo hace un profesional colegiado después de conocerte.",
  },
  {
    q: "¿Cómo sé que el especialista está habilitado?",
    a: "Cada perfil muestra su número de colegiatura (CPsP para psicólogos, CMP para médicos, CTMP para tecnólogos). Puedes verificarlo en el portal del colegio profesional correspondiente.",
  },
  {
    q: "¿Cuánto cuesta?",
    a: "Crear una cuenta es gratis. Cada especialista define su tarifa por sesión y la ves antes de agendar, sin cargos escondidos.",
  },
  {
    q: "¿Sirve para niños?",
    a: "Sí. Un padre, madre o tutor crea la cuenta, agenda las citas y sigue el progreso. Muchos especialistas atienden exclusivamente niños y adolescentes; puedes filtrarlos por edad.",
  },
  {
    q: "¿Qué hago si es una emergencia?",
    a: "MentaLabs no es un servicio de emergencias. Si tú o alguien cercano está en riesgo, llama a la Línea 113, opción 5, o acude a la emergencia más cercana.",
  },
];

export default async function LandingPage() {
  const specialists = await getPublicSpecialists({ limit: 4 });
  const headline = "Entender cómo piensa tu hijo no debería tomar un año.";

  return (
    <>
      <SiteHeader />
      <LandingMotion />

      <main id="contenido">
        {/* ── Hero ── */}
        <section className="hero relative overflow-hidden pb-20 pt-28 sm:pt-32 lg:pb-28 lg:pt-40">
          <div className="mx-auto grid max-w-[1240px] items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 lg:px-10">
            <div className="hero-copy min-w-0">
              <p className="reveal mb-6 inline-flex items-center gap-2 text-sm text-muted">
                <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                Psicólogos y terapeutas colegiados en todo el Perú
              </p>
              <h1 className="font-display text-[clamp(2.6rem,6.4vw,5.4rem)] font-bold leading-[0.98] tracking-[-0.045em] text-ink">
                {/* Un espacio real entre palabras: sin él no hay punto de corte y el titular desborda. */}
                {headline.split(" ").map((w, i) => (
                  <span key={i}>
                    <span className="reveal-word">{w === "año." ? <span className="text-brand">{w}</span> : w}</span>{" "}
                  </span>
                ))}
              </h1>
              <p className="reveal mt-7 max-w-[34rem] text-lg leading-relaxed text-ink/75">
                MentaLabs conecta a familias con especialistas en TDAH, autismo, ansiedad y más. Agenda, evalúa desde casa y sigue el
                avance en un solo lugar.
              </p>
              <div className="reveal mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/marketplace"
                  className="group inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 font-medium text-surface transition-colors hover:bg-brand-strong"
                >
                  Buscar especialista
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out-quart group-hover:translate-x-1" />
                </Link>
                <Link
                  href="#profesionales"
                  className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-6 py-3.5 font-medium text-ink transition-colors hover:border-ink/40"
                >
                  Soy especialista
                </Link>
              </div>
            </div>

            {/* Composición: lo que ve una familia dentro de la app */}
            <div className="hero-stack relative mx-auto h-[420px] w-full max-w-[440px] sm:h-[460px]" aria-hidden="true">
              <div className="hero-card absolute left-0 top-0 w-[88%] -rotate-2 rounded-3xl bg-surface p-6 shadow-[0_30px_60px_-30px_oklch(0.27_0.09_290/0.35)] ring-1 ring-line">
                <p className="text-xs uppercase tracking-[0.14em] text-muted">Próxima sesión</p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand font-display text-lg font-bold text-surface">LR</div>
                  <div>
                    <p className="font-display text-lg font-semibold leading-tight">Dra. Lucía Ramos</p>
                    <p className="text-sm text-muted">Psicóloga clínica infantil</p>
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-4 text-sm text-ink/80">
                  <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-brand" /> Jueves 10:00</span>
                  <span className="inline-flex items-center gap-1.5"><Video className="h-4 w-4 text-brand" /> Online</span>
                </div>
              </div>

              <div className="hero-card absolute right-0 top-[38%] w-[80%] rotate-[1.5deg] rounded-3xl bg-ink p-6 text-surface shadow-[0_30px_60px_-25px_oklch(0.24_0.025_285/0.5)]">
                <p className="text-xs uppercase tracking-[0.14em] text-surface/55">Evaluación en curso</p>
                <p className="mt-2 font-display text-lg font-semibold">Atención y concentración</p>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface/15">
                  <div className="hero-progress h-full w-[30%] origin-left rounded-full bg-aji" />
                </div>
                <p className="mt-2 text-sm text-surface/60">12 de 40 preguntas · se guarda solo</p>
              </div>

              <div className="hero-card absolute bottom-0 left-[6%] w-[64%] -rotate-1 rounded-3xl bg-aji p-5 text-ink">
                <p className="text-xs uppercase tracking-[0.14em] text-ink/60">Ánimo esta semana</p>
                <div className="mt-3 flex items-end gap-2">
                  {[3, 4, 2, 4, 5, 4, 5].map((v, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                      <div className="hero-mood w-full origin-bottom rounded-md bg-ink/85" style={{ height: `${v * 9}px` }} />
                      <span className="text-[10px] text-ink/60">{"LMMJVSD"[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Franja de temas ── */}
        <section aria-label="Temas que atendemos" className="overflow-hidden bg-brand py-6 text-surface">
          <div className="animate-marquee flex w-max gap-10 whitespace-nowrap font-display text-[clamp(1.6rem,3.2vw,2.6rem)] font-semibold tracking-tight">
            {[...CONDITIONS, ...CONDITIONS].map((c, i) => (
              <span key={i} className="flex items-center gap-10" aria-hidden={i >= CONDITIONS.length}>
                {c}
                <span className="h-2.5 w-2.5 rounded-full bg-aji" aria-hidden="true" />
              </span>
            ))}
          </div>
        </section>

        {/* ── Cómo funciona ── */}
        <section id="como-funciona" className="scroll-mt-20 py-24 lg:py-36">
          <div className="mx-auto grid max-w-[1240px] gap-14 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-10">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <p className="reveal text-sm uppercase tracking-[0.14em] text-brand">Cómo funciona</p>
              <h2 className="reveal mt-4 font-display text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[1.02] tracking-[-0.035em]">
                De la primera duda al seguimiento, sin perder el hilo.
              </h2>
              <p className="reveal mt-6 max-w-md leading-relaxed text-muted">
                La mayoría de familias pasa meses entre derivaciones, informes sueltos y listas de espera. Aquí todo queda en un mismo
                historial.
              </p>
            </div>

            <ol className="steps-list relative space-y-14 pl-14 sm:pl-20">
              <span className="absolute bottom-3 left-[1.1rem] top-3 w-px bg-line sm:left-[1.6rem]" aria-hidden="true" />
              <span className="steps-line absolute bottom-3 left-[1.1rem] top-3 w-px origin-top bg-brand sm:left-[1.6rem]" aria-hidden="true" />
              {STEPS.map((s, i) => (
                <li key={s.title} className="reveal relative">
                  <span className="absolute -left-14 top-0 flex h-9 w-9 items-center justify-center rounded-full bg-canvas font-display text-sm font-bold text-brand ring-1 ring-brand sm:-left-20 sm:h-[3.25rem] sm:w-[3.25rem] sm:text-base">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.7rem]">{s.title}</h3>
                  <p className="mt-3 max-w-[56ch] leading-relaxed text-muted">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Especialistas reales del directorio ── */}
        {specialists.length > 0 && (
          <section className="bg-band py-24 lg:py-32">
            <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-10">
              <div className="flex flex-wrap items-end justify-between gap-6">
                <h2 className="reveal max-w-2xl font-display text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[1.02] tracking-[-0.035em]">
                  Especialistas con nombre, colegiatura y tarifa a la vista.
                </h2>
                <Link href="/marketplace" className="reveal group inline-flex items-center gap-1.5 font-medium text-brand">
                  Ver el directorio completo
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 ease-out-quart group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </div>

              <ul className="-mx-4 mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
                {specialists.map((s) => (
                  <li key={s.id} className="reveal w-[78%] shrink-0 snap-start sm:w-auto">
                    <Link
                      href={`/marketplace?especialista=${s.id}`}
                      className="group flex h-full flex-col rounded-3xl bg-surface p-6 ring-1 ring-line transition-shadow duration-300 hover:shadow-[0_24px_50px_-30px_oklch(0.27_0.09_290/0.45)]"
                    >
                      <Monogram id={s.id} name={s.full_name} />
                      <p className="mt-5 font-display text-lg font-semibold leading-tight tracking-tight">{s.full_name}</p>
                      <p className="mt-1 text-sm text-muted">{s.title ?? s.specialty}</p>
                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink/75">
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-aji text-aji" /> {s.rating.toFixed(1)}
                          <span className="text-muted">({s.review_count})</span>
                        </span>
                        {s.city && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-muted" /> {s.city}
                          </span>
                        )}
                      </div>
                      <p className="mt-auto pt-6 text-sm text-muted">
                        <span className="font-display text-xl font-semibold text-ink">{formatPEN(s.hourly_rate)}</span> por sesión
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ── Profesionales ── */}
        <section id="profesionales" className="scroll-mt-16 bg-brand-deep py-24 text-surface lg:py-36">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-10">
            <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-end">
              <div>
                <p className="reveal text-sm uppercase tracking-[0.14em] text-aji">Para psicólogos y terapeutas</p>
                <h2 className="reveal mt-4 font-display text-[clamp(2.2rem,4.6vw,4rem)] font-bold leading-[1] tracking-[-0.04em]">
                  Tu consulta entera, en vez de cinco herramientas sueltas.
                </h2>
              </div>
              <p className="reveal max-w-md leading-relaxed text-surface/70 lg:justify-self-end">
                Agenda, historia clínica, pruebas y reportes conectados. Menos tiempo pasando datos de una hoja a otra, más tiempo con tus
                pacientes.
              </p>
            </div>

            <dl className="mt-16 grid gap-px overflow-hidden rounded-3xl bg-surface/10 sm:grid-cols-2 lg:grid-cols-3">
              {PRO_FEATURES.map(([title, body], i) => (
                <div key={title} className="reveal bg-brand-deep p-7 lg:p-8">
                  <dt className="flex items-baseline gap-3 font-display text-xl font-semibold tracking-tight">
                    <span className="text-sm font-medium text-aji">{String(i + 1).padStart(2, "0")}</span>
                    {title}
                  </dt>
                  <dd className="mt-3 leading-relaxed text-surface/65">{body}</dd>
                </div>
              ))}
            </dl>

            <Link
              href="/registro?rol=especialista"
              className="reveal mt-12 inline-flex items-center gap-2 rounded-full bg-aji px-6 py-3.5 font-medium text-ink transition-colors hover:bg-surface"
            >
              Unirme como especialista <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* ── Privacidad ── */}
        <section className="py-24 lg:py-32">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-10">
            <h2 className="reveal max-w-3xl font-display text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[1.02] tracking-[-0.035em]">
              Hablar de salud mental requiere confianza. Así cuidamos tus datos.
            </h2>
            <div className="mt-14 grid gap-10 md:grid-cols-3">
              {PRIVACY.map(([title, body]) => (
                <div key={title} className="reveal border-t-2 border-ink pt-6">
                  <h3 className="font-display text-xl font-semibold tracking-tight">{title}</h3>
                  <p className="mt-3 leading-relaxed text-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Preguntas ── */}
        <section id="preguntas" className="scroll-mt-20 bg-surface py-24 lg:py-32">
          <div className="mx-auto grid max-w-[1240px] gap-12 px-4 sm:px-6 lg:grid-cols-[0.7fr_1.3fr] lg:px-10">
            <h2 className="reveal font-display text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[1.02] tracking-[-0.035em]">
              Preguntas que nos hacen seguido
            </h2>
            <div className="reveal">
              <Faq items={FAQ} />
            </div>
          </div>
        </section>

        {/* ── Cierre ── */}
        <section className="py-24 lg:py-32">
          <div className="mx-auto grid max-w-[1240px] gap-4 px-4 sm:px-6 md:grid-cols-2 lg:px-10">
            <Link href="/marketplace" className="reveal group rounded-3xl bg-brand p-8 text-surface sm:p-10 lg:p-14">
              <p className="text-sm uppercase tracking-[0.14em] text-surface/60">Busco ayuda</p>
              <p className="mt-4 font-display text-[clamp(1.8rem,3.4vw,2.8rem)] font-bold leading-[1.05] tracking-[-0.03em]">
                Encuentra a tu especialista hoy
              </p>
              <ArrowRight className="mt-10 h-7 w-7 transition-transform duration-300 ease-out-quart group-hover:translate-x-2" />
            </Link>
            <Link href="/registro?rol=especialista" className="reveal group rounded-3xl bg-ink p-8 text-surface sm:p-10 lg:p-14">
              <p className="text-sm uppercase tracking-[0.14em] text-surface/60">Soy especialista</p>
              <p className="mt-4 font-display text-[clamp(1.8rem,3.4vw,2.8rem)] font-bold leading-[1.05] tracking-[-0.03em]">
                Lleva tu consulta a MentaLabs
              </p>
              <ArrowRight className="mt-10 h-7 w-7 text-aji transition-transform duration-300 ease-out-quart group-hover:translate-x-2" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
