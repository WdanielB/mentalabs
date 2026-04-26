"use client";

import Link from "next/link";
import { useRef, useEffect } from "react";
import { ArrowRight, Brain, Check, ChevronRight, Users, ClipboardList, Zap, Shield, BarChart3 } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const heroRef      = useRef<HTMLDivElement>(null);
  const featuresRef  = useRef<HTMLDivElement>(null);
  const stepsRef     = useRef<HTMLDivElement>(null);
  const ctaRef       = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {

      /* ── Hero entrance ── */
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".hero-badge",      { y: 20, opacity: 0, duration: 0.5 })
        .from(".hero-headline",   { y: 50, opacity: 0, duration: 0.7 }, "-=0.2")
        .from(".hero-sub",        { y: 30, opacity: 0, duration: 0.6 }, "-=0.4")
        .from(".hero-ctas",       { y: 20, opacity: 0, duration: 0.5 }, "-=0.4")
        .from(".hero-visual",     { x: 60, opacity: 0, duration: 0.8, ease: "power2.out" }, "-=0.8")
        .from(".hero-metric-1",   { y: 20, opacity: 0, duration: 0.4 }, "-=0.3")
        .from(".hero-metric-2",   { y: 20, opacity: 0, duration: 0.4 }, "-=0.2");

      /* ── Steps scroll reveal ── */
      gsap.utils.toArray<HTMLElement>(".step-card").forEach((el, i) => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" },
          x: i % 2 === 0 ? -50 : 50,
          opacity: 0,
          duration: 0.7,
          ease: "power2.out",
          delay: i * 0.08,
        });
      });

      /* ── Features reveal ── */
      gsap.from(".feat-item", {
        scrollTrigger: { trigger: featuresRef.current, start: "top 75%", toggleActions: "play none none reverse" },
        y: 40,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: "power2.out",
      });

      /* ── Stats counter ── */
      gsap.from(".stat-number", {
        scrollTrigger: { trigger: ".stats-section", start: "top 80%" },
        textContent: 0,
        duration: 1.5,
        ease: "power2.out",
        snap: { textContent: 1 },
        stagger: 0.15,
      });

      /* ── CTA ── */
      gsap.from(ctaRef.current, {
        scrollTrigger: { trigger: ctaRef.current, start: "top 80%" },
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });

    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="bg-white dark:bg-[#0d1520] text-slate-900 dark:text-slate-100 overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="fixed top-0 z-50 w-full border-b border-slate-100/80 bg-white/90 backdrop-blur-xl dark:border-slate-800/80 dark:bg-[#0d1520]/90">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#136dec] text-white transition-transform group-hover:scale-105">
              <Brain className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-700 tracking-tight">
              Menta<span className="text-[#0bda5e]">Labs</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {[
              { label: "Soluciones",    href: "/soluciones" },
              { label: "Cómo Funciona", href: "/como-funciona" },
              { label: "Studio",        href: "/studio" },
              { label: "Especialistas", href: "/marketplace" },
            ].map(({ label, href }) => (
              <Link key={href} href={href}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-[#136dec] dark:hover:text-[#136dec] transition-colors">
              Iniciar sesión
            </Link>
            <Link href="/registro"
              className="rounded-xl bg-[#136dec] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#136dec]/25 hover:bg-blue-600 transition-all hover:scale-105 active:scale-95">
              Comenzar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative pt-32 pb-24 lg:pt-44 lg:pb-36 overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 -z-10"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, oklch(0.85 0.01 240) 1px, transparent 0)", backgroundSize: "40px 40px" }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-white/80 to-transparent dark:from-[#0d1520] dark:via-[#0d1520]/80 dark:to-transparent" />
        <div className="absolute -top-40 right-0 -z-10 h-[600px] w-[600px] rounded-full bg-[#136dec]/8 blur-3xl" />
        <div className="absolute -bottom-20 left-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-[#0bda5e]/6 blur-3xl" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-12 items-center">
            <div>
              <div className="hero-badge inline-flex items-center gap-2 rounded-full border border-[#136dec]/20 bg-[#136dec]/6 px-4 py-1.5 text-sm font-semibold text-[#136dec] mb-8">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0bda5e] animate-pulse" />
                Plataforma Clínica Inteligente
              </div>

              <h1 className="hero-headline font-display text-5xl lg:text-6xl xl:text-7xl font-800 leading-[1.05] tracking-tight text-slate-900 dark:text-white mb-6">
                Diagnósticos que<br />
                <span className="text-[#136dec]">cambian vidas.</span>
              </h1>

              <p className="hero-sub text-lg lg:text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-10 max-w-xl">
                La plataforma completa para psicólogos y familias. Conecta evaluaciones clínicas, análisis diagnósticos y terapias interactivas en un solo lugar.
              </p>

              <div className="hero-ctas flex flex-wrap items-center gap-4">
                <Link href="/registro"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#136dec] px-8 py-4 text-base font-bold text-white shadow-xl shadow-[#136dec]/30 hover:bg-blue-600 hover:-translate-y-0.5 transition-all">
                  Empezar ahora <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href="/marketplace"
                  className="inline-flex items-center gap-2 text-base font-semibold text-slate-700 dark:text-slate-300 hover:text-[#136dec] dark:hover:text-[#136dec] transition-colors group">
                  Buscar especialista
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              <div className="mt-10 flex items-center gap-6">
                {[
                  "Evaluaciones validadas clínicamente",
                  "Diagnóstico en minutos",
                  "Privacidad garantizada",
                ].map((t) => (
                  <div key={t} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Check className="h-3.5 w-3.5 text-[#0bda5e] shrink-0" />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Visual */}
            <div className="hero-visual relative">
              <div className="relative rounded-3xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-[#131f2e] p-5 shadow-2xl">
                <div className="rounded-2xl overflow-hidden bg-slate-50 dark:bg-[#0d1520] p-4">
                  {/* Mini dashboard mockup */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                    <div className="ml-2 text-xs text-slate-400 font-mono">Panel Diagnóstico</div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 w-2/3 rounded-full bg-gradient-to-r from-[#136dec] to-[#136dec]/40" />
                    <div className="h-2 w-1/2 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="mt-4 h-32 rounded-xl bg-gradient-to-br from-[#136dec]/10 to-[#0bda5e]/10 border border-[#136dec]/20 flex items-end p-3 gap-2">
                      {[40, 65, 50, 80, 60, 95, 75].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t-md bg-[#136dec]/60" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {["TDAH", "TEA", "Ansiedad"].map((label) => (
                        <div key={label} className="rounded-lg bg-slate-100 dark:bg-slate-800 p-2 text-center">
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating metrics */}
              <div className="hero-metric-1 absolute -left-8 top-1/3 rounded-2xl bg-white dark:bg-[#131f2e] border border-slate-200 dark:border-slate-700 shadow-xl px-4 py-3">
                <div className="text-2xl font-display font-800 text-[#0bda5e]">+40%</div>
                <div className="text-xs text-slate-500">diagnósticos más rápidos</div>
              </div>
              <div className="hero-metric-2 absolute -right-4 bottom-12 rounded-2xl bg-white dark:bg-[#131f2e] border border-slate-200 dark:border-slate-700 shadow-xl px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full bg-[#0bda5e] animate-pulse" />
                  <span className="text-xs text-slate-500">Especialistas activos</span>
                </div>
                <div className="text-2xl font-display font-800">1,200+</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="stats-section py-16 border-y border-slate-100 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { num: "1200", suffix: "+", label: "Especialistas registrados" },
              { num: "8500",  suffix: "+", label: "Evaluaciones completadas" },
              { num: "98",    suffix: "%",  label: "Precisión diagnóstica" },
              { num: "15",    suffix: "min", label: "Tiempo medio de evaluación" },
            ].map(({ num, suffix, label }) => (
              <div key={label} className="text-center">
                <div className="font-display text-4xl lg:text-5xl font-800 text-slate-900 dark:text-white">
                  <span className="stat-number">{num}</span>
                  <span className="text-[#136dec]">{suffix}</span>
                </div>
                <div className="mt-2 text-sm text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section ref={stepsRef} className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#136dec] mb-4">
              <span className="h-px w-8 bg-[#136dec]" />
              Proceso clínico
              <span className="h-px w-8 bg-[#136dec]" />
            </div>
            <h2 className="font-display text-4xl lg:text-5xl font-800 tracking-tight text-slate-900 dark:text-white">
              Cómo funciona MentaLabs
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                step: "01",
                title: "Registro y perfil clínico",
                desc: "El paciente o tutor completa su perfil. El especialista verifica historial y objetivos terapéuticos.",
                icon: Users,
                color: "text-[#136dec] bg-[#136dec]/8",
              },
              {
                step: "02",
                title: "Evaluación no-code",
                desc: "El especialista asigna baterías de pruebas personalizadas. El paciente las resuelve online a su ritmo.",
                icon: ClipboardList,
                color: "text-[#0bda5e] bg-[#0bda5e]/8",
              },
              {
                step: "03",
                title: "Diagnóstico y seguimiento",
                desc: "El sistema genera diagnósticos automáticos con recomendaciones. El tratamiento se monitoriza en tiempo real.",
                icon: BarChart3,
                color: "text-purple-600 bg-purple-50 dark:bg-purple-900/10",
              },
            ].map(({ step, title, desc, icon: Icon, color }) => (
              <div key={step} className="step-card group relative p-8 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131f2e] hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute top-6 right-6 font-display text-6xl font-800 text-slate-100 dark:text-slate-800 select-none">
                  {step}
                </div>
                <div className={`h-12 w-12 rounded-2xl ${color} flex items-center justify-center mb-6`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-700 text-slate-900 dark:text-white mb-3">{title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">{desc}</p>
                <Link href="/como-funciona" className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#136dec] opacity-0 group-hover:opacity-100 transition-opacity">
                  Saber más <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section ref={featuresRef} className="py-24 lg:py-32 bg-slate-50 dark:bg-[#0a1018]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl lg:text-5xl font-800 tracking-tight text-slate-900 dark:text-white mb-4">
              Tecnología al servicio de la clínica
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Herramientas diseñadas junto a psicólogos, psiquiatras y terapeutas ocupacionales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: ClipboardList,
                title: "Constructor no-code",
                desc: "Crea evaluaciones complejas sin programar. Likert, VAS, juegos cognitivos y texto libre con plantillas clínicas.",
                accent: "#136dec",
              },
              {
                icon: BarChart3,
                title: "Reglas diagnósticas",
                desc: "Define umbrales por score y edad. El sistema genera diagnósticos con recomendaciones automáticas al instante.",
                accent: "#0bda5e",
              },
              {
                icon: Zap,
                title: "Juegos terapéuticos",
                desc: "Memoria, atención sostenida, tiempo de reacción y clasificación cognitiva. Métricas capturadas automáticamente.",
                accent: "#a855f7",
              },
              {
                icon: Shield,
                title: "Seguridad clínica",
                desc: "RBAC con 4 roles. Row Level Security en Supabase. Tutores, especialistas, pacientes y admins con vistas separadas.",
                accent: "#ef4444",
              },
              {
                icon: Users,
                title: "Conectividad familiar",
                desc: "Los tutores tienen vista de solo lectura del progreso. Notificaciones en tiempo real al completar evaluaciones.",
                accent: "#f59e0b",
              },
              {
                icon: Brain,
                title: "Espectro completo",
                desc: "TDAH, TEA, Ansiedad, Depresión, Dislexia y más. Baterías especializadas para adultos, adolescentes y niños.",
                accent: "#06b6d4",
              },
            ].map(({ icon: Icon, title, desc, accent }) => (
              <div key={title} className="feat-item group p-6 rounded-2xl bg-white dark:bg-[#131f2e] border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
                <div className="mb-4 h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}15` }}>
                  <Icon className="h-5 w-5" style={{ color: accent }} />
                </div>
                <h3 className="font-display font-700 text-slate-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For who ── */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[
              {
                tag: "Para especialistas",
                title: "Gestión clínica completa",
                points: [
                  "Constructor no-code de evaluaciones",
                  "Agenda y videoconferencias integradas",
                  "Reportes con exportación PDF",
                  "Motor de reglas diagnósticas automáticas",
                ],
                cta: { label: "Ver demo", href: "/registro" },
                bg: "bg-[#136dec]",
                tagColor: "bg-white/15 text-white",
              },
              {
                tag: "Para familias",
                title: "Acompañamiento transparente",
                points: [
                  "Seguimiento del progreso en tiempo real",
                  "Acceso a diagnósticos y recomendaciones",
                  "Conexión directa con el especialista",
                  "Juegos terapéuticos guiados",
                ],
                cta: { label: "Buscar especialista", href: "/marketplace" },
                bg: "bg-slate-900 dark:bg-[#131f2e]",
                tagColor: "bg-white/10 text-slate-300",
              },
            ].map(({ tag, title, points, cta, bg, tagColor }) => (
              <div key={tag} className={`${bg} rounded-3xl p-8 lg:p-10 text-white`}>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-6 ${tagColor}`}>{tag}</span>
                <h3 className="font-display text-3xl font-800 mb-6">{title}</h3>
                <ul className="space-y-3 mb-8">
                  {points.map((p) => (
                    <li key={p} className="flex items-center gap-3 text-sm text-white/80">
                      <Check className="h-4 w-4 text-[#0bda5e] shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
                <Link href={cta.href}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-sm font-semibold transition-all">
                  {cta.label} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section ref={ctaRef} className="py-24 lg:py-32 bg-slate-50 dark:bg-[#0a1018]">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#0bda5e] mb-6">
            <span className="h-2 w-2 rounded-full bg-[#0bda5e] animate-pulse" />
            Disponible ahora
          </div>
          <h2 className="font-display text-4xl lg:text-5xl xl:text-6xl font-800 tracking-tight text-slate-900 dark:text-white mb-6">
            Comienza tu evaluación<br />
            <span className="text-[#136dec]">hoy mismo.</span>
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
            Crea tu cuenta en menos de 2 minutos. Sin tarjeta de crédito.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/registro"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#136dec] px-8 py-4 text-base font-bold text-white shadow-2xl shadow-[#136dec]/30 hover:bg-blue-600 hover:-translate-y-0.5 transition-all">
              Registrarse gratis <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/marketplace"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-slate-700 dark:text-slate-300 hover:text-[#136dec] dark:hover:text-[#136dec] transition-colors group">
              Explorar especialistas
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <SiteFooter />
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1520]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#136dec] text-white">
                <Brain className="h-5 w-5" />
              </div>
              <span className="font-display text-lg font-700">Menta<span className="text-[#0bda5e]">Labs</span></span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
              Plataforma clínica para diagnóstico y tratamiento de neurodivergencias. Conectamos familias con especialistas.
            </p>
          </div>

          {/* Links */}
          {[
            {
              title: "Plataforma",
              links: [
                { label: "Soluciones",    href: "/soluciones" },
                { label: "Cómo Funciona", href: "/como-funciona" },
                { label: "Studio",        href: "/studio" },
                { label: "Marketplace",   href: "/marketplace" },
              ],
            },
            {
              title: "Cuenta",
              links: [
                { label: "Iniciar sesión", href: "/login" },
                { label: "Registrarse",   href: "/registro" },
              ],
            },
            {
              title: "Diagnósticos",
              links: [
                { label: "TDAH",      href: "/soluciones" },
                { label: "TEA",       href: "/soluciones" },
                { label: "Ansiedad",  href: "/soluciones" },
                { label: "Depresión", href: "/soluciones" },
              ],
            },
          ].map(({ title, links }) => (
            <div key={title}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">{title}</h3>
              <ul className="space-y-3">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-slate-500 dark:text-slate-400 hover:text-[#136dec] dark:hover:text-[#136dec] transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} MentaLabs. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            {["Privacidad", "Términos", "Cookies"].map((t) => (
              <Link key={t} href="#" className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">{t}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
