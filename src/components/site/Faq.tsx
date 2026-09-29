"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <ul className="divide-y divide-line border-y border-line">
      {items.map(({ q, a }, i) => {
        const isOpen = open === i;
        const panelId = `${baseId}-panel-${i}`;
        return (
          <li key={q}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-6 py-6 text-left font-display text-lg font-semibold tracking-tight text-ink sm:text-xl"
              >
                {q}
                <Plus
                  className={`h-5 w-5 shrink-0 text-brand transition-transform duration-300 ease-out-quart ${isOpen ? "rotate-45" : ""}`}
                  aria-hidden="true"
                />
              </button>
            </h3>
            <div id={panelId} role="region" className="collapse-rows" data-open={isOpen}>
              <div>
                <p className="max-w-[62ch] pb-7 leading-relaxed text-muted">{a}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
