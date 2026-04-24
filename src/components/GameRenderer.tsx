"use client";

import { useState, useEffect, useRef } from "react";
import { Brain, Zap, Target, Play, RotateCcw, Trophy, Timer } from "lucide-react";

interface GameConfig {
  game_type?: string;
  rounds?: number;
  time_limit_seconds?: number;
  trials?: number;
  duration_seconds?: number;
  interval_ms?: number;
  difficulty?: string;
  card_types?: string[];
  capture?: string[];
  rule_switches?: number;
  items_per_rule?: number;
  [k: string]: unknown;
}

interface GameRendererProps {
  config: GameConfig;
  onComplete: (metrics: Record<string, number | string>) => void;
  preview?: boolean; // preview mode in editor (no save)
}

export default function GameRenderer({ config, onComplete, preview = false }: GameRendererProps) {
  const type = config.game_type ?? "memory_cards";

  if (type === "memory_cards")        return <MemoryCardsGame config={config} onComplete={onComplete} preview={preview} />;
  if (type === "reaction_time")       return <ReactionGame    config={config} onComplete={onComplete} preview={preview} />;
  if (type === "sustained_attention") return <AttentionGame   config={config} onComplete={onComplete} preview={preview} />;
  if (type === "cognitive_sorting")   return <SortingGame     config={config} onComplete={onComplete} preview={preview} />;

  return (
    <div className="p-8 text-center bg-slate-50 dark:bg-[#111822] rounded-2xl border border-slate-200 dark:border-slate-700">
      <Brain className="h-10 w-10 mx-auto mb-3 text-slate-300" />
      <p className="text-slate-500 font-semibold">Tipo de juego no implementado: <code className="font-mono">{type}</code></p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  Memory Cards                                                  */
/* ────────────────────────────────────────────────────────────── */

const COLORS = ["#136dec", "#0bda5e", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4"];

function MemoryCardsGame({ config, onComplete, preview }: GameRendererProps) {
  const rounds = (config.rounds as number) ?? 5;
  const timeLimit = (config.time_limit_seconds as number) ?? 60;
  const pairs = Math.min(6, Math.max(3, rounds));

  const [stage,   setStage]   = useState<"intro" | "play" | "done">("intro");
  const [cards,   setCards]   = useState<{ id: number; color: string; flipped: boolean; matched: boolean }[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves,   setMoves]   = useState(0);
  const [errors,  setErrors]  = useState(0);
  const [timeLeft,setTimeLeft]= useState(timeLimit);
  const [matched, setMatched] = useState(0);
  const startRef = useRef<number>(0);

  const startGame = () => {
    const deck: typeof cards = [];
    for (let i = 0; i < pairs; i++) {
      deck.push({ id: i * 2,     color: COLORS[i], flipped: false, matched: false });
      deck.push({ id: i * 2 + 1, color: COLORS[i], flipped: false, matched: false });
    }
    deck.sort(() => Math.random() - 0.5);
    setCards(deck);
    setFlipped([]); setMoves(0); setErrors(0); setMatched(0);
    setTimeLeft(timeLimit);
    startRef.current = Date.now();
    setStage("play");
  };

  useEffect(() => {
    if (stage !== "play") return;
    const t = setInterval(() => setTimeLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [stage]);

  useEffect(() => {
    if (stage === "play" && (timeLeft === 0 || matched === pairs)) {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const accuracy = moves > 0 ? Math.round(((moves - errors) / moves) * 100) : 0;
      const reactionAvg = moves > 0 ? Math.round((elapsed / moves) * 1000) : 0;
      setStage("done");
      onComplete({
        accuracy_pct: accuracy,
        reaction_time_ms: reactionAvg,
        errors,
        rounds_completed: matched,
        time_elapsed_s: Math.round(elapsed),
      });
    }
  }, [timeLeft, matched, stage, moves, errors, pairs, onComplete]);

  const handleFlip = (idx: number) => {
    if (flipped.length === 2) return;
    if (cards[idx].flipped || cards[idx].matched) return;

    const newCards = cards.map((c, i) => i === idx ? { ...c, flipped: true } : c);
    setCards(newCards);
    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [a, b] = newFlipped;
      if (newCards[a].color === newCards[b].color) {
        setTimeout(() => {
          setCards(prev => prev.map((c, i) => (i === a || i === b) ? { ...c, matched: true } : c));
          setFlipped([]);
          setMatched(m => m + 1);
        }, 400);
      } else {
        setErrors(e => e + 1);
        setTimeout(() => {
          setCards(prev => prev.map((c, i) => (i === a || i === b) ? { ...c, flipped: false } : c));
          setFlipped([]);
        }, 800);
      }
    }
  };

  if (stage === "intro") {
    return (
      <GameIntro
        title="Memoria de Cartas"
        icon={Brain}
        description={`Encuentra ${pairs} pares de colores. Tienes ${timeLimit}s.`}
        onStart={startGame}
      />
    );
  }

  if (stage === "done") {
    return <GameDone moves={moves} errors={errors} preview={preview} onRetry={startGame} />;
  }

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-[#111822] dark:to-[#136dec]/5 rounded-2xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Timer className="h-4 w-4 text-[#136dec]" />
          <span className={timeLeft < 10 ? "text-red-500" : ""}>{timeLeft}s</span>
        </div>
        <div className="text-sm font-bold text-slate-500">{matched}/{pairs} pares</div>
        <div className="text-sm text-slate-500">Mov: {moves}</div>
      </div>
      <div className="grid grid-cols-4 gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(4, pairs * 2)}, 1fr)` }}>
        {cards.map((card, i) => (
          <button key={i} onClick={() => handleFlip(i)} disabled={flipped.length === 2}
            className={`aspect-square rounded-2xl border-2 transition-all duration-300 ${card.matched ? "opacity-30 scale-95" : "hover:scale-105"} ${card.flipped || card.matched ? "border-transparent" : "bg-white dark:bg-[#1a2432] border-slate-200 dark:border-slate-700 hover:border-[#136dec]"}`}
            style={{ background: (card.flipped || card.matched) ? card.color : undefined }}>
            {!card.flipped && !card.matched && <span className="text-3xl text-slate-300">?</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  Reaction Time                                                 */
/* ────────────────────────────────────────────────────────────── */

function ReactionGame({ config, onComplete, preview }: GameRendererProps) {
  const trials = (config.trials as number) ?? 10;
  const interval = (config.interval_ms as number) ?? 1500;

  const [stage,   setStage]   = useState<"intro" | "wait" | "click" | "done">("intro");
  const [trial,   setTrial]   = useState(0);
  const [times,   setTimes]   = useState<number[]>([]);
  const [missed,  setMissed]  = useState(0);
  const [falseStarts, setFalseStarts] = useState(0);
  const stimulusTimer = useRef<NodeJS.Timeout | null>(null);
  const startRef = useRef<number>(0);

  const startGame = () => {
    setStage("wait"); setTrial(0); setTimes([]); setMissed(0); setFalseStarts(0);
    nextTrial();
  };

  const nextTrial = () => {
    if (trial >= trials) { finish(); return; }
    setStage("wait");
    const delay = 800 + Math.random() * 2000;
    stimulusTimer.current = setTimeout(() => {
      setStage("click");
      startRef.current = Date.now();
      setTimeout(() => {
        if (stimulusTimer.current) {
          setMissed(m => m + 1);
          setTrial(t => t + 1);
          setStage("wait");
          stimulusTimer.current = null;
        }
      }, interval);
    }, delay);
  };

  const handleClick = () => {
    if (stage === "wait") { setFalseStarts(f => f + 1); return; }
    if (stage === "click") {
      const rt = Date.now() - startRef.current;
      setTimes(prev => [...prev, rt]);
      setTrial(t => t + 1);
    }
  };

  useEffect(() => {
    if (trial > 0 && trial < trials && stage !== "click") nextTrial();
    if (trial === trials) finish();
  }, [trial]);

  const finish = () => {
    if (stimulusTimer.current) clearTimeout(stimulusTimer.current);
    const avg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
    setStage("done");
    onComplete({
      reaction_time_ms: avg,
      missed_trials: missed,
      false_starts: falseStarts,
      trials_completed: times.length,
    });
  };

  if (stage === "intro") {
    return <GameIntro title="Tiempo de Reacción" icon={Zap}
      description={`${trials} ensayos. Toca cuando veas el círculo verde. Sé rápido pero no anticipes.`}
      onStart={startGame} color="green" />;
  }

  if (stage === "done") {
    const avg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
    return (
      <div className="p-8 text-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-2xl border border-green-200 dark:border-green-800">
        <Trophy className="h-12 w-12 mx-auto mb-3 text-[#0bda5e]" />
        <p className="text-3xl font-black text-[#0bda5e] mb-1">{avg}ms</p>
        <p className="text-sm text-slate-500 mb-4">Tiempo de reacción promedio</p>
        <p className="text-xs text-slate-400">Errores: {missed} omitidas, {falseStarts} anticipaciones</p>
        {preview && <button onClick={startGame} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a2432] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"><RotateCcw className="h-3.5 w-3.5" /> Repetir</button>}
      </div>
    );
  }

  return (
    <div onClick={handleClick} className="cursor-pointer">
      <div className={`p-12 min-h-[280px] flex flex-col items-center justify-center rounded-2xl border-2 transition-all ${stage === "click" ? "bg-[#0bda5e] border-[#0bda5e]" : "bg-slate-100 dark:bg-[#111822] border-slate-300 dark:border-slate-700"}`}>
        {stage === "click" ? (
          <>
            <div className="h-24 w-24 rounded-full bg-white shadow-2xl animate-pulse" />
            <p className="text-white font-black mt-4 text-xl">¡Toca AHORA!</p>
          </>
        ) : (
          <>
            <p className="text-slate-500 font-medium text-lg mb-2">Espera el círculo verde...</p>
            <p className="text-xs text-slate-400">Ensayo {trial + 1} de {trials}</p>
          </>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  Sustained Attention                                           */
/* ────────────────────────────────────────────────────────────── */

function AttentionGame({ config, onComplete, preview }: GameRendererProps) {
  const duration = Math.min(60, (config.duration_seconds as number) ?? 60); // cap at 60s

  const [stage, setStage] = useState<"intro" | "play" | "done">("intro");
  const [target, setTarget] = useState<"shape" | "distractor">("distractor");
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [falsePos, setFalsePos] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [reactions, setReactions] = useState<number[]>([]);
  const stimulusStart = useRef(0);
  const lastWasTarget = useRef(false);

  const start = () => {
    setHits(0); setMisses(0); setFalsePos(0); setReactions([]);
    setTimeLeft(duration); setStage("play");
  };

  useEffect(() => {
    if (stage !== "play") return;
    const t = setInterval(() => setTimeLeft(s => Math.max(0, s - 1)), 1000);
    const stim = setInterval(() => {
      if (lastWasTarget.current) setMisses(m => m + 1); // missed previous target
      const isTarget = Math.random() < 0.3;
      setTarget(isTarget ? "shape" : "distractor");
      lastWasTarget.current = isTarget;
      stimulusStart.current = Date.now();
    }, 1200);
    return () => { clearInterval(t); clearInterval(stim); };
  }, [stage]);

  useEffect(() => {
    if (timeLeft === 0 && stage === "play") {
      const avg = reactions.length > 0 ? Math.round(reactions.reduce((a, b) => a + b, 0) / reactions.length) : 0;
      const total = hits + misses;
      const accuracy = total > 0 ? Math.round((hits / total) * 100) : 0;
      setStage("done");
      onComplete({
        accuracy_pct: accuracy,
        false_positives: falsePos,
        response_time_avg: avg,
        hits, misses,
      });
    }
  }, [timeLeft, stage]);

  const handleTap = () => {
    if (target === "shape") {
      setHits(h => h + 1);
      setReactions(p => [...p, Date.now() - stimulusStart.current]);
      lastWasTarget.current = false;
    } else {
      setFalsePos(p => p + 1);
    }
  };

  if (stage === "intro") {
    return <GameIntro title="Atención Sostenida" icon={Target}
      description={`Toca SOLO cuando veas el círculo. ${duration}s totales.`} onStart={start} color="purple" />;
  }

  if (stage === "done") {
    const total = hits + misses;
    const acc = total > 0 ? Math.round((hits / total) * 100) : 0;
    return (
      <div className="p-8 text-center bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-200 dark:border-purple-800">
        <Trophy className="h-12 w-12 mx-auto mb-3 text-purple-600" />
        <p className="text-3xl font-black text-purple-600 mb-1">{acc}%</p>
        <p className="text-sm text-slate-500 mb-4">Precisión</p>
        <div className="flex justify-center gap-6 text-sm">
          <span className="text-slate-500">Aciertos: <span className="font-bold text-[#0bda5e]">{hits}</span></span>
          <span className="text-slate-500">Errores: <span className="font-bold text-red-500">{falsePos + misses}</span></span>
        </div>
        {preview && <button onClick={start} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a2432] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"><RotateCcw className="h-3.5 w-3.5" /> Repetir</button>}
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/10 dark:to-violet-900/10 rounded-2xl border border-purple-200 dark:border-purple-800">
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm font-semibold text-purple-600">{timeLeft}s restantes</div>
        <div className="text-sm text-slate-500">Aciertos: {hits}</div>
      </div>
      <button onClick={handleTap} className="w-full min-h-[260px] flex items-center justify-center bg-white dark:bg-[#1a2432] rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-purple-400 transition-all active:scale-95">
        {target === "shape" ? (
          <div className="h-32 w-32 rounded-full bg-purple-500 shadow-2xl" />
        ) : (
          <div className="h-32 w-32 bg-slate-300 dark:bg-slate-700" style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }} />
        )}
      </button>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  Cognitive Sorting                                             */
/* ────────────────────────────────────────────────────────────── */

function SortingGame({ config, onComplete, preview }: GameRendererProps) {
  const switches = (config.rule_switches as number) ?? 3;
  const perRule = (config.items_per_rule as number) ?? 5;
  const total = switches * perRule;

  const [stage, setStage] = useState<"intro" | "play" | "done">("intro");
  const [round, setRound] = useState(0);
  const [rule, setRule] = useState<"color" | "shape">("color");
  const [hits, setHits] = useState(0);
  const [errors, setErrors] = useState(0);
  const [switchTimes, setSwitchTimes] = useState<number[]>([]);
  const [stimulus, setStimulus] = useState({ color: "blue", shape: "circle" });
  const stimulusStart = useRef(0);
  const ruleSwitchAt = useRef(0);

  const newStimulus = () => {
    const colors = ["blue", "red"];
    const shapes = ["circle", "square"];
    setStimulus({ color: colors[Math.floor(Math.random() * 2)], shape: shapes[Math.floor(Math.random() * 2)] });
    stimulusStart.current = Date.now();
  };

  const start = () => {
    setHits(0); setErrors(0); setSwitchTimes([]); setRound(0); setRule("color");
    ruleSwitchAt.current = 0;
    setStage("play"); newStimulus();
  };

  const handleAnswer = (target: "blue_or_circle" | "red_or_square") => {
    const correct = rule === "color"
      ? (target === "blue_or_circle" ? stimulus.color === "blue" : stimulus.color === "red")
      : (target === "blue_or_circle" ? stimulus.shape === "circle" : stimulus.shape === "square");
    if (correct) {
      setHits(h => h + 1);
      if (round === ruleSwitchAt.current) {
        const switchCost = Date.now() - stimulusStart.current;
        setSwitchTimes(p => [...p, switchCost]);
      }
    } else {
      setErrors(e => e + 1);
    }

    const next = round + 1;
    if (next >= total) {
      const accuracy = Math.round((hits / total) * 100);
      const switchCost = switchTimes.length > 0 ? Math.round(switchTimes.reduce((a, b) => a + b, 0) / switchTimes.length) : 0;
      setStage("done");
      onComplete({
        accuracy_pct: accuracy,
        switch_cost_ms: switchCost,
        errors,
        rounds: total,
      });
      return;
    }

    if (next > 0 && next % perRule === 0) {
      setRule(r => r === "color" ? "shape" : "color");
      ruleSwitchAt.current = next;
    }
    setRound(next);
    newStimulus();
  };

  if (stage === "intro") {
    return <GameIntro title="Clasificación Flexible" icon={Brain}
      description={`Clasifica según la regla. La regla cambia cada ${perRule} rondas.`} onStart={start} color="blue" />;
  }

  if (stage === "done") {
    const accuracy = Math.round((hits / total) * 100);
    return (
      <div className="p-8 text-center bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-200 dark:border-blue-800">
        <Trophy className="h-12 w-12 mx-auto mb-3 text-[#136dec]" />
        <p className="text-3xl font-black text-[#136dec] mb-1">{accuracy}%</p>
        <p className="text-sm text-slate-500">Precisión total</p>
        {preview && <button onClick={start} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a2432] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"><RotateCcw className="h-3.5 w-3.5" /> Repetir</button>}
      </div>
    );
  }

  const colorMap: Record<string, string> = { blue: "#136dec", red: "#ef4444" };

  return (
    <div className="p-6 bg-slate-50 dark:bg-[#111822] rounded-2xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-[#136dec]">
          Clasifica por: {rule === "color" ? "COLOR" : "FORMA"}
        </span>
        <span className="text-sm text-slate-500">{round + 1}/{total}</span>
      </div>
      <div className="flex justify-center mb-6 py-8">
        <div className="h-28 w-28 flex items-center justify-center"
          style={stimulus.shape === "circle"
            ? { background: colorMap[stimulus.color], borderRadius: "50%" }
            : { background: colorMap[stimulus.color] }}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => handleAnswer("blue_or_circle")}
          className="py-4 bg-white dark:bg-[#1a2432] border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm hover:border-[#136dec] transition-all active:scale-95">
          {rule === "color" ? "AZUL" : "CÍRCULO"}
        </button>
        <button onClick={() => handleAnswer("red_or_square")}
          className="py-4 bg-white dark:bg-[#1a2432] border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm hover:border-red-400 transition-all active:scale-95">
          {rule === "color" ? "ROJO" : "CUADRADO"}
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  Shared sub-components                                         */
/* ────────────────────────────────────────────────────────────── */

function GameIntro({
  title, icon: Icon, description, onStart, color = "blue",
}: { title: string; icon: React.ElementType; description: string; onStart: () => void; color?: string }) {
  const bg = { blue: "from-blue-50 to-cyan-50 dark:from-[#136dec]/10", green: "from-green-50 to-emerald-50 dark:from-[#0bda5e]/10", purple: "from-purple-50 to-violet-50 dark:from-purple-900/10" }[color] ?? "";
  return (
    <div className={`p-8 text-center bg-gradient-to-br ${bg} rounded-2xl border border-slate-200 dark:border-slate-700`}>
      <Icon className="h-12 w-12 mx-auto mb-4 text-[#136dec]" />
      <h3 className="font-black text-xl mb-2">{title}</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">{description}</p>
      <button onClick={onStart}
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#136dec] text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-[#136dec]/20 active:scale-95">
        <Play className="h-4 w-4" /> Iniciar Ejercicio
      </button>
    </div>
  );
}

function GameDone({ moves, errors, preview, onRetry }: { moves: number; errors: number; preview?: boolean; onRetry: () => void }) {
  const accuracy = moves > 0 ? Math.round(((moves - errors) / moves) * 100) : 0;
  return (
    <div className="p-8 text-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 rounded-2xl border border-green-200 dark:border-green-800">
      <Trophy className="h-12 w-12 mx-auto mb-3 text-[#0bda5e]" />
      <p className="text-3xl font-black text-[#0bda5e] mb-1">{accuracy}%</p>
      <p className="text-sm text-slate-500 mb-4">Precisión</p>
      <div className="flex justify-center gap-6 text-sm text-slate-500">
        <span>Movimientos: <span className="font-bold">{moves}</span></span>
        <span>Errores: <span className="font-bold">{errors}</span></span>
      </div>
      {preview && (
        <button onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a2432] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">
          <RotateCcw className="h-3.5 w-3.5" /> Repetir
        </button>
      )}
    </div>
  );
}
