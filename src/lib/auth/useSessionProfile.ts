"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../utils/supabase/client";
import { isSessionRemembered, signOutAndRedirect } from "./client";

export interface SessionProfile {
  id: string;
  full_name: string;
  email: string;
}

const IDLE_LIMIT_MS = 30 * 60 * 1000;
const ACTIVITY_KEY = "ml_last_activity";
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "scroll", "visibilitychange"] as const;

/**
 * Datos del usuario para los layouts de cada panel.
 * El acceso por rol ya lo resuelve src/proxy.ts en el servidor; aquí solo:
 *  - cargamos el perfil para mostrar nombre/email,
 *  - sincronizamos el cierre de sesión entre pestañas,
 *  - cerramos por inactividad (30 min) si el usuario no marcó "Mantener sesión".
 */
export function useSessionProfile(fallbackName: string) {
  const [profile, setProfile] = useState<SessionProfile | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && mounted) window.location.replace("/login");
    });

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted || !user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle();
      if (!mounted) return;
      setProfile({
        id: user.id,
        full_name: data?.full_name || (user.user_metadata?.full_name as string | undefined) || fallbackName,
        email: data?.email || user.email || "",
      });
    })();

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [fallbackName]);

  useEffect(() => {
    if (isSessionRemembered()) return;

    const touch = () => {
      try { localStorage.setItem(ACTIVITY_KEY, String(Date.now())); } catch {}
    };
    touch();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, touch, { passive: true }));

    // Compartido entre pestañas vía localStorage: la actividad en una mantiene viva la otra.
    const timer = window.setInterval(() => {
      let last = Date.now();
      try { last = Number(localStorage.getItem(ACTIVITY_KEY)) || last; } catch {}
      if (Date.now() - last > IDLE_LIMIT_MS) signOutAndRedirect("/login?motivo=inactividad");
    }, 30_000);

    return () => {
      window.clearInterval(timer);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, touch));
    };
  }, []);

  return profile;
}
