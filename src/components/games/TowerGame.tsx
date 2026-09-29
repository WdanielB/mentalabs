"use client";

import { useCallback, useRef, useState } from "react";
import { GameDone, GameFrame, GameIntro, PhaseBreak, mean, useCountdown, type ClinicalGameProps } from "./GameFrame";
import { TOWER_CAPACITY, TOWER_LEVELS, type Ball, type Pegs } from "./clinicalData";

// Torre de Londres (Shallice, 1982), 8 niveles de DTEP. Mide planificación:
// tiempo hasta el primer movimiento, movimientos por encima del mínimo y
// resolución en el mínimo exacto.

const BALL: Record<Ball, string> = { R: "#dc2626", G: "#16a34a", B: "#2563eb" };
const BALL_NAME: Record<Ball, string> = { R: "roja", G: "verde", B: "azul" };
const clone = (p: Pegs): Pegs => [[...p[0]], [...p[1]], [...p[2]]];
const same = (a: Pegs, b: Pegs) => a.every((peg, i) => peg.join() === b[i].join());

function Board({ pegs, size = "lg", selected, onPeg, shake }: { pegs: Pegs; size?: "lg" | "sm"; selected?: number | null; onPeg?: (i: number) => void; shake?: number | null }) {
  const ball = size === "lg" ? 52 : 22;
  const rodW = size === "lg" ? 10 : 5;
  return (
    <div className="flex items-end justify-center gap-3 sm:gap-6">
      {pegs.map((peg, i) => {
        const cap = TOWER_CAPACITY[i];
        const Tag = onPeg ? "button" : "div";
        return (
          <Tag
            key={i}
            {...(onPeg ? { type: "button" as const, onClick: () => onPeg(i), "aria-label": `Poste ${i + 1}, ${peg.length ? `arriba bola ${BALL_NAME[peg[peg.length - 1]]}` : "vacío"}` } : {})}
            className={`relative flex flex-col-reverse items-center rounded-2xl px-2 pb-2 ${onPeg ? "transition-colors hover:bg-band" : ""} ${shake === i ? "animate-[shake_0.3s]" : ""}`}
            style={{ height: cap * (ball + 4) + (size === "lg" ? 40 : 16), width: ball + (size === "lg" ? 28 : 12) }}
          >
            <span className="absolute bottom-2 rounded-full bg-ink/80" style={{ width: rodW, height: cap * (ball + 4) + (size === "lg" ? 20 : 8) }} aria-hidden="true" />
            <span className="absolute -bottom-0 h-1.5 w-full rounded-full bg-ink/80" aria-hidden="true" />
            {peg.map((b, j) => {
              const lifted = selected === i && j === peg.length - 1;
              return (
                <span
                  key={j}
                  className="relative z-10 rounded-full shadow-[inset_-4px_-6px_0_rgb(0_0_0/0.15)] transition-transform duration-200"
                  style={{ width: ball, height: ball, background: BALL[b], marginTop: 4, transform: lifted ? `translateY(-${size === "lg" ? 22 : 8}px)` : undefined }}
                />
              );
            })}
          </Tag>
        );
      })}
    </div>
  );
}

type LevelResult = { solved: boolean; moves: number; minMoves: number; planningMs: number };

