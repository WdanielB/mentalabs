// Genera supabase/seed_dtep_instruments.sql a partir de los datos de DTEP (neuroeval-app).
// Uso: node scripts/import-dtep.mjs "C:/Users/Daniel/Documents/Apps/DTEP/neuroeval-app/src/data" supabase/seed_dtep_instruments.sql
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

const [, , dataDir, outFile] = process.argv;
const load = async (f) => import(pathToFileURL(path.join(dataDir, f)).href);

const { mchatData } = await load("mchatData.js");
const { aq50Data } = await load("aq50Data.js");
const { raadsRData } = await load("raadsRData.js");
const { wurs25Data } = await load("wurs25Data.js");
const { conners4Data } = await load("conners4Data.js");
const { cars2Data } = await load("cars2Data.js");

const q = (s) => (s === null || s === undefined ? "null" : `'${String(s).replace(/'/g, "''")}'`);
const j = (o) => `${q(JSON.stringify(o))}::jsonb`;
const arr = (a) => `array[${a.map(q).join(",")}]::text[]`;

const exams = [];
const add = (e) => exams.push(e);

// ── M-CHAT-R/F (cuidador, 16 a 30 meses) ─────────────────────────
add({
  n: 1,
  key: "mchat",
  title: "M-CHAT-R/F · Detección temprana de autismo (16 a 30 meses)",
  meta: {
    text: mchatData.description + " Lo responde la madre, el padre o el cuidador principal.",
    battery: "TEA · Primera infancia",
    diagnosis_type: "TEA",
    respondent: "cuidador",
    age_range: "16 a 30 meses",
    authors: mchatData.authors,
    source: "DTEP",
  },
  questions: mchatData.items.map((it) => ({
    content: it.text,
    category: "Comunicación social",
    tags: it.reverse ? ["mchat", "ítem inverso"] : ["mchat"],
    options: it.reverse
      ? { type: "yesno", yes_label: "Sí", yes_score: 1, no_label: "No", no_score: 0 }
      : { type: "yesno", yes_label: "Sí", yes_score: 0, no_label: "No", no_score: 1 },
  })),
  rules: [
    [0, 2, 1, 2, "Riesgo bajo de TEA (M-CHAT-R 0 a 2)", ["Sin señales tempranas significativas. Repetir el tamizaje a los 24 meses si fue aplicado antes.", "Continuar la vigilancia de hitos del desarrollo en controles pediátricos."]],
    [3, 7, 1, 2, "Riesgo medio de TEA (M-CHAT-R 3 a 7)", ["Aplicar la entrevista de seguimiento M-CHAT-R/F con el especialista.", "Si tras el seguimiento persisten 2 o más puntos, derivar a evaluación diagnóstica."]],
    [8, 20, 1, 2, "Riesgo alto de TEA (M-CHAT-R 8 a 20)", ["Derivar a evaluación diagnóstica especializada sin esperar el seguimiento.", "Iniciar orientación a la familia sobre intervención temprana.", "El resultado es un tamizaje: el diagnóstico lo establece un profesional."]],
  ],
});

// ── AQ-50 (autoinforme adulto) ──────────────────────────────────
const aqChoices = (reverse) =>
  aq50Data.options.map((o) => ({
    text: o.label,
    score: reverse ? (o.value.startsWith("disagree") ? 1 : 0) : o.value.startsWith("agree") ? 1 : 0,
  }));
add({
  n: 2,
  key: "aq50",
  title: "AQ-50 · Cociente del Espectro Autista (adultos)",
  meta: { text: aq50Data.description, battery: "TEA · Adultos", diagnosis_type: "TEA", respondent: "paciente", age_range: "16 años o más", authors: aq50Data.authors, source: "DTEP" },
  questions: aq50Data.items.map((it) => ({
    content: it.text,
    category: aq50Data.subscales[it.subscale]?.name ?? null,
    tags: ["aq50", it.subscale],
    options: { type: "likert", choices: aqChoices(it.reverse) },
  })),
  rules: [
    [0, 25, 16, 99, "Rango de población general (AQ 0 a 25)", ["Puntaje sin rasgos autistas destacables."]],
    [26, 31, 16, 99, "Zona de tamizaje amplio (AQ 26 a 31)", ["Explorar en entrevista clínica; considerar RAADS-R."]],
    [32, 50, 16, 99, "Sobre el punto de corte clínico (AQ 32 o más)", ["Derivar a evaluación diagnóstica de TEA en adultos (entrevista clínica + RAADS-R)."]],
  ],
});

