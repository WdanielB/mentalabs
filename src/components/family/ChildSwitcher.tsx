"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useFamily } from "../../lib/family/FamilyContext";
import { ageLabel, firstName } from "../../lib/format";

/** Muestra y cambia el hijo que se está gestionando. Va arriba del menú del tutor. */
export function ChildSwitcher() {
  const { children, active, setActive, loading } = useFamily();
  const [open, setOpen] = useState(false);
  const listId = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (loading) return <div className="mx-3 mb-5 h-[60px] animate-pulse rounded-2xl bg-band" aria-hidden="true" />;

  if (!active) {
    return (
      <Link href="/tutor/familia" className="mx-3 mb-5 flex items-center gap-3 rounded-2xl border border-dashed border-brand/50 px-3 py-3 text-sm text-brand-strong hover:bg-brand-soft">
        <Plus className="h-4 w-4" /> Registra a tu hijo o hija
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative mx-3 mb-5">
      <p className="px-1 pb-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">Estás gestionando a</p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className="flex w-full items-center gap-3 rounded-2xl bg-aji/40 px-3 py-2.5 text-left ring-1 ring-aji transition-colors hover:bg-aji/60"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink font-display text-sm font-bold text-surface">
          {firstName(active.full_name).charAt(0)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{firstName(active.full_name)}</span>
          <span className="block truncate text-xs text-ink/70">{ageLabel(active.birth_date)}</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-ink/60" aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-10 mt-1.5 overflow-hidden rounded-2xl bg-surface shadow-lg ring-1 ring-line">
          <ul id={listId} role="listbox" aria-label="Hijos" className="max-h-64 overflow-y-auto py-1">
            {children.map((c) => (
              <li key={c.id} role="option" aria-selected={c.id === active.id}>
                <button
                  type="button"
                  onClick={() => { setActive(c.id); setOpen(false); }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-band"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{c.full_name}</span>
                    <span className="block text-xs text-muted">{ageLabel(c.birth_date)}</span>
                  </span>
                  {c.id === active.id && <Check className="h-4 w-4 text-brand" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
          <Link
            href="/tutor/familia"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 border-t border-line px-3 py-2.5 text-sm text-brand-strong hover:bg-brand-soft"
          >
            <Plus className="h-4 w-4" /> Añadir hijo o hija
          </Link>
        </div>
      )}
    </div>
  );
}
