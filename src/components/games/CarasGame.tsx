"use client";

import { useCallback, useRef, useState } from "react";
import { GameDone, GameFrame, GameIntro, mean, useCountdown, type ClinicalGameProps } from "./GameFrame";
import { CARAS_PRACTICE, CARAS_TRIPLETS, type Face, type Triplet } from "./clinicalData";

// CARAS-R (Thurstone y Yela), 60 tríos de DTEP. En cada trío una cara es
// distinta. 3 minutos. Medidas: A (aciertos), E (errores), A−E (eficacia),
// ICI = (A−E)/(A+E)×100 (control de la impulsividad).

export function FaceSvg({ face, size = 96 }: { face: Face; size?: number }) {
  const pupilX = face.eyes === "left" ? -3 : face.eyes === "right" ? 3 : 0;
  const hair =
    face.hair === "left"
      ? "M30 26 L22 14 M38 22 L32 10 M46 21 L42 9"
      : face.hair === "right"
        ? "M50 21 L54 9 M58 22 L64 10 M66 26 L74 14"
        : "M42 21 L42 8 M48 20 L48 7 M54 21 L54 8";
  const mouth =
    face.mouth === "smile" ? "M36 62 Q48 72 60 62" : face.mouth === "sad" ? "M36 68 Q48 58 60 68" : "M37 65 L59 65";
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} aria-hidden="true">
      <circle cx="48" cy="50" r="30" fill="var(--color-surface)" stroke="var(--color-ink)" strokeWidth="3" />
      <path d={hair} stroke="var(--color-ink)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="38" cy="46" r="6" fill="none" stroke="var(--color-ink)" strokeWidth="2.5" />
      <circle cx="58" cy="46" r="6" fill="none" stroke="var(--color-ink)" strokeWidth="2.5" />
      <circle cx={38 + pupilX} cy="46" r="2.6" fill="var(--color-ink)" />
      <circle cx={58 + pupilX} cy="46" r="2.6" fill="var(--color-ink)" />
      <path d={mouth} stroke="var(--color-ink)" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function CarasGame({ onComplete, preview, config }: ClinicalGameProps) {
  const seconds = Number(config?.time_seconds ?? 180);
  const [stage, setStage] = useState<"intro" | "practice" | "play" | "done">("intro");
  const [idx, setIdx] = useState(0);
  const [practiceIdx, setPracticeIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const tally = useRef({ A: 0, E: 0, rts: [] as number[] });
  const shownAt = useRef(0);

  const finish = useCallback(() => {
    if (stage !== "play") return;
    const { A, E, rts } = tally.current;
    onComplete({
      A, E,
      A_menos_E: A - E,
      ICI: A + E > 0 ? Math.round(((A - E) / (A + E)) * 100) : 100,
      respondidos: A + E,
      omisiones: CARAS_TRIPLETS.length - (A + E),
      tr_medio_ms: mean(rts),
      segundos: seconds,
    });
    setStage("done");
  }, [stage, onComplete, seconds]);

  const left = useCountdown(seconds, stage === "play", finish);

  const choose = (i: number) => {
    if (stage === "practice") {
      setPicked(i);
      return;
    }
    const t = CARAS_TRIPLETS[idx];
    if (i === t.correctIndex) tally.current.A++;
    else tally.current.E++;
    tally.current.rts.push(Math.round(performance.now() - shownAt.current));
    if (idx + 1 >= CARAS_TRIPLETS.length) { finish(); return; }
    setIdx(idx + 1);
    shownAt.current = performance.now();
  };

  if (stage === "intro") {
    return (
      <GameIntro
        title="La cara diferente"
        domain="Atención sostenida e impulsividad"
        minutes={`${Math.round(seconds / 60)} min`}
        steps={[
          "Verás tres caras. Dos son iguales y una es distinta.",
          "Fíjate en el pelo, en hacia dónde miran los ojos y en la boca.",
          "Toca la cara diferente. Intenta ir rápido, pero sin adivinar.",
        ]}
        demo={<div className="flex gap-1">{CARAS_PRACTICE[0].faces.map((f, i) => <FaceSvg key={i} face={f} size={72} />)}</div>}
        onPractice={() => { setPracticeIdx(0); setPicked(null); setStage("practice"); }}
        onStart={() => { tally.current = { A: 0, E: 0, rts: [] }; setIdx(0); shownAt.current = performance.now(); setStage("play"); }}
      />
    );
  }
  if (stage === "done") return <GameDone preview={preview} onRetry={() => setStage("intro")} />;

  const trio: Triplet = stage === "practice" ? CARAS_PRACTICE[practiceIdx] : CARAS_TRIPLETS[idx];

  return (
    <GameFrame
      title="La cara diferente"
      phase={stage === "practice" ? "Práctica" : undefined}
      secondsLeft={stage === "play" ? left : undefined}
      timeFraction={stage === "play" ? left / seconds : undefined}
      counter={stage === "play" ? `${idx + 1} / ${CARAS_TRIPLETS.length}` : `${practiceIdx + 1} / ${CARAS_PRACTICE.length}`}
    >
      <p className="text-center text-muted">Toca la cara que es distinta.</p>
      <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-3 sm:gap-5">
        {trio.faces.map((f, i) => {
          const reveal = stage === "practice" && picked !== null;
          const tone = reveal && i === trio.correctIndex ? "ring-ok bg-ok-soft" : reveal && i === picked ? "ring-bad bg-bad-soft" : "ring-line bg-band";
          return (
            <button
              key={`${idx}-${practiceIdx}-${i}`}
              type="button"
              onClick={() => choose(i)}
              disabled={stage === "practice" && picked !== null}
              aria-label={`Cara ${i + 1}`}
              className={`flex aspect-square items-center justify-center rounded-3xl ring-2 transition-transform active:scale-95 ${tone}`}
            >
              <FaceSvg face={f} size={120} />
            </button>
          );
        })}
      </div>
      {stage === "practice" && picked !== null && (
        <div className="mt-6 text-center">
          <p className={picked === trio.correctIndex ? "text-ok" : "text-bad"}>
            {picked === trio.correctIndex ? "¡Correcto!" : "Casi. La distinta es la marcada en verde."}
          </p>
          <button
            type="button"
            autoFocus
            onClick={() => {
              setPicked(null);
              if (practiceIdx + 1 < CARAS_PRACTICE.length) setPracticeIdx(practiceIdx + 1);
              else setStage("intro");
            }}
            className="mt-4 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-surface"
          >
            {practiceIdx + 1 < CARAS_PRACTICE.length ? "Siguiente ejemplo" : "Listo, volver"}
          </button>
        </div>
      )}
    </GameFrame>
  );
}
