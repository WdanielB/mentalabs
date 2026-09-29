import type { ComponentType } from "react";
import type { ClinicalGameProps, GameMetrics } from "./GameFrame";
import StroopGame from "./StroopGame";
import D2Game from "./D2Game";
import CarasGame from "./CarasGame";
import TowerGame from "./TowerGame";

export type Flag = "typical" | "screening" | "clinical";

export interface GameSummary {
  flag: Flag;
  headline: string;
  details: { label: string; value: string }[];
}

export interface ClinicalGame {
  id: string;
  title: string;
  childTitle: string;
  instrument: string;
  domain: string;
  ages: string;
  minutes: string;
  Component: ComponentType<ClinicalGameProps>;
  summarize: (m: GameMetrics) => GameSummary;
}

const n = (m: GameMetrics, k: string) => Number(m[k] ?? 0);

// Cortes orientativos para revisión clínica (tomados de DTEP). No son
// baremos normativos: el especialista interpreta con la edad y el contexto.
export const CLINICAL_GAMES: ClinicalGame[] = [
  {
    id: "stroop",
    title: "Stroop · Colores y palabras",
    childTitle: "Colores y palabras",
    instrument: "Stroop (Golden)",
    domain: "Control inhibitorio",
    ages: "7 años o más",
    minutes: "3 min",
    Component: StroopGame,
    summarize: (m) => {
      const inter = n(m, "interferencia");
      const flag: Flag = inter < -10 || n(m, "errores_PC") >= 6 ? "clinical" : inter < 0 ? "screening" : "typical";
      return {
        flag,
        headline:
          flag === "clinical" ? "Dificultad marcada para inhibir la respuesta automática"
          : flag === "screening" ? "Control inhibitorio en rango límite" : "Control inhibitorio conservado",
        details: [
          { label: "Palabras (P)", value: `${n(m, "P")} correctas` },
          { label: "Colores (C)", value: `${n(m, "C")} correctas` },
          { label: "Interferencia (PC)", value: `${n(m, "PC")} correctas · ${n(m, "errores_PC")} errores` },
          { label: "Índice de interferencia", value: inter.toFixed(1) },
          { label: "Tiempo de reacción PC", value: `${n(m, "tr_PC_ms")} ms` },
        ],
      };
    },
  },
  {
    id: "d2r",
    title: "D2-R · Cazador de letras",
    childTitle: "Cazador de letras",
    instrument: "D2-R (Brickenkamp)",
    domain: "Atención selectiva y concentración",
    ages: "8 años o más",
    minutes: "2 min",
    Component: D2Game,
    summarize: (m) => {
      const pct = n(m, "errores_pct");
      const flag: Flag = pct > 20 || n(m, "VAR") > 8 ? "clinical" : pct > 10 ? "screening" : "typical";
      return {
        flag,
        headline:
          flag === "clinical" ? "Atención selectiva inestable, con muchas omisiones y comisiones"
          : flag === "screening" ? "Precisión atencional algo baja" : "Atención selectiva adecuada",
        details: [
          { label: "Procesados (TR)", value: String(n(m, "TR")) },
          { label: "Aciertos (TA)", value: String(n(m, "TA")) },
          { label: "Omisiones / Comisiones", value: `${n(m, "O")} / ${n(m, "C")}` },
          { label: "Concentración (CON)", value: String(n(m, "CON")) },
          { label: "Errores", value: `${pct}%` },
          { label: "Variación entre filas (VAR)", value: String(n(m, "VAR")) },
        ],
      };
    },
  },
  {
    id: "caras_r",
    title: "CARAS-R · La cara diferente",
    childTitle: "La cara diferente",
    instrument: "CARAS-R (Thurstone y Yela)",
    domain: "Atención sostenida e impulsividad",
    ages: "6 años o más",
    minutes: "3 min",
    Component: CarasGame,
    summarize: (m) => {
      const ici = n(m, "ICI");
      const flag: Flag = ici < 70 ? "clinical" : ici < 85 ? "screening" : "typical";
      return {
        flag,
        headline:
          flag === "clinical" ? "Estilo impulsivo: responde rápido con alta tasa de error"
          : flag === "screening" ? "Control de la impulsividad moderado" : "Estilo reflexivo",
        details: [
          { label: "Aciertos (A)", value: String(n(m, "A")) },
          { label: "Errores (E)", value: String(n(m, "E")) },
          { label: "Eficacia (A−E)", value: String(n(m, "A_menos_E")) },
          { label: "Control de impulsividad (ICI)", value: `${ici}%` },
          { label: "Tiempo medio por trío", value: `${n(m, "tr_medio_ms")} ms` },
        ],
      };
    },
  },
  {
    id: "tower_london",
    title: "Torre de Londres · La torre",
    childTitle: "La torre",
    instrument: "Torre de Londres (Shallice)",
    domain: "Planificación",
    ages: "7 años o más",
    minutes: "5 a 8 min",
    Component: TowerGame,
    summarize: (m) => {
      const levels = n(m, "niveles") || 1;
      const ratio = n(m, "resueltos_en_minimo") / levels;
      const rushed = n(m, "planificacion_media_ms") < 2500;
      const flag: Flag = ratio < 0.4 || (rushed && n(m, "movimientos_extra") > 10) ? "clinical" : ratio < 0.65 ? "screening" : "typical";
      return {
        flag,
        headline:
          flag === "clinical" ? "Planificación deficiente: empieza a mover antes de anticipar"
          : flag === "screening" ? "Planificación algo ineficiente" : "Planificación adecuada",
        details: [
          { label: "Resueltos", value: `${n(m, "resueltos")} de ${levels}` },
          { label: "En el mínimo de movimientos", value: String(n(m, "resueltos_en_minimo")) },
          { label: "Movimientos extra", value: String(n(m, "movimientos_extra")) },
          { label: "Tiempo antes del 1.er movimiento", value: `${(n(m, "planificacion_media_ms") / 1000).toFixed(1)} s` },
          { label: "Intentos no válidos", value: String(n(m, "violaciones_regla")) },
        ],
      };
    },
  },
];

export const gameById = (id: string) => CLINICAL_GAMES.find((g) => g.id === id);

export const FLAG_STYLE: Record<Flag, { label: string; className: string }> = {
  typical: { label: "Esperado", className: "bg-ok-soft text-ok" },
  screening: { label: "Límite", className: "bg-warn-soft text-warn" },
  clinical: { label: "Requiere atención", className: "bg-bad-soft text-bad" },
};
