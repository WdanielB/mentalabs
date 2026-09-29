"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "../../../../utils/supabase/client";
import { FormAlert, PasswordField } from "../../../components/auth/Field";

// Se llega aquí con sesión de recuperación (ver /auth/confirm); el proxy exige sesión.
export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    if (password.length < 8) return setError("Usa al menos 8 caracteres.");
    if (password !== form.get("confirm")) return setError("Las contraseñas no coinciden.");

    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      setError(error.code === "same_password" ? "Debe ser distinta a la anterior." : error.message);
      return;
    }
    // Cierra las demás sesiones abiertas (p. ej. si alguien más tenía acceso).
    await supabase.auth.signOut({ scope: "global" });
    window.location.replace("/login?motivo=clave-actualizada");
  };

  return (
    <>
      <h1 className="font-display text-[2.4rem] font-bold leading-none tracking-[-0.04em]">Nueva contraseña</h1>
      <p className="mt-3 text-muted">Al guardarla cerraremos tu sesión en todos los dispositivos.</p>
      <form onSubmit={onSubmit} className="mt-10 space-y-5">
        {error && <FormAlert>{error}</FormAlert>}
        <PasswordField label="Contraseña nueva" name="password" autoComplete="new-password" minLength={8} required autoFocus />
        <PasswordField label="Repítela" name="confirm" autoComplete="new-password" minLength={8} required />
        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand font-medium text-surface transition-colors hover:bg-brand-strong disabled:opacity-70"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Guardar contraseña
        </button>
      </form>
    </>
  );
}
