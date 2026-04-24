"use client";

import { useEffect, useState } from "react";
import { Gamepad2, Zap, Brain, Target, Clock, TrendingUp } from "lucide-react";
import { createClient } from "../../../../../utils/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface GameSession {
  id: string;
  game_type: string;
  metrics: Record<string, unknown>;
  session_start: string;
  session_end: string | null;
}

const GAME_CATALOG = [
  {
    id: "Cognitivo_Memoria",
    title: "Memoria Visual",
    description: "Ejercita tu memoria de trabajo recordando secuencias de imágenes.",
    icon: Brain,
    color: "from-[#136dec] to-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-[#136dec]",
    duration: "5–10 min",
    level: "Básico",
  },
  {
    id: "Motor_Reaccion",
    title: "Tiempo de Reacción",
    description: "Mejora tu velocidad de respuesta con ejercicios de estimulación motora.",
    icon: Zap,
    color: "from-[#0bda5e] to-teal-400",
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-[#0bda5e]",
    duration: "3–5 min",
    level: "Básico",
  },
  {
    id: "Cognitivo_Atencion",
    title: "Atención Sostenida",
    description: "Practica mantener el foco durante periodos prolongados con tareas variadas.",
    icon: Target,
    color: "from-purple-500 to-violet-400",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-600",
    duration: "10–15 min",
    level: "Intermedio",
  },
];

export default function PacienteJuegosPage() {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("interactive_sessions")
        .select("id, game_type, metrics, session_start, session_end")
        .eq("patient_id", user.id)
        .order("session_start", { ascending: false })
        .limit(10);

      if (data) setSessions(data);
      setLoading(false);
    };
    load();
  }, []);

  const getMetricDisplay = (metrics: Record<string, unknown>) => {
    const parts: string[] = [];
    if (metrics.accuracy_pct != null) parts.push(`Precisión: ${metrics.accuracy_pct}%`);
    if (metrics.reaction_time_ms != null) parts.push(`Reacción: ${metrics.reaction_time_ms}ms`);
    if (metrics.score != null) parts.push(`Score: ${metrics.score}`);
    return parts.join(" · ") || "Sin métricas";
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black">Juegos Terapéuticos</h1>
        <p className="text-slate-500 text-sm mt-1">Ejercicios cognitivos y motores recomendados</p>
      </div>

      {/* Game Catalog */}
      <section className="mb-10">
        <h2 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4">Ejercicios Disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {GAME_CATALOG.map((game) => {
            const Icon = game.icon;
            return (
              <div key={game.id} className="bg-white dark:bg-[#1a2432] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className={`h-2 w-full bg-gradient-to-r ${game.color}`} />
                <div className="p-5">
                  <div className={`h-11 w-11 rounded-xl ${game.bg} flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${game.text}`} />
                  </div>
                  <h3 className="font-bold">{game.title}</h3>
                  <p className="text-sm text-slate-500 mt-1 mb-4 leading-relaxed">{game.description}</p>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full">
                      <Clock className="h-3 w-3" /> {game.duration}
                    </span>
                    <span className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full">
                      {game.level}
                    </span>
                  </div>
                  <button className={`w-full py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r ${game.color} hover:opacity-90 transition-opacity shadow-sm`}>
                    Iniciar Ejercicio
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Session History */}
      <section>
        <h2 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4">Historial de Sesiones</h2>

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-white dark:bg-[#1a2432] border border-slate-200 dark:border-slate-800 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-[#1a2432] rounded-2xl border border-slate-200 dark:border-slate-800">
            <TrendingUp className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-500 font-medium">Aún no has completado ninguna sesión</p>
            <p className="text-slate-400 text-sm mt-1">¡Inicia tu primer ejercicio arriba!</p>
          </div>
        )}

        <div className="space-y-3">
          {sessions.map((s) => {
            const game = GAME_CATALOG.find((g) => g.id === s.game_type);
            const Icon = game?.icon ?? Gamepad2;
            const bg = game?.bg ?? "bg-slate-50 dark:bg-slate-800";
            const text = game?.text ?? "text-slate-500";
            return (
              <div key={s.id} className="flex items-center gap-4 p-4 bg-white dark:bg-[#1a2432] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className={`h-9 w-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-5 w-5 ${text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{game?.title ?? s.game_type}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {getMetricDisplay(s.metrics as Record<string, unknown>)}
                  </p>
                </div>
                <p className="text-xs text-slate-400 shrink-0">
                  {format(new Date(s.session_start), "d MMM, HH:mm", { locale: es })}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
