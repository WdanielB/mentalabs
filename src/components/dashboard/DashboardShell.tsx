"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogOut, Menu, X, type LucideIcon } from "lucide-react";
import { LogoMark } from "../site/Logo";
import { useSessionProfile } from "../../lib/auth/useSessionProfile";
import { signOutAndRedirect } from "../../lib/auth/client";

export interface NavSection {
  label: string;
  items: { icon: LucideIcon; label: string; href: string }[];
}

interface Props {
  portal: string;
  homeHref: string;
  fallbackName: string;
  sections: NavSection[];
  /** Bloque sobre el menú, p. ej. el selector de hijo activo del tutor. */
  sidebarTop?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardShell({ portal, homeHref, fallbackName, sections, sidebarTop, children }: Props) {
  const pathname = usePathname();
  const profile = useSessionProfile(fallbackName);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  // Drawer móvil: Escape cierra, foco dentro, sin scroll de fondo.
  useEffect(() => {
    if (!open) return;
    drawer.current?.querySelector<HTMLElement>("a, button")?.focus();
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

  const logout = async () => {
    setSigningOut(true);
    await signOutAndRedirect();
  };

  const isActive = (href: string) => (href === homeHref ? pathname === href : pathname === href || pathname.startsWith(href + "/"));

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href={homeHref} className="flex items-center gap-3 px-5 pb-6 pt-5">
        <LogoMark className="h-8 w-8" />
        <span className="leading-tight">
          <span className="block font-display text-[1.05rem] font-bold tracking-[-0.02em]">MentaLabs</span>
          <span className="block text-xs text-muted">{portal}</span>
        </span>
      </Link>

      {sidebarTop}

      <nav aria-label={portal} className="flex-1 overflow-y-auto px-3">
        {sections.map((section) => (
          <div key={section.label} className="mb-6">
            <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">{section.label}</p>
            <ul className="space-y-0.5">
              {section.items.map(({ icon: Icon, label, href }) => {
                const active = isActive(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.92rem] transition-colors ${
                        active ? "bg-brand-soft font-medium text-brand-strong" : "text-ink/80 hover:bg-band hover:text-ink"
                      }`}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink font-display text-sm font-bold text-surface">
            {profile ? profile.full_name.charAt(0).toUpperCase() : ""}
          </div>
          <div className="min-w-0 flex-1">
            {profile ? (
              <>
                <p className="truncate text-sm font-medium">{profile.full_name}</p>
                <p className="truncate text-xs text-muted">{profile.email}</p>
              </>
            ) : (
              <div className="space-y-1.5" aria-hidden="true">
                <div className="h-3 w-24 animate-pulse rounded bg-band" />
                <div className="h-2.5 w-32 animate-pulse rounded bg-band" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={logout}
            disabled={signingOut}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-bad-soft hover:text-bad disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <a
        href="#panel"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-surface"
      >
        Saltar al contenido
      </a>

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-line bg-surface lg:block">{sidebar}</aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-surface/95 px-4 backdrop-blur-md lg:hidden">
        <Link href={homeHref} className="flex items-center gap-2">
          <LogoMark className="h-7 w-7" />
          <span className="font-display font-bold tracking-[-0.02em]">MentaLabs</span>
        </Link>
        <button
          ref={menuButton}
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="panel-drawer"
          aria-label="Abrir menú"
          className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-band"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      <div
        className={`fixed inset-0 z-30 bg-ink/40 transition-opacity duration-300 lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside
        id="panel-drawer"
        ref={drawer}
        aria-label="Menú"
        aria-hidden={!open}
        inert={!open}
        className={`fixed inset-y-0 left-0 z-40 w-[18rem] max-w-[85vw] bg-surface shadow-xl transition-transform duration-300 ease-out-expo lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar menú"
          className="absolute right-3 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-band"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebar}
      </aside>

      <main id="panel" className="min-h-dvh lg:pl-64">
        {children}
      </main>
    </div>
  );
}