export default function TowerGame({ onComplete, preview, config }: ClinicalGameProps) {
  const levelCount = Math.min(TOWER_LEVELS.length, Number(config?.levels ?? TOWER_LEVELS.length));
  const levelSeconds = Number(config?.level_seconds ?? 90);
  const [stage, setStage] = useState<"intro" | "play" | "break" | "done">("intro");
  const [level, setLevel] = useState(0);
  const [pegs, setPegs] = useState<Pegs>(() => clone(TOWER_LEVELS[0].initial));
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [shake, setShake] = useState<number | null>(null);
  const results = useRef<LevelResult[]>([]);
  const violations = useRef(0);
  const levelStart = useRef(0);
  const firstMoveAt = useRef<number | null>(null);
  const lastSolved = useRef(true);

  const endLevel = useCallback(
    (solved: boolean, finalMoves: number) => {
      const lv = TOWER_LEVELS[level];
      results.current.push({
        solved,
        moves: finalMoves,
        minMoves: lv.minMoves,
        planningMs: Math.round((firstMoveAt.current ?? performance.now()) - levelStart.current),
      });
      lastSolved.current = solved;
      if (level + 1 < levelCount) { setStage("break"); return; }
      const r = results.current;
      const solvedR = r.filter((x) => x.solved);
      onComplete({
        niveles: levelCount,
        resueltos: solvedR.length,
        resueltos_en_minimo: solvedR.filter((x) => x.moves === x.minMoves).length,
        movimientos_totales: r.reduce((a, x) => a + x.moves, 0),
        movimientos_extra: solvedR.reduce((a, x) => a + (x.moves - x.minMoves), 0),
        planificacion_media_ms: mean(r.map((x) => x.planningMs)),
        violaciones_regla: violations.current,
      });
      setStage("done");
    },
    [level, levelCount, onComplete]
  );

  const left = useCountdown(levelSeconds, stage === "play", () => endLevel(false, moves), level);

  const startLevel = (i: number) => {
    setLevel(i);
    setPegs(clone(TOWER_LEVELS[i].initial));
    setMoves(0);
    setSelected(null);
    levelStart.current = performance.now();
    firstMoveAt.current = null;
    setStage("play");
  };

  const onPeg = (i: number) => {
    if (selected === null) {
      if (pegs[i].length) setSelected(i);
      return;
    }
    if (i === selected) { setSelected(null); return; }
    if (pegs[i].length >= TOWER_CAPACITY[i]) {
      violations.current++;
      setShake(i);
      setTimeout(() => setShake(null), 300);
      return;
    }
    const next = clone(pegs);
    next[i].push(next[selected].pop()!);
    if (firstMoveAt.current === null) firstMoveAt.current = performance.now();
    const m = moves + 1;
    setPegs(next);
    setMoves(m);
    setSelected(null);
    if (same(next, TOWER_LEVELS[level].target)) setTimeout(() => endLevel(true, m), 350);
  };

  if (stage === "intro") {
    return (
      <GameIntro
        title="La torre"
        domain="Planificación"
        minutes="5 a 8 min"
        steps={[
          "Mueve las bolas para que tu torre quede igual al modelo de la derecha.",
          "Toca un poste para levantar la bola de arriba y luego toca otro poste para dejarla.",
          "Cada poste tiene su tamaño: caben 3, 2 y 1 bola. Piensa antes de mover: cuantos menos movimientos, mejor.",
        ]}
        demo={<Board pegs={TOWER_LEVELS[0].target} size="sm" />}
        onStart={() => { results.current = []; violations.current = 0; startLevel(0); }}
      />
    );
  }
  if (stage === "done") return <GameDone preview={preview} onRetry={() => setStage("intro")} />;

  const lv = TOWER_LEVELS[level];
  return (
    <GameFrame
      title="La torre"
      phase={`Nivel ${level + 1} de ${levelCount}`}
      secondsLeft={stage === "play" ? left : undefined}
      timeFraction={stage === "play" ? left / levelSeconds : undefined}
      counter={stage === "play" ? `${moves} movimientos` : undefined}
    >
      {stage === "break" ? (
        <PhaseBreak
          title={lastSolved.current ? "¡Lo lograste!" : "Se acabó el tiempo de este nivel"}
          text={`Sigue el nivel ${level + 2}. Recuerda mirar el modelo antes de empezar.`}
          onContinue={() => startLevel(level + 1)}
        />
      ) : (
        <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <p className="mb-6 text-center text-muted">
              {selected === null ? "Toca un poste para levantar una bola." : "Ahora toca el poste donde quieres dejarla."}
            </p>
            <Board pegs={pegs} selected={selected} onPeg={onPeg} shake={shake} />
          </div>
          <div className="rounded-2xl bg-band p-4 text-center">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted">Modelo</p>
            <Board pegs={lv.target} size="sm" />
            <p className="mt-3 text-sm text-muted">Se puede en {lv.minMoves} movimientos</p>
          </div>
        </div>
      )}
    </GameFrame>
  );
}
