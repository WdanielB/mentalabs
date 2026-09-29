"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { createClient } from "../../../utils/supabase/client";
import { ROLE_ROUTES } from "../../lib/auth/role";
import { setRememberPreference } from "../../lib/auth/client";
import { Field, FormAlert, PasswordField } from "./Field";

// "role" viaja en user_metadata; el trigger private.set_signup_role lo valida
// y solo acepta estos tres (nunca admin). Los especialistas quedan "pending".
const ROLES = [
  { id: "tutor", label: "Soy madre, padre o tutor", hint: "Gestiono la atención de un hijo o familiar" },
  { id: "paciente", label: "Busco ayuda para mí", hint: "Soy mayor de edad" },
  { id: "especialista", label: "Soy especialista", hint: "Psicólogo, psiquiatra o terapeuta colegiado" },
] as const;
type RoleId = (typeof ROLES)[number]["id"];

function errorMessage(err: any) {
  const code = err?.code as string | undefined;
  if (code === "user_already_exists" || err?.message === "User already registered") return "Ese correo ya tiene una cuenta. ¿Quieres ingresar?";
  if (code === "weak_password") return "Esa contraseña es muy fácil de adivinar o apareció en filtraciones. Prueba otra.";
  if (code === "over_email_send_rate_limit" || err?.status === 429) return "Demasiados intentos. Espera unos minutos.";
  return err?.message ?? "No pudimos crear la cuenta.";
}

export function RegisterForm() {
  const params = useSearchParams();
  const initial = ROLES.some((r) => r.id === params.get("rol")) ? (params.get("rol") as RoleId) : "tutor";
  const [role, setRole] = useState<RoleId>(initial);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | undefined>();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    if (password.length < 8) {
      setPasswordError("Usa al menos 8 caracteres.");
      return;
    }
    setPasswordError(undefined);
    setLoading(true);
    setError(null);
    setRememberPreference(true);

    const email = String(form.get("email")).trim().toLowerCase();
    const fullName = `${form.get("nombre")} ${form.get("apellido")}`.replace(/\s+/g, " ").trim();

    const { data, error } = await createClient().auth.signUp({
      email,
      password,
      options: {
        data: { role, full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${ROLE_ROUTES[role]}`,
      },
    });

    if (error) {
      setError(errorMessage(error));
      setLoading(false);
      return;
    }
    // Con confirmación de correo activada no hay sesión todavía.
    if (data.session) window.location.replace(ROLE_ROUTES[role]);
    else {
      setSentTo(email);
      setLoading(false);
    }
  };

  if (sentTo) {
    return (
      <div>
        <MailCheck className="h-10 w-10 text-brand" />
        <h1 className="mt-6 font-display text-[2.2rem] font-bold leading-none tracking-[-0.04em]">Revisa tu correo</h1>
        <p className="mt-4 leading-relaxed text-muted">
          Enviamos un enlace de confirmación a <strong className="font-medium text-ink">{sentTo}</strong>. Ábrelo desde este
          mismo navegador para entrar directo a tu panel.
        </p>
        <p className="mt-8 text-sm text-muted">¿No llegó? Revisa spam o espera un par de minutos.</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display text-[2.4rem] font-bold leading-none tracking-[-0.04em]">Crea tu cuenta</h1>
      <p className="mt-3 text-muted">Gratis. Solo pagas las sesiones que agendes.</p>

      <form onSubmit={onSubmit} className="mt-10 space-y-5">
        {error && <FormAlert>{error}</FormAlert>}

        <fieldset>
          <legend className="mb-2 text-sm font-medium">¿Quién eres?</legend>
          <div className="space-y-2">
            {ROLES.map((r) => (
              <label
                key={r.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 transition-colors has-[:checked]:border-brand has-[:checked]:bg-brand-soft"
              >
                <input type="radio" name="role" value={r.id} checked={role === r.id} onChange={() => setRole(r.id)} className="accent-brand" />
                <span>
                  <span className="block text-sm font-medium">{r.label}</span>
                  <span className="block text-sm text-muted">{r.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" name="nombre" autoComplete="given-name" required />
          <Field label="Apellido" name="apellido" autoComplete="family-name" required />
        </div>
        <Field label="Correo electrónico" name="email" type="email" autoComplete="email" inputMode="email" required />
        <PasswordField
          label="Contraseña"
          name="password"
          autoComplete="new-password"
          minLength={8}
          required
          hint={passwordError ?? "Mínimo 8 caracteres. Una frase corta es más segura que una palabra rara."}
        />

        {role === "especialista" && (
          <FormAlert tone="info">Revisaremos tu colegiatura antes de mostrar tu perfil en el directorio.</FormAlert>
        )}

        <p className="text-sm text-muted">
          Al crear la cuenta aceptas los <Link href="#" className="text-brand underline-offset-4 hover:underline">Términos</Link> y la{" "}
          <Link href="#" className="text-brand underline-offset-4 hover:underline">Política de privacidad</Link>.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand font-medium text-surface transition-colors hover:bg-brand-strong disabled:opacity-70"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Crear cuenta
        </button>
      </form>

      <p className="mt-10 text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-brand underline-offset-4 hover:underline">
          Ingresa
        </Link>
      </p>
    </>
  );
}
