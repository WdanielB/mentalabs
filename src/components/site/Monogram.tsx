import { initials } from "../../lib/format";

// Sin foto todavía: bloque tipográfico con color estable por especialista.
const TONES = [
  "bg-brand text-surface",
  "bg-aji text-ink",
  "bg-accent text-surface",
  "bg-brand-deep text-surface",
  "bg-brand-soft text-brand-strong",
  "bg-band text-ink",
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Monogram({ id, name, className = "h-14 w-14 text-lg" }: { id: string; name: string; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-2xl font-display font-bold tracking-tight ${TONES[hash(id) % TONES.length]} ${className}`}
    >
      {initials(name)}
    </div>
  );
}
