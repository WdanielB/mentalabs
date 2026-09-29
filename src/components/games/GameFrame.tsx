"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Play, RotateCcw } from "lucide-react";

export type GameMetrics = Record<string, number | string>;

export interface ClinicalGameProps {
  onComplete: (metrics: GameMetrics) => void;
  /** Vista previa en el editor: no guarda y permite reiniciar. */
  preview?: boolean;
  config?: Record<string, unknown>;
}

/**
 * Cuenta regresiva con performance.now (no se desfasa con re-renders).
 * Cambiar resetKey reinicia el reloj (p. ej. cada fila o fase).
 */
export function useCountdown(seconds: number, running: boolean, onEnd: () => void, resetKey: unknown = 0) {
  const [left, setLeft] = useState(seconds);
  const endRef = useRef(onEnd);
  endRef.current = onEnd;

  useEffect(() => {
    if (!running) return;
    const start = performance.now();
    setLeft(seconds);
    let raf = 0;
    const tick = () => {
      const remaining = Math.max(0, seconds - (performance.now() - start) / 1000);
      setLeft(remaining);
      if (remaining <= 0) endRef.current();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seconds, running, resetKey]);

  return left;
}

export const mean = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);

/* ── Marco común ──────────────────────────────────────────────── */

interface FrameProps {
  title: string;
  phase?: string;
  /** 0..1 del tiempo restante; se muestra como barra. */
  timeFraction?: number;
  secondsLeft?: number;
  counter?: string;
  children: React.ReactNode;
}

export function GameFrame({ title, phase, timeFraction, secondsLeft, counter, children }: FrameProps) {
  const low = secondsLeft !== undefined && secondsLeft <= 5;
  return (
    <section className="overflow-hidden rounded-3xl bg-surface ring-1 ring-line" aria-label={title}>
      <header className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line px-5 py-3">
        <h2 className="font-display text-base font-semibold tracking-tight">{title}</h2>
        {phase && <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand-strong">{phase}</span>}
        <span className="ml-auto flex items-center gap-4 text-sm tabular-nums text-muted">
          {counter && <span>{counter}</span>}
          {secondsLeft !== undefined && (
            <span className={low ? "font-semibold text-bad" : ""} aria-live="off">
              {Math.ceil(secondsLeft)} s
            </span>
          )}
        </span>
      </header>
      {timeFraction !== undefined && (
        <div className="h-1 bg-band" aria-hidden="true">
          <div
            className={`h-full origin-left transition-colors ${low ? "bg-bad" : "bg-brand"}`}
            style={{ transform: `scaleX(${Math.max(0, Math.min(1, timeFraction))})` }}
          />
        </div>
      )}
      <div className="p-5 sm:p-8">{children}</div>
    </section>
  );
}

/* ── Pantalla de instrucciones ────────────────────────────────── */

interface IntroProps {
  title: string;
  domain: string;
  minutes: string;
  steps: string[];
  demo?: React.ReactNode;
  onPractice?: () => void;
  onStart: () => void;
}

export function GameIntro({ title, domain, minutes, steps, demo, onPractice, onStart }: IntroProps) {
  return (
    <section className="overflow-hidden rounded-3xl bg-surface ring-1 ring-line">
      <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">{domain} · {minutes}</p>
          <h2 className="mt-2 font-display text-[1.9rem] font-bold leading-tight tracking-[-0.03em]">{title}</h2>
          <ol className="mt-5 space-y-3">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3 leading-relaxed text-ink/85">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-surface">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <div className="mt-7 flex flex-wrap gap-3">
            {onPractice && (
              <button type="button" onClick={onPractice} className="rounded-full border border-line px-5 py-3 font-medium hover:border-ink/40">
                Practicar primero
              </button>
            )}
            <button
              type="button"
              onClick={onStart}
              autoFocus
              className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 font-medium text-surface transition-colors hover:bg-brand-strong"
            >
              <Play className="h-4 w-4" /> Empezar
            </button>
          </div>
        </div>
        {demo && <div className="flex items-center justify-center rounded-2xl bg-band p-6">{demo}</div>}
      </div>
    </section>
  );
}

/* ── Pausa entre fases ────────────────────────────────────────── */

export function PhaseBreak({ title, text, onContinue }: { title: string; text: string; onContinue: () => void }) {
  return (
    <div className="mx-auto max-w-md py-8 text-center">
      <p className="font-display text-2xl font-semibold tracking-tight">{title}</p>
      <p className="mt-3 leading-relaxed text-muted">{text}</p>
      <button type="button" onClick={onContinue} autoFocus className="mt-7 rounded-full bg-brand px-6 py-3 font-medium text-surface hover:bg-brand-strong">
        Continuar
      </button>
    </div>
  );
}

/* ── Cierre: amable para el niño; sin puntajes clínicos ───────── */

export function GameDone({ onRetry, preview }: { onRetry?: () => void; preview?: boolean }) {
  return (
    <section className="rounded-3xl bg-surface px-6 py-12 text-center ring-1 ring-line">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ok-soft text-ok">
        <Check className="h-7 w-7" />
      </span>
      <p className="mt-5 font-display text-2xl font-semibold tracking-tight">¡Terminaste! Muy buen trabajo.</p>
      <p className="mx-auto mt-2 max-w-sm text-muted">Tus resultados se guardaron para tu especialista.</p>
      {preview && onRetry && (
        <button type="button" onClick={onRetry} className="mt-6 inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm">
          <RotateCcw className="h-4 w-4" /> Volver a probar
        </button>
      )}
    </section>
  );
}

/** Estado estándar de un juego: intro → (práctica) → juego → fin. */
export function useGameStage() {
  const [stage, setStage] = useState<"intro" | "practice" | "play" | "break" | "done">("intro");
  const reset = useCallback(() => setStage("intro"), []);
  return { stage, setStage, reset };
}