// ── RAADS-R (adultos) ───────────────────────────────────────────
const raadsScores = { now_and_young: 3, only_now: 2, only_young: 1, never: 0 };
add({
  n: 3,
  key: "raadsr",
  title: "RAADS-R · Escala Ritvo de autismo en adultos",
  meta: { text: raadsRData.description, battery: "TEA · Adultos", diagnosis_type: "TEA", respondent: "paciente", age_range: "16 años o más", authors: raadsRData.authors, source: "DTEP" },
  questions: raadsRData.items.map((it) => ({
    content: it.text,
    category: raadsRData.subscales[it.subscale]?.name ?? null,
    tags: ["raadsr", it.subscale],
    options: {
      type: "single_choice",
      choices: raadsRData.options.map((o) => ({ text: o.label, score: it.reverse ? 3 - raadsScores[o.value] : raadsScores[o.value] })),
    },
  })),
  rules: [
    [0, 64, 16, 99, "Por debajo del punto de corte (RAADS-R menor a 65)", ["Rango neurotípico. Valorar junto con la historia clínica."]],
    [65, 240, 16, 99, "Sobre el punto de corte de TEA (RAADS-R 65 o más)", ["Compatible con TEA; confirmar con entrevista diagnóstica y revisión de subescalas."]],
  ],
});

// ── WURS-25 (adultos, retrospectivo) ────────────────────────────
add({
  n: 4,
  key: "wurs25",
  title: "WURS-25 · Escala Wender Utah (TDAH retrospectivo en adultos)",
  meta: { text: `${wurs25Data.description} Enunciado: “${wurs25Data.prefix}”`, battery: "TDAH · Adultos", diagnosis_type: "TDAH", respondent: "paciente", age_range: "18 años o más", authors: wurs25Data.authors, source: "DTEP" },
  questions: wurs25Data.items.map((it) => ({
    content: `De pequeño yo era, tenía o estaba: ${it.text.charAt(0).toLowerCase()}${it.text.slice(1)}`,
    category: wurs25Data.subscales[it.factor]?.name ?? null,
    tags: ["wurs25", it.factor],
    options: { type: "likert", choices: wurs25Data.options.map((o) => ({ text: o.label, score: o.points })) },
  })),
  rules: [
    [0, 27, 18, 99, "Sin antecedentes infantiles significativos (WURS menor a 28)", ["No sugiere TDAH en la infancia."]],
    [28, 31, 18, 99, "Rango límite (WURS 28 a 31)", ["Sospecha de síntomas infantiles; complementar con DIVA 5.0."]],
    [32, 100, 18, 99, "Antecedentes compatibles con TDAH (WURS 32 o más)", ["Aplicar entrevista diagnóstica DIVA 5.0 y recoger información de terceros."]],
  ],
});

// ── Conners 4 · Padres (6 a 18) ─────────────────────────────────
add({
  n: 5,
  key: "conners4",
  title: "Conners 4 · Escala para padres (6 a 18 años)",
  meta: {
    text: conners4Data.description + " Cortes sobre puntaje bruto aproximados de DTEP; no reemplazan los baremos T oficiales.",
    battery: "TDAH · Niños y adolescentes",
    diagnosis_type: "TDAH",
    respondent: "cuidador",
    age_range: "6 a 18 años",
    authors: conners4Data.authors,
    source: "DTEP",
  },
  questions: conners4Data.items.map((it) => ({
    content: it.text,
    category: conners4Data.subscales[it.subscale]?.shortName ?? null,
    tags: ["conners4", it.subscale],
    options: { type: "likert", choices: conners4Data.options.map((o) => ({ text: o.label.replace(/^\d+ = /, ""), score: o.value })) },
  })),
  rules: [
    [0, 34, 6, 18, "Promedio para la edad (Conners 4, bruto 0 a 34)", ["Conducta dentro de lo esperado en casa."]],
    [35, 44, 6, 18, "Rango límite (Conners 4, bruto 35 a 44)", ["Seguimiento; pedir escala del docente para contrastar entornos."]],
    [45, 59, 6, 18, "Elevado (Conners 4, bruto 45 a 59)", ["Evaluación de TDAH con entrevista clínica y pruebas de atención (D2-R, Stroop)."]],
    [60, 129, 6, 18, "Muy elevado (Conners 4, bruto 60 o más)", ["Evaluación prioritaria de TDAH y problemas asociados de conducta."]],
  ],
});

// ── CARS-2 (observación del especialista) ───────────────────────
// Admite medios puntos (1 a 4 de 0.5 en 0.5) y attempt_answers guarda enteros:
// se almacena el doble. Total interno 30 a 120 = CARS-2 15 a 60.
add({
  n: 6,
  key: "cars2",
  title: "CARS-2 · Escala de valoración del autismo infantil (observación clínica)",
  meta: {
    text: cars2Data.description + " La completa el especialista tras observar al niño. Puntaje interno = puntaje CARS-2 × 2 (para admitir medios puntos).",
    battery: "TEA · Primera infancia",
    diagnosis_type: "TEA",
    respondent: "especialista",
    age_range: "2 años o más",
    authors: cars2Data.authors,
    source: "DTEP",
    score_multiplier: 2,
  },
  questions: cars2Data.items.map((it) => ({
    content: `${it.id}. ${it.name}: ${it.description}`,
    category: it.shortName,
    tags: ["cars2", "observación"],
    options: {
      type: "single_choice",
      choices: cars2Data.ratingScale.map((r) => ({
        text: Number.isInteger(r.value) && it.rubrics?.[r.value] ? `${r.value}. ${it.rubrics[r.value]}` : r.label,
        score: Math.round(r.value * 2),
      })),
    },
  })),
  rules: [
    [30, 59, 2, 99, "Sin síntomas significativos de TEA (CARS-2 15 a 29.5)", ["Por debajo del punto de corte clínico."]],
    [60, 73, 2, 99, "TEA leve a moderado (CARS-2 30 a 36.5)", ["Integrar con historia del desarrollo y tamizajes previos.", "Plan de intervención temprana: lenguaje, terapia ocupacional e intervención conductual."]],
    [74, 120, 2, 99, "TEA severo (CARS-2 37 o más)", ["Intervención intensiva y coordinación con neuropediatría."]],
  ],
});

