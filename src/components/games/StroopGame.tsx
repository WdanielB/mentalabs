"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameDone, GameFrame, GameIntro, PhaseBreak, mean, useCountdown, type ClinicalGameProps } from "./GameFrame";

// Stroop (Golden, 1978), adaptado de DTEP. Tres fases cronometradas:
// P: leer palabras · C: nombrar colores · PC: nombrar el color de la tinta
// ignorando la palabra. Interferencia = PC − (P×C)/(P+C).

const COLORS = [
  { id: "rojo", name: "ROJO", hex: "#dc2626" },
  { id: "verde", name: "VERDE", hex: "#16a34a" },
  { id: "azul", name: "AZUL", hex: "#2563eb" },
  { id: "amarillo", name: "AMARILLO", hex: "#ca8a04" },
] as const;
type ColorId = (typeof COLORS)[number]["id"];

const PHASES = [
  { key: "P", label: "Fase 1 de 3 · Palabras", hint: "Toca el botón de la PALABRA que lees." },
  { key: "C", label: "Fase 2 de 3 · Colores", hint: "Toca el botón del COLOR que ves." },
  { key: "PC", label: "Fase 3 de 3 · El reto", hint: "Toca el COLOR DE LA TINTA. No leas la palabra." },
] as const;

type Stim = { text: string; ink: string; answer: ColorId };
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)];

function makeStim(phase: number): Stim {
  const word = pick(COLORS);
  if (phase === 0) return { text: word.name, ink: "var(--color-ink)", answer: word.id };
  if (phase === 1) {
    const c = pick(COLORS);
    return { text: "XXXX", ink: c.hex, answer: c.id };
  }
  const ink = pick(COLORS.filter((c) => c.id !== word.id)); // siempre incongruente
  return { text: word.name, ink: ink.hex, answer: ink.id };
}

type PhaseStats = { hits: number; errors: number; rts: number[] };
const empty = (): PhaseStats => ({ hits: 0, errors: 0, rts: [] });

export default function StroopGame({ onComplete, preview, config }: ClinicalGameProps) {
  const phaseSeconds = Number(config?.phase_seconds ?? 45);
  const [stage, setStage] = useState<"intro" | "practice" | "play" | "break" | "done">("intro");
  const [phase, setPhase] = useState(0);
  const [stim, setStim] = useState<Stim>(() => makeStim(0));
  const [flash, setFlash] = useState<"ok" | "bad" | null>(null);
  const [practiceLeft, setPracticeLeft] = useState(6);
  const stats = useRef<PhaseStats[]>([empty(), empty(), empty()]);
  const shownAt = useRef(0);

  const next = useCallback((p: number) => {
    setStim(makeStim(p));
    shownAt.current = performance.now();
  }, []);

  const finishPhase = useCallback(() => {
    if (stage !== "play") return;
    if (phase < 2) setStage("break");
    else {
      const [P, C, PC] = stats.current;
      const expected = P.hits + C.hits > 0 ? (P.hits * C.hits) / (P.hits + C.hits) : 0;
      onComplete({
        P: P.hits, C: C.hits, PC: PC.hits,
        errores_P: P.errors, errores_C: C.errors, errores_PC: PC.errors,
        tr_P_ms: mean(P.rts), tr_C_ms: mean(C.rts), tr_PC_ms: mean(PC.rts),
        interferencia: Math.round((PC.hits - expected) * 10) / 10,
        segundos_por_fase: phaseSeconds,
      });
      setStage("done");
    }
  }, [stage, phase, onComplete, phaseSeconds]);

  const left = useCountdown(phaseSeconds, stage === "play", finishPhase, phase);

  const answer = useCallback(
    (id: ColorId) => {
      if (stage !== "play" && stage !== "practice") return;
      const ok = id === stim.answer;
      setFlash(ok ? "ok" : "bad");
      setTimeout(() => setFlash(null), 140);
      if (stage === "practice") {
        if (practiceLeft <= 1) { setStage("intro"); return; }
        setPracticeLeft((n) => n - 1);
        next(2);
        return;
      }
      const s = stats.current[phase];
      if (ok) { s.hits++; s.rts.push(Math.round(performance.now() - shownAt.current)); }
      else s.errors++;
      next(phase);
    },
    [stage, stim, phase, practiceLeft, next]
  );

  // Teclado: 1-4 para quien usa computadora.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const i = Number(e.key) - 1;
      if (i >= 0 && i < COLORS.length) answer(COLORS[i].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer]);

  if (stage === "intro") {
    return (
      <GameIntro
        title="Colores y palabras"
        domain="Control inhibitorio"
        minutes="3 min"
        steps={[
          "Verás palabras de colores. En cada fase la regla cambia un poco.",
          "Responde tocando el botón correcto, lo más rápido que puedas sin equivocarte.",
          "En la última fase la palabra intenta engañarte: fíjate solo en el color de la tinta.",
        ]}
        demo={<p className="font-display text-5xl font-bold tracking-tight" style={{ color: COLORS[2].hex }}>ROJO</p>}
        onPractice={() => { setPracticeLeft(6); next(2); setStage("practice"); }}
        onStart={() => { stats.current = [empty(), empty(), empty()]; setPhase(0); next(0); setStage("play"); }}
      />
    );
  }

  if (stage === "done") return <GameDone preview={preview} onRetry={() => setStage("intro")} />;

  const current = stage === "practice" ? { label: "Práctica", hint: PHASES[2].hint } : PHASES[phase];

  return (
    <GameFrame
      title="Colores y palabras"
      phase={current.label}
      secondsLeft={stage === "play" ? left : undefined}
      timeFraction={stage === "play" ? left / phaseSeconds : undefined}
      counter={stage === "practice" ? `${practiceLeft} de práctica` : undefined}
    >
      {stage === "break" ? (
        <PhaseBreak
          title={`¡Bien! Ahora: ${PHASES[phase + 1].label.split("· ")[1]}`}
          text={PHASES[phase + 1].hint}
          onContinue={() => { const p = phase + 1; setPhase(p); next(p); setStage("play"); }}
        />
      ) : (
        <div className="flex flex-col items-center">
          <p className="text-center text-muted">{current.hint}</p>
          <div
            className={`my-8 flex h-36 w-full max-w-md items-center justify-center rounded-3xl bg-band transition-shadow duration-150 sm:h-44 ${
              flash === "ok" ? "shadow-[inset_0_0_0_3px_var(--color-ok)]" : flash === "bad" ? "shadow-[inset_0_0_0_3px_var(--color-bad)]" : ""
            }`}
            aria-live="polite"
          >
            <span className="select-none font-display text-5xl font-bold tracking-tight sm:text-6xl" style={{ color: stim.ink }}>
              {stim.text}
            </span>
          </div>
          <div className="grid w-full max-w-md grid-cols-2 gap-3">
            {COLORS.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={() => answer(c.id)}
                className="flex h-16 items-center justify-center gap-3 rounded-2xl border-2 border-line bg-surface text-lg font-semibold transition-transform active:scale-95 hover:border-ink/30"
              >
                <span className="h-5 w-5 rounded-full" style={{ background: c.hex }} aria-hidden="true" />
                {c.name}
                <kbd className="hidden text-xs font-normal text-muted sm:inline">{i + 1}</kbd>
              </button>
            ))}
          </div>
        </div>
      )}
    </GameFrame>
  );
}
