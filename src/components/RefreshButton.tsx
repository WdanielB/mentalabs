"use client";

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  action: () => Promise<void>;
  label?: string;
  className?: string;
}

export default function RefreshButton({ action, label = 'Actualizar', className }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await action();
          router.refresh();
        })
      }
      disabled={isPending}
      className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className ?? ''}`}
    >
      <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
      {isPending ? 'Actualizando...' : label}
    </button>
  );
}
