"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { createClient } from "../../../../utils/supabase/client";
import { Field, FormAlert } from "../../../components/auth/Field";

export default function RecoverPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const email = String(new FormData(e.currentTarget).get("email")).trim().toLowerCase();
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/restablecer`,
    });
    setLoading(false);
    // Mismo mensaje exista o no la cuenta: no revelamos qué correos están registrados.
    if (error && error.status === 429) setError("Demasiadas solicitudes. Espera un minuto.");
    else setSent(true);
  };

  if (sent) {
    return (
      <div>
        <MailCheck className="h-10 w-10 text-brand" />
        <h1 className="mt-6 font-display text-[2.2rem] font-bold leading-none tracking-[-0.04em]">Revisa tu correo</h1>
        <p className="mt-4 leading-relaxed text-muted">
          Si hay una cuenta con ese correo, te llegará un enlace para crear una contraseña nueva. Ábrelo desde este navegador.
        </p>
        <Link href="/login" className="mt-8 inline-block text-sm font-medium text-brand">Volver a ingresar</Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display text-[2.4rem] font-bold leading-none tracking-[-0.04em]">Recupera tu acceso</h1>
      <p className="mt-3 text-muted">Te enviaremos un enlace para crear una contraseña nueva.</p>
      <form onSubmit={onSubmit} className="mt-10 space-y-5">
        {error && <FormAlert>{error}</FormAlert>}
        <Field label="Correo electrónico" name="email" type="email" autoComplete="username" required autoFocus />
        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand font-medium text-surface transition-colors hover:bg-brand-strong disabled:opacity-70"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Enviar enlace
        </button>
      </form>
      <Link href="/login" className="mt-10 inline-block text-sm text-muted hover:text-ink">Volver a ingresar</Link>
    </>
  );
}
