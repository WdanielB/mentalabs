// Formateadores sin dependencias de servidor: seguros en componentes cliente.

export function initials(name: string) {
  return name
    .replace(/^(Dra?\.|Mg\.|Lic\.|Ps\.)\s*/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export const formatPEN = (n: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 0 }).format(n);

/** "2 años y 4 meses", "8 meses", "7 años". Edad exacta importa en tamizajes infantiles. */
export function ageLabel(birthDate: string | null | undefined, now = new Date()): string {
  if (!birthDate) return "";
  const b = new Date(`${birthDate}T12:00:00`);
  let months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (now.getDate() < b.getDate()) months--;
  if (months < 0) return "";
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} ${m === 1 ? "mes" : "meses"}`;
  if (y >= 6 || m === 0) return `${y} ${y === 1 ? "año" : "años"}`;
  return `${y} ${y === 1 ? "año" : "años"} y ${m} ${m === 1 ? "mes" : "meses"}`;
}

export const firstName = (full: string) => full.replace(/^(Dra?\.|Mg\.|Lic\.|Ps\.)\s*/i, "").split(/\s+/)[0] ?? full;

export const formatDateLima = (iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" }) =>
  new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", ...opts }).format(new Date(iso));

/** Metadatos que el banco de pruebas guarda como JSON en exams.description. */
export interface ExamMeta {
  text?: string;
  battery?: string;
  diagnosis_type?: string;
  respondent?: "cuidador" | "paciente" | "especialista";
  age_range?: string;
  score_multiplier?: number;
  /** "games": batería sin ítems puntuables; el resultado está en las sesiones de juego. */
  kind?: "games";
}
export function parseExamMeta(description: string | null | undefined): ExamMeta {
  if (!description) return {};
  try {
    const parsed = JSON.parse(description);
    return typeof parsed === "object" && parsed ? parsed : { text: description };
  } catch {
    return { text: description };
  }
}

/** Puntaje para mostrar: CARS-2 se guarda ×2 para admitir medios puntos. */
export const displayScore = (total: number | null, meta: ExamMeta) =>
  total === null ? null : meta.score_multiplier ? total / meta.score_multiplier : total;
