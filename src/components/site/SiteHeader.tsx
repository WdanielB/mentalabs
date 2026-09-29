"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { createClient } from "../../../utils/supabase/client";
import { ROLE_ROUTES, normalizeRole } from "../../lib/auth/role";
import { Logo } from "./Logo";

const NAV = [
  { label: "Especialistas", href: "/marketplace" },
  { label: "Cómo funciona", href: "/#como-funciona" },
  { label: "Para profesionales", href: "/#profesionales" },
  { label: "Preguntas", href: "/#preguntas" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [panelHref, setPanelHref] = useState<string | null>(null);
  const lastY = useRef(0);
  const menuButton = useRef<HTMLButtonElement>(null);

  // Sesión solo para la UI (mostrar "Mi panel"); el acceso lo decide el proxy.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      const role = normalizeRole(data.session?.user.app_metadata?.role);
      setPanelHref(role ? ROLE_ROUTES[role] : null);
    });
  }, []);

  // Fondo al hacer scroll; se esconde al bajar y reaparece al subir.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      if (Math.abs(y - lastY.current) > 6) {
        setHidden(y > lastY.current && y > 120);
        lastY.current = y;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) => !href.includes("#") && (pathname === href || pathname.startsWith(href + "/"));

  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-surface"
      >
        Saltar al contenido
      </a>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[transform,background-color,box-shadow] duration-500 ease-out-expo ${
          hidden && !open ? "-translate-y-full" : "translate-y-0"
        } ${scrolled || open ? "bg-canvas/95 shadow-[0_1px_0_var(--color-line)] backdrop-blur-md" : "bg-transparent"}`}
      >
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-6 px-4 sm:px-6 lg:h-[72px] lg:px-10">
          <Logo />

          <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
            {NAV.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className="relative rounded-full px-3.5 py-2 text-[0.9rem] text-ink/75 transition-colors hover:text-ink aria-[current=page]:text-ink aria-[current=page]:font-medium"
              >
                {label}
                {isActive(href) && <span className="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-brand" />}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {panelHref ? (
              <Link
                href={panelHref}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-medium text-surface transition-colors hover:bg-brand-deep"
              >
                Mi panel <ArrowUpRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden rounded-full px-3.5 py-2 text-sm text-ink/80 transition-colors hover:text-ink sm:inline-flex">
                  Ingresar
                </Link>
                <Link
                  href="/registro"
                  className="inline-flex items-center rounded-full bg-brand px-4 py-2 text-sm font-medium text-surface transition-colors hover:bg-brand-strong"
                >
                  Crear cuenta
                </Link>
              </>
            )}
            <button
              ref={menuButton}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="menu-movil"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-band md:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div id="menu-movil" className="collapse-rows md:hidden" data-open={open}>
          <div>
            <nav aria-label="Principal móvil" className="flex h-[calc(100dvh-4rem)] flex-col px-4 pb-8 pt-4 sm:px-6">
              {NAV.map(({ label, href }, i) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="border-b border-line py-4 font-display text-3xl font-semibold tracking-tight text-ink"
                  style={{ transitionDelay: `${i * 40}ms` }}
                >
                  {label}
                </Link>
              ))}
              {!panelHref && (
                <Link href="/login" onClick={() => setOpen(false)} className="mt-auto py-3 text-lg text-muted">
                  Ya tengo cuenta · Ingresar
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
