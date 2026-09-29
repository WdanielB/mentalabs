"use client";

import { createClient } from "../../../utils/supabase/client";
import { REMEMBER_COOKIE, REMEMBER_MAX_AGE } from "../../../utils/supabase/session";

/** Guarda la preferencia antes de iniciar sesión para que las cookies nazcan con la duración correcta. */
export function setRememberPreference(remember: boolean) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = remember
    ? `${REMEMBER_COOKIE}=1; Path=/; Max-Age=${REMEMBER_MAX_AGE}; SameSite=Lax${secure}`
    : `${REMEMBER_COOKIE}=0; Path=/; SameSite=Lax${secure}`;
}

export function isSessionRemembered() {
  return !document.cookie.split("; ").includes(`${REMEMBER_COOKIE}=0`);
}

/** Solo rutas internas: evita redirecciones abiertas con ?next=https://otro-sitio. */
export function safeNext(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  return next;
}

/**
 * Cierra sesión y navega con recarga completa. router.push reutilizaría la
 * caché del router (staleTimes) y podría mostrar páginas de la sesión anterior.
 */
export async function signOutAndRedirect(to = "/login") {
  await createClient().auth.signOut({ scope: "local" });
  window.location.replace(to);
}
