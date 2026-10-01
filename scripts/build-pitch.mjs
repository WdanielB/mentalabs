// Genera versiones autónomas del pitch en docs/pitch/presentar/: un solo
// archivo .html por versión, con estilos, código, fuentes, logos y capturas
// incrustados. Se abre con doble clic, sin internet y desde cualquier PC o USB.
//
// Uso (desde la raíz del repo, con internet la primera vez para las fuentes):
//   node scripts/build-pitch.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const PITCH = path.join(ROOT, "docs", "pitch");
const OUT = path.join(PITCH, "presentar");
const FONT_CACHE = path.join(ROOT, "node_modules", ".cache", "pitch-fonts.css"); // se reutiliza si no hay internet

const DECKS = [
  ["inversion.html", "MentaLabs-inversionistas.html"],
  ["colegios.html", "MentaLabs-colegios.html"],
  ["familias.html", "MentaLabs-familias.html"],
];

const mime = { ".png": "image/png", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".webp": "image/webp" };
const imageCache = new Map();

/** Imagen local → data URI. Las capturas PNG se pasan a WebP (≈5× más livianas). */
async function dataUri(absPath) {
  if (imageCache.has(absPath)) return imageCache.get(absPath);
  const ext = path.extname(absPath).toLowerCase();
  let uri;
  if (ext === ".png" && absPath.includes("capturas")) {
    const buf = await sharp(absPath).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    uri = `data:image/webp;base64,${buf.toString("base64")}`;
  } else {
    uri = `data:${mime[ext] ?? "application/octet-stream"};base64,${readFileSync(absPath).toString("base64")}`;
  }
  imageCache.set(absPath, uri);
  return uri;
}

/** Fuentes de Google incrustadas (solo el subconjunto latin, que cubre tildes y ñ). */
async function embeddedFonts(cssUrl) {
  const cached = `${FONT_CACHE}.${createHash("sha1").update(cssUrl).digest("hex").slice(0, 10)}`;
  try {
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
    const css = await (await fetch(cssUrl, { headers: { "User-Agent": ua } })).text();
    const blocks = css.split(/(?=\/\* )/).filter((b) => b.startsWith("/* latin */"));
    let out = "";
    for (const block of blocks) {
      const url = block.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
      if (!url) continue;
      const woff2 = Buffer.from(await (await fetch(url)).arrayBuffer()).toString("base64");
      out += block.replace(url, `data:font/woff2;base64,${woff2}`) + "\n";
    }
    if (!out) throw new Error("sin bloques latin");
    writeFileSync(cached, out);
    return out;
  } catch (err) {
    if (existsSync(cached)) return readFileSync(cached, "utf8");
    console.warn(`  ⚠ Sin fuentes incrustadas (${err.message}); se usarán las del sistema.`);
    return "";
  }
}

mkdirSync(OUT, { recursive: true });
mkdirSync(path.dirname(FONT_CACHE), { recursive: true });
const css = readFileSync(path.join(PITCH, "deck.css"), "utf8");
const js = readFileSync(path.join(PITCH, "deck.js"), "utf8");

for (const [src, out] of DECKS) {
  let html = readFileSync(path.join(PITCH, src), "utf8");

  // Fuentes: el <link> de Google Fonts se reemplaza por @font-face incrustados.
  const fontHref = html.match(/<link href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)" rel="stylesheet">/)?.[1]?.replace(/&amp;/g, "&");
  const fonts = fontHref ? await embeddedFonts(fontHref) : "";
  html = html.replace(/<link rel="preconnect"[^>]*>\s*/g, "").replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/g, "");

  // Estilos y código compartidos, en línea.
  html = html.replace('<link rel="stylesheet" href="deck.css">', () => `<style>\n${fonts}\n${css}\n</style>`);
  html = html.replace('<script src="deck.js"></script>', () => `<script>\n${js}\n</script>`);

  // Imágenes: logos (src="logos/...") y capturas (url(../storytelling/...)).
  const refs = new Set([
    ...[...html.matchAll(/src="((?:logos|\.\.\/storytelling)\/[^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/url\(((?:logos|\.\.\/storytelling)\/[^)]+)\)/g)].map((m) => m[1]),
  ]);
  for (const ref of refs) {
    const uri = await dataUri(path.join(PITCH, ref));
    html = html.split(ref).join(uri);
  }

  const leftovers = html.match(/(?:src|href)="(?!data:|#|https?:)[^"]+"|url\((?!data:|["']?#)[^)]+\)/g) ?? [];
  writeFileSync(path.join(OUT, out), html);
  const mb = (Buffer.byteLength(html) / 1048576).toFixed(1);
  console.log(`✓ ${out} (${mb} MB)${leftovers.length ? `  ⚠ referencias externas: ${leftovers.join(", ")}` : ""}`);
}
