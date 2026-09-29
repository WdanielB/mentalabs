"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "../../../utils/supabase/client";

export interface Child {
  id: string;
  full_name: string;
  birth_date: string | null;
}

interface FamilyState {
  children: Child[];
  active: Child | null;
  loading: boolean;
  setActive: (id: string) => void;
  addChild: (fullName: string, birthDate: string, dni?: string) => Promise<Child>;
  reload: () => Promise<void>;
}

const ACTIVE_KEY = "ml_active_child";
const FamilyContext = createContext<FamilyState | null>(null);

/**
 * Una sola cuenta de tutor administra a sus hijos menores. Este contexto guarda
 * qué hijo se está gestionando ("perfil activo"), compartido por el menú lateral
 * y las páginas del portal. Los permisos reales viven en RLS (is_guardian_of).
 */
export function FamilyProvider({ children: content }: { children: React.ReactNode }) {
  const [kids, setKids] = useState<Child[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("tutor_patient_links")
      .select("patient_id, created_at, profiles:patient_id(full_name, birth_date)")
      .eq("tutor_id", user.id)
      .order("created_at");
    const list: Child[] = (data ?? []).map((l: any) => ({
      id: l.patient_id,
      full_name: l.profiles?.full_name ?? "Sin nombre",
      birth_date: l.profiles?.birth_date ?? null,
    }));
    setKids(list);
    setActiveId((cur) => {
      let stored: string | null = null;
      try { stored = localStorage.getItem(ACTIVE_KEY); } catch {}
      const pick = [cur, stored].find((id) => id && list.some((c) => c.id === id)) ?? list[0]?.id ?? null;
      return pick;
    });
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const setActive = useCallback((id: string) => {
    setActiveId(id);
    try { localStorage.setItem(ACTIVE_KEY, id); } catch {}
  }, []);

  const addChild = useCallback(async (fullName: string, birthDate: string, dni?: string) => {
    const { data, error } = await createClient().rpc("create_dependent", {
      p_full_name: fullName,
      p_birth_date: birthDate,
      p_dni: dni || null,
    });
    if (error) throw new Error(error.message);
    const child = { id: data as string, full_name: fullName.trim(), birth_date: birthDate };
    setKids((k) => [...k, child]);
    setActive(child.id);
    return child;
  }, [setActive]);

  const value = useMemo<FamilyState>(
    () => ({ children: kids, active: kids.find((c) => c.id === activeId) ?? null, loading, setActive, addChild, reload }),
    [kids, activeId, loading, setActive, addChild, reload]
  );

  return <FamilyContext.Provider value={value}>{content}</FamilyContext.Provider>;
}

export function useFamily() {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error("useFamily debe usarse dentro de FamilyProvider");
  return ctx;
}
