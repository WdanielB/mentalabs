"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useFamily } from "../../lib/family/FamilyContext";
import { Field, FormAlert } from "../auth/Field";

const today = () => new Date().toISOString().slice(0, 10);
const eighteenYearsAgo = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

export function AddChildForm({ onDone }: { onDone?: () => void }) {
  const { addChild } = useFamily();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    setLoading(true);
    setError(null);
    try {
      const child = await addChild(
        `${form.get("nombres")} ${form.get("apellidos")}`.replace(/\s+/g, " ").trim(),
        String(form.get("nacimiento")),
        String(form.get("dni") ?? "")
      );
      setAdded(child.full_name);
      formEl.reset();
      onDone?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {added && <FormAlert tone="ok">Listo: {added} ya aparece en tu familia y es el perfil activo.</FormAlert>}
      {error && <FormAlert>{error}</FormAlert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombres" name="nombres" required autoComplete="off" />
        <Field label="Apellidos" name="apellidos" required autoComplete="off" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Fecha de nacimiento" name="nacimiento" type="date" required min={eighteenYearsAgo()} max={today()} hint="Menor de 18 años." />
        <Field label="DNI (opcional)" name="dni" inputMode="numeric" pattern="[0-9]{8}" maxLength={8} hint="8 dígitos, para los informes." />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-brand-strong disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Añadir a mi familia
      </button>
    </form>
  );
}
