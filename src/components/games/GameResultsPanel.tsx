"use client";

import { useEffect, useState } from "react";
import { Gamepad2 } from "lucide-react";
import { createClient } from "../../../utils/supabase/client";
import { CLINICAL_GAMES, FLAG_STYLE } from "./registry";
import { formatDateLima } from "../../lib/format";
import type { GameMetrics } from "./GameFrame";

interface Row { id: string; game_type: string; session_start: string; metrics: GameMetrics; attempt_id: string | null }

/** Resultados de juegos clínicos de un paciente, para el especialista. */
export function GameResultsPanel({ patientId }: { patientId: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    createClient()
      .from("interactive_sessions")
      .select("id, game_type, session_start, metrics, attempt_id")
      .eq("patient_id", patientId)
      .order("session_start", { ascending: false })
      .then(({ data }) => setRows((data as Row[]) ?? []));
  }, [patientId]);

  const games = CLINICAL_GAMES.map((g) => ({ g, sessions: (rows ?? []).filter((r) => r.game_type === g.id) })).filter((x) => x.sessions.length);

  return (
    <section className="rounded-2xl bg-surface ring-1 ring-line" aria-labelledby="juegos-clinicos">
      <header className="flex items-center gap-2 border-b border-line px-5 py-3">
        <Gamepad2 className="h-4 w-4 text-brand" aria-hidden="true" />
        <h2 id="juegos-clinicos" className="font-semibold">Pruebas interactivas</h2>
        <span className="ml-auto text-xs text-muted">Cortes orientativos, no normativos</span>
      </header>
      {rows === null ? (
        <div className="m-5 h-24 animate-pulse rounded-xl bg-band" />
      ) : games.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted">Aún no hay partidas. Asigna la “Batería digital de atención” o pide a la familia que juegue desde su portal.</p>
      ) : (
        <ul className="divide-y divide-line">
          {games.map(({ g, sessions }) => {
            const [last, prev] = sessions;
            const s = g.summarize(last.metrics);
            const p = prev ? g.summarize(prev.metrics) : null;
            return (
              <li key={g.id} className="px-5 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{g.instrument}</p>
                    <p className="text-sm text-muted">
                      {g.domain} · {formatDateLima(last.session_start, { day: "numeric", month: "short" })}
                      {last.attempt_id ? " · batería asignada" : " · práctica en casa"}
                      {sessions.length > 1 && ` · ${sessions.length} partidas`}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${FLAG_STYLE[s.flag].className}`}>{FLAG_STYLE[s.flag].label}</span>
                </div>
                <p className="mt-3 text-sm font-medium">{s.headline}</p>
                <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                  {s.details.map((d, i) => (
                    <div key={d.label}>
                      <dt className="text-xs text-muted">{d.label}</dt>
                      <dd className="tabular-nums">
                        {d.value}
                        {p && p.details[i] && p.details[i].value !== d.value && (
                          <span className="ml-1.5 text-xs text-muted">(antes {p.details[i].value})</span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