// ── SQL ─────────────────────────────────────────────────────────
const examId = (n) => `dddddddd-0000-0000-0000-${String(n).padStart(12, "0")}`;
let sql = `-- ================================================================
-- MENTALABS: baterías digitalizadas importadas desde DTEP (neuroeval-app)
-- Generado automáticamente; no editar a mano. Idempotente.
-- IDs fijos: exámenes dddddddd-…, preguntas md5('<clave>-<n>')::uuid.
-- ================================================================

`;
for (const e of exams) {
  const id = examId(e.n);
  sql += `-- ${e.title} (${e.questions.length} ítems)\n`;
  sql += `insert into public.exams (id, title, description, created_by, is_published)
values ('${id}', ${q(e.title)}, ${q(JSON.stringify(e.meta))}, null, true)
on conflict (id) do update set title = excluded.title, description = excluded.description, is_published = true;\n`;
  sql += `insert into public.questions (id, exam_id, order_index, content, options, category, tags) values\n`;
  sql += e.questions
    .map((qq, i) => `  (md5('${e.key}-${i + 1}')::uuid, '${id}', ${i}, ${q(qq.content)}, ${j(qq.options)}, ${q(qq.category)}, ${arr(qq.tags.filter(Boolean))})`)
    .join(",\n");
  sql += `\non conflict (id) do update set order_index = excluded.order_index, content = excluded.content, options = excluded.options, category = excluded.category, tags = excluded.tags;\n`;
  sql += `insert into public.diagnostic_rules (id, exam_id, name, min_score, max_score, min_age, max_age, subcategory, recommendations, is_active) values\n`;
  sql += e.rules
    .map(([min, max, amin, amax, label, recs], i) => `  (md5('${e.key}-rule-${i + 1}')::uuid, '${id}', ${q(label)}, ${min}, ${max}, ${amin}, ${amax}, ${q(label)}, ${j(recs)}, true)`)
    .join(",\n");
  sql += `\non conflict (id) do update set name = excluded.name, min_score = excluded.min_score, max_score = excluded.max_score, min_age = excluded.min_age, max_age = excluded.max_age, subcategory = excluded.subcategory, recommendations = excluded.recommendations, is_active = true;\n\n`;
}
writeFileSync(outFile, sql);
console.log(exams.map((e) => `${e.key}: ${e.questions.length} preguntas, ${e.rules.length} reglas`).join("\n"));

// ── --apply: sube lo mismo por la API, como admin (RLS lo permite) ──
// ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/import-dtep.mjs <dir> <out.sql> --apply
if (process.argv.includes("--apply")) {
  const { createClient } = await import("@supabase/supabase-js");
  const { createHash } = await import("node:crypto");
  const { readFileSync } = await import("node:fs");
  const env = Object.fromEntries(
    readFileSync(".env.local", "utf8")
      .split(/\r?\n/)
      .filter((l) => /^[A-Z_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
  );
  // Igual que md5('<clave>')::uuid en Postgres: el SQL y la API generan los mismos IDs.
  const md5uuid = (s) => {
    const h = createHash("md5").update(s, "utf8").digest("hex");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  };

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { error: authError } = await supabase.auth.signInWithPassword({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
  if (authError) throw new Error(`Login admin: ${authError.message}`);

  const must = ({ error }, what) => {
    if (error) throw new Error(`${what}: ${error.message}`);
  };
  for (const e of exams) {
    const id = examId(e.n);
    must(await supabase.from("exams").upsert({ id, title: e.title, description: JSON.stringify(e.meta), created_by: null, is_published: true }), `exam ${e.key}`);
    must(
      await supabase.from("questions").upsert(
        e.questions.map((qq, i) => ({ id: md5uuid(`${e.key}-${i + 1}`), exam_id: id, order_index: i, content: qq.content, options: qq.options, category: qq.category, tags: qq.tags.filter(Boolean) }))
      ),
      `questions ${e.key}`
    );
    must(
      await supabase.from("diagnostic_rules").upsert(
        e.rules.map(([min, max, amin, amax, label, recs], i) => ({
          id: md5uuid(`${e.key}-rule-${i + 1}`), exam_id: id, name: label, min_score: min, max_score: max, min_age: amin, max_age: amax, subcategory: label, recommendations: recs, is_active: true,
        }))
      ),
      `rules ${e.key}`
    );
    console.log(`✓ ${e.key} aplicado`);
  }
  await supabase.auth.signOut();
}
