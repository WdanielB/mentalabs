"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useFamily } from "../../../../lib/family/FamilyContext";
import { AddChildForm } from "../../../../components/family/AddChildForm";
import { ageLabel } from "../../../../lib/format";

export default function FamiliaPage() {
  const { children, active, setActive, loading } = useFamily();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8 lg:py-12">
      <h1 className="font-display text-[2rem] font-bold tracking-[-0.03em]">Perfiles de la familia</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Tus hijos menores de 18 años no necesitan cuenta ni correo propio. Los gestionas desde aquí: citas, cuestionarios y resultados.
      </p>

      <section aria-labelledby="hijos" className="mt-10">
        <h2 id="hijos" className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Hijos registrados</h2>
        {loading ? (
          <div className="mt-4 h-20 animate-pulse rounded-2xl bg-band" />
        ) : children.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-band px-5 py-4 text-sm text-muted">Aún no registraste a ningún hijo o hija.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-2xl bg-surface ring-1 ring-line">
            {children.map((c) => {
              const isActive = c.id === active?.id;
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink font-display font-bold text-surface">
                    {c.full_name.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{c.full_name}</p>
                    <p className="text-sm text-muted">{ageLabel(c.birth_date)}</p>
                  </div>
                  {isActive ? (
                    <span className="rounded-full bg-aji/50 px-3 py-1 text-xs font-medium">Perfil activo</span>
                  ) : (
                    <button type="button" onClick={() => setActive(c.id)} className="rounded-full border border-line px-4 py-1.5 text-sm hover:border-ink/40">
                      Gestionar
                    </button>
                  )}
                  <Link
                    href="/tutor"
                    onClick={() => setActive(c.id)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-brand"
                  >
                    Ver resumen <ArrowRight className="h-4 w-4" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="nuevo" className="mt-12 rounded-3xl bg-surface p-6 ring-1 ring-line sm:p-8">
        <h2 id="nuevo" className="font-display text-xl font-semibold tracking-tight">Añadir hijo o hija</h2>
        <p className="mt-1 text-sm text-muted">Quedará vinculado a tu cuenta como su madre, padre o tutor.</p>
        <div className="mt-6">
          <AddChildForm />
        </div>
      </section>

      <p className="mt-8 flex items-start gap-3 text-sm leading-relaxed text-muted">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-ok" aria-hidden="true" />
        Solo tú y los especialistas que atiendan a tu hijo pueden ver su información. Los informes clínicos te aparecen cuando el
        especialista los firma.
      </p>
    </div>
  );
}
