"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string };

export function Field({ label, hint, error, id, ...input }: Props) {
  const inputId = id ?? input.name;
  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={hint || error ? `${inputId}-hint` : undefined}
        className="h-12 w-full rounded-xl border border-line bg-surface px-4 text-[0.95rem] text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-brand aria-[invalid=true]:border-bad"
        {...input}
      />
      {(hint || error) && (
        <p id={`${inputId}-hint`} className={`mt-1.5 text-sm ${error ? "text-bad" : "text-muted"}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

/** Contraseña con mostrar/ocultar y aviso de Bloq Mayús (error común al iniciar sesión). */
export function PasswordField({ label, hint, id, ...input }: Omit<Props, "type">) {
  const [visible, setVisible] = useState(false);
  const [caps, setCaps] = useState(false);
  const inputId = id ?? input.name;
  const detectCaps = (e: React.KeyboardEvent<HTMLInputElement>) => setCaps(e.getModifierState?.("CapsLock") ?? false);

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          onKeyUp={detectCaps}
          onKeyDown={detectCaps}
          aria-describedby={`${inputId}-hint`}
          className="h-12 w-full rounded-xl border border-line bg-surface pl-4 pr-12 text-[0.95rem] text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-brand"
          {...input}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:text-ink"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <p id={`${inputId}-hint`} className={`mt-1.5 text-sm ${caps ? "text-warn" : "text-muted"}`} aria-live="polite">
        {caps ? "Bloq Mayús está activado" : hint}
      </p>
    </div>
  );
}

export function FormAlert({ tone = "bad", children }: { tone?: "bad" | "ok" | "info"; children: React.ReactNode }) {
  const styles = { bad: "bg-bad-soft text-bad", ok: "bg-ok-soft text-ok", info: "bg-brand-soft text-brand-strong" }[tone];
  return (
    <p role={tone === "bad" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm ${styles}`}>
      {children}
    </p>
  );
}
