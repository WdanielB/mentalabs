"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "../../../utils/supabase/client";
import { ROLE_ROUTES, resolveUserRole } from "../../lib/auth/role";
import { safeNext, setRememberPreference } from "../../lib/auth/client";
import { Field, FormAlert, PasswordField } from "./Field";

const NOTICES: Record<string, { tone: "info" | "bad" | "ok"; text: string }> = {
  inactividad: { tone: "info", text: "Cerramos tu sesión tras 30 minutos sin actividad." },
  "sin-rol": { tone: "bad", text: "Tu cuenta no tiene un perfil asignado. Escríbenos para activarla." },
  "enlace-invalido": { tone: "bad", text: "El enlace expiró o ya se usó. Pide uno nuevo." },
  "clave-actualizada": { tone: "ok", text: "Contraseña actualizada. Ya puedes ingresar." },
};

function errorMessage(err: any): string {
  const code = err?.code as string | undefined;
  if (code === "invalid_credentials" || err?.message === "Invalid login credentials") return "Correo o contraseña incorrectos.";
  if (code === "email_not_confirmed") return "Confirma tu correo antes de ingresar. Revisa tu bandeja de entrada o spam.";
  if (code === "over_request_rate_limit" || err?.status === 429) return "Demasiados intentos. Espera un minuto y vuelve a probar.";
  if (err?.message?.includes("fetch")) return "No hay conexión con el servidor. Revisa tu internet.";
  return "No pudimos iniciar sesión. Intenta de nuevo.";
}

export function LoginForm() {
  const params = useSearchParams();
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const notice = NOTICES[params.get("motivo") ?? params.get("error") ?? ""];

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    setError(null);

    // La preferencia se guarda ANTES del login: así las cookies de sesión
    // se escriben directamente como persistentes o de navegador.
    setRememberPreference(remember);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")).trim().toLowerCase(),
      password: String(form.get("password")),
    });

    if (error || !data.session) {
      setError(errorMessage(error));
      setLoading(false);
      return;
    }

    const role = await resolveUserRole(supabase, data.user);
    if (!role) {
      await supabase.auth.signOut({ scope: "local" });
      setError(NOTICES["sin-rol"].text);
      setLoading(false);
      return;
    }

    // Navegación completa (no router.push): el proxy ve las cookies nuevas y
    // no se reutiliza ninguna página cacheada de cuando no había sesión.
    window.location.replace(safeNext(params.get("next")) ?? ROLE_ROUTES[role]);
  };

  return (
    <>
      <h1 className="font-display text-[2.4rem] font-bold leading-none tracking-[-0.04em]">Hola de nuevo</h1>
      <p className="mt-3 text-muted">Ingresa para ver tus citas, evaluaciones y pacientes.</p>

      <form onSubmit={onSubmit} className="mt-10 space-y-5" noValidate={false}>
        {notice && !error && <FormAlert tone={notice.tone}>{notice.text}</FormAlert>}
        {error && <FormAlert>{error}</FormAlert>}

        <Field label="Correo electrónico" name="email" type="email" autoComplete="username" inputMode="email" required autoFocus placeholder="nombre@correo.com" />

        <div>
          <PasswordField label="Contraseña" name="password" autoComplete="current-password" required />
          <div className="mt-1 flex justify-end">
            <Link href="/recuperar" className="text-sm text-brand underline-offset-4 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl p-1 text-sm">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-brand"
          />
          <span>
            <span className="font-medium text-ink">Mantener sesión iniciada</span>
            <span className="block text-muted">Desmárcalo en computadoras compartidas: la sesión se cierra con el navegador o tras 30 min sin uso.</span>
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand font-medium text-surface transition-colors hover:bg-brand-strong disabled:opacity-70"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Ingresar <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>

      <p className="mt-10 text-sm text-muted">
        ¿Primera vez aquí?{" "}
        <Link href="/registro" className="font-medium text-brand underline-offset-4 hover:underline">
          Crea tu cuenta
        </Link>
      </p>
    </>
  );
}
