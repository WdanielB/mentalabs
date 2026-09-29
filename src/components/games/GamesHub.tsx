"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Clock, Play } from "lucide-react";
import { createClient } from "../../../utils/supabase/client";
import { CLINICAL_GAMES, gameById } from "./registry";
import { formatDateLima } from "../../lib/format";
import type { GameMetrics } from "./GameFrame";
import { FaceSvg } from "./CarasGame";

// Pequeñas ilustraciones de cada juego (solo decorativas).
const ART: Record<string, React.ReactNode> = {
  stroop: <span className="font-display text-3xl font-bold" style={{ color: "#2563eb" }}>ROJO</span>,
  d2r: <span className="font-mono text-3xl font-semibold tracking-[0.3em]">d p d</span>,
  caras_r: (
    <span className="flex">
      <FaceSvg face={{ hair: "left", eyes: "left", mouth: "smile" }} size={56} />
      <FaceSvg face={{ hair: "left", eyes: "left", mouth: "smile" }} size={56} />
      <FaceSvg face={{ hair: "left", eyes: "right", mouth: "smile" }} size={56} />
    </span>
  ),
  tower_london: (
    <span className="flex items-end gap-2" aria-hidden="true">
      <span className="h-6 w-6 rounded-full bg-[#dc2626]" /><span className="h-6 w-6 rounded-full bg-[#16a34a]" /><span className="h-6 w-6 rounded-full bg-[#2563eb]" />
    </span>
  ),
};

interface Session { id: string; game_type: string; session_start: string }

/**
 * Centro de juegos para un paciente. Lo usa el propio paciente o su tutor
 * (patientId del hijo activo): las métricas se guardan a nombre del paciente.
 */
export function GamesHub({ patientId, patientName }: { patientId: string; patientName?: string }) {
  const [playing, setPlaying] = useState<string | null>(null);
  const [history, setHistory] = useState<Session[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    const { data } = await createClient()
      .from("interactive_sessions")
      .select("id, game_type, session_start")
      .eq("patient_id", patientId)
      .order("session_start", { ascending: false })
      .limit(8);
    setHistory((data as Session[]) ?? []);
  }, [patientId]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const startedAt = useRef(new Date());

  const save = async (gameType: string, metrics: GameMetrics) => {
    setSaveError(null);
    const { error } = await createClient().from("interactive_sessions").insert({
      patient_id: patientId,
      game_type: gameType,
      metrics,
      session_start: startedAt.current.toISOString(),
      session_end: new Date().toISOString(),
    });
    if (error) setSaveError("No se pudo guardar el resultado. Revisa tu conexión.");
    loadHistory();
  };

  if (playing) {
    const g = gameById(playing)!;
    return (
      <div>
        <button type="button" onClick={() => setPlaying(null)} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Todos los juegos
        </button>
        {saveError && <p role="alert" className="mb-4 rounded-xl bg-bad-soft px-4 py-3 text-sm text-bad">{saveError}</p>}
        <g.Component onComplete={(m) => save(g.id, m)} />
      </div>
    );
  }

  return (
    <div>
      {patientName && (
        <p className="mb-6 rounded-2xl bg-aji/40 px-4 py-3 text-sm">
          Los resultados se guardan en el perfil de <strong className="font-semibold">{patientName}</strong>. Deja que juegue solo; tú solo acompaña.
        </p>
      )}
      <ul className="grid gap-4 sm:grid-cols-2">
        {CLINICAL_GAMES.map((g) => (
          <li key={g.id}>
            <button
              type="button"
              onClick={() => { startedAt.current = new Date(); setPlaying(g.id); window.scrollTo({ top: 0 }); }}
              className="group flex h-full w-full flex-col rounded-3xl bg-surface p-6 text-left ring-1 ring-line transition-shadow hover:shadow-[0_20px_40px_-28px_oklch(0.27_0.09_290/0.5)]"
            >
              <span className="flex h-24 items-center justify-center rounded-2xl bg-band text-ink">{ART[g.id]}</span>
              <span className="mt-5 font-display text-xl font-semibold tracking-tight">{g.childTitle}</span>
              <span className="mt-1 text-sm text-muted">{g.domain} · {g.ages}</span>
              <span className="mt-4 flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1.5 text-muted"><Clock className="h-4 w-4" /> {g.minutes}</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-brand">
                  Jugar <Play className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {history.length > 0 && (
        <section className="mt-10" aria-labelledby="historial-juegos">
          <h2 id="historial-juegos" className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Últimas partidas</h2>
          <ul className="mt-3 divide-y divide-line rounded-2xl bg-surface ring-1 ring-line">
            {history.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span>{gameById(s.game_type)?.childTitle ?? s.game_type}</span>
                <span className="text-muted">{formatDateLima(s.session_start, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">Los resultados detallados los revisa tu especialista.</p>
        </section>
      )}
    </div>
  );
}
