import Link from "next/link";

/** Marca: dos arcos que se tocan (dos personas, dos hemisferios) y un punto ají. */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" className="fill-brand" />
      <path
        d="M8 23v-7.5a4 4 0 0 1 8 0V23M16 15.5a4 4 0 0 1 8 0V23"
        fill="none"
        stroke="var(--color-surface)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="24.2" cy="8.6" r="2.3" className="fill-aji" />
    </svg>
  );
}

export function Logo({ href = "/", tone = "ink" }: { href?: string; tone?: "ink" | "light" }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5 rounded-lg" aria-label="MentaLabs, inicio">
      <LogoMark className="h-8 w-8 transition-transform duration-300 ease-out-quart group-hover:-rotate-6" />
      <span
        className={`font-display text-[1.15rem] font-bold tracking-[-0.03em] ${tone === "light" ? "text-surface" : "text-ink"}`}
      >
        Menta<span className="font-medium opacity-70">Labs</span>
      </span>
    </Link>
  );
}
