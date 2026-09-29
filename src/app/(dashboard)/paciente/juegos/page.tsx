"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../../../utils/supabase/client";
import { GamesHub } from "../../../../components/games/GamesHub";

export default function PacienteJuegosPage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 lg:py-12">
      <h1 className="font-display text-[2rem] font-bold tracking-[-0.03em]">Juegos de atención</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Pruebas cortas en forma de juego. Tu especialista usa los resultados para entender cómo funcionan tu atención y tu planificación.
      </p>
      <div className="mt-8">{userId ? <GamesHub patientId={userId} /> : <div className="h-64 animate-pulse rounded-3xl bg-band" />}</div>
    </div>
  );
}
