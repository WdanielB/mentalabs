"use client";

import { useCallback, useRef, useState } from "react";
import { GameDone, GameFrame, GameIntro, useCountdown, type ClinicalGameProps } from "./GameFrame";

// D2-R (Brickenkamp), versión digital de DTEP: marcar solo las "d" con
// exactamente dos rayitas. Líneas de 20 s. Medidas: TR (procesados),
// TA (aciertos), O (omisiones), C (comisiones), TOT = TR − (O + C),
// CON = TA − C, VAR = TR máx − TR mín entre líneas.

type Item = { letter: "d" | "p"; top: number; bottom: number; target: boolean };

function makeLine(n: number): Item[] {
  return Array.from({ length: n }, () => {
    const letter = Math.random() < 0.62 ? "d" : "p";
    const wantsTarget = letter === "d" && Math.random() < 0.55;
    let top: number, bottom: number;
    do {
      top = Math.floor(Math.random() * 3);
      bottom = Math.floor(Math.random() * 3);
    } while (top + bottom === 0 || (wantsTarget ? top + bottom !== 2 : letter === "d" && top + bottom === 2));
    return { letter, top, bottom, target: letter === "d" && top + bottom === 2 };
  });
}

const Ticks = ({ n }: { n: number }) => (
  <span className="flex h-2.5 items-center justify-center gap-[3px]" aria-hidden="true">
    {Array.from({ length: n }).map((_, i) => <span key={i} className="h-2.5 w-[2px] rounded-full bg-current" />)}
  </span>
);

function Glyph({ item }: { item: Item }) {
  return (
    <span className="flex flex-col items-center leading-none">
      <Ticks n={item.top} />
      <span className="my-0.5 font-mono text-2xl font-semibold">{item.letter}</span>
      <Ticks n={item.bottom} />
    </span>
  );
}

export default function D2Game({ onComplete, preview, config }: ClinicalGameProps) {
  const lines = Number(config?.lines ?? 6);
  const perLine = Number(config?.items_per_line ?? 24);
  const lineSeconds = Number(config?.line_seconds ?? 20);

  const [stage, setStage] = useState<"intro" | "play" | "done">("intro");
  const [lineIdx, setLineIdx] = useState(0);
  const [items, setItems] = useState<Item[]>(() => makeLine(perLine));
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const results = useRef<{ TR: number; TA: number; O: number; C: number }[]>([]);

  const closeLine = useCallback(() => {
    const lastMarked = Math.max(-1, ...marked);
    const processed = lastMarked + 1;
    let hits = 0, omissions = 0, commissions = 0;
    for (let i = 0; i < processed; i++) {
      const hit = marked.has(i);
      if (items[i].target && hit) hits++;
      else if (items[i].target && !hit) omissions++;
      else if (!items[i].target && hit) commissions++;
    }
    results.current.push({ TR: processed, TA: hits, O: omissions, C: commissions });

    if (lineIdx + 1 < lines) {
      setLineIdx((l) => l + 1);
      setItems(makeLine(perLine));
      setMarked(new Set());
      return;
    }
    const r = results.current;
    const sum = (k: "TR" | "TA" | "O" | "C") => r.reduce((a, x) => a + x[k], 0);
    const TR = sum("TR"), TA = sum("TA"), O = sum("O"), C = sum("C");
    onComplete({
      TR, TA, O, C,
      TOT: TR - (O + C),
      CON: TA - C,
      VAR: Math.max(...r.map((x) => x.TR)) - Math.min(...r.map((x) => x.TR)),
      errores_pct: TR ? Math.round(((O + C) / TR) * 1000) / 10 : 0,
      lineas: lines,
      segundos_por_linea: lineSeconds,
    });
    setStage("done");
  }, [marked, items, lineIdx, lines, perLine, onComplete, lineSeconds]);

  const left = useCountdown(lineSeconds, stage === "play", closeLine, lineIdx);
  const toggle = (i: number) =>
    setMarked((m) => {
      const n = new Set(m);
      if (n.has(i)) n.delete(i); else n.add(i);
      return n;
    });

  if (stage === "intro") {
    return (
      <GameIntro
        title="Cazador de letras"
        domain="Atención selectiva y concentración"
        minutes={`${Math.ceil((lines * lineSeconds) / 60)} min`}
        steps={[
          "Busca solo las letras d que tengan DOS rayitas en total (arriba, abajo o una y una).",
          "Tócalas para marcarlas. Si te equivocas, tócala otra vez para quitar la marca.",
          `Cada fila dura ${lineSeconds} segundos. Avanza de izquierda a derecha y no regreses.`,
        ]}
        demo={
          <div className="flex gap-4 text-ink">
            <span className="rounded-xl bg-ok-soft p-2 ring-2 ring-ok"><Glyph item={{ letter: "d", top: 1, bottom: 1, target: true }} /></span>
            <span className="rounded-xl bg-ok-soft p-2 ring-2 ring-ok"><Glyph item={{ letter: "d", top: 2, bottom: 0, target: true }} /></span>
            <span className="p-2 opacity-50"><Glyph item={{ letter: "p", top: 1, bottom: 1, target: false }} /></span>
            <span className="p-2 opacity-50"><Glyph item={{ letter: "d", top: 2, bottom: 1, target: false }} /></span>
          </div>
        }
        onStart={() => { results.current = []; setLineIdx(0); setItems(makeLine(perLine)); setMarked(new Set()); setStage("play"); }}
      />
    );
  }
  if (stage === "done") return <GameDone preview={preview} onRetry={() => setStage("intro")} />;

  return (
    <GameFrame
      key={lineIdx}
      title="Cazador de letras"
      phase={`Fila ${lineIdx + 1} de ${lines}`}
      secondsLeft={left}
      timeFraction={left / lineSeconds}
    >
      <p className="mb-5 text-center text-muted">Marca las <strong className="text-ink">d</strong> con <strong className="text-ink">dos rayitas</strong>.</p>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-12" role="group" aria-label={`Fila ${lineIdx + 1}`}>
        {items.map((item, i) => {
          const on = marked.has(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              aria-pressed={on}
              aria-label={`${item.letter} con ${item.top + item.bottom} rayitas`}
              className={`flex h-20 items-center justify-center rounded-xl border-2 transition-colors ${
                on ? "border-brand bg-brand-soft text-brand-strong" : "border-transparent bg-band text-ink hover:border-line"
              }`}
            >
              <Glyph item={item} />
            </button>
          );
        })}
      </div>
    </GameFrame>
  );
}
