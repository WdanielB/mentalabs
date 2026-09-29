import { Logo } from "../../components/site/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-brand-deep p-12 text-surface lg:flex lg:flex-col">
        <Logo tone="light" />
        <div className="mt-auto max-w-md">
          <p className="font-display text-[2.1rem] font-semibold leading-[1.12] tracking-[-0.03em]">
            Evaluaciones, citas y seguimiento en un mismo historial.
          </p>
          <p className="mt-6 text-sm leading-relaxed text-surface/60">
            Tu sesión se protege con tokens firmados que se renuevan solos. En equipos compartidos, desmarca “Mantener sesión”.
          </p>
        </div>
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/60" aria-hidden="true" />
        <div className="absolute right-20 top-40 h-5 w-5 rounded-full bg-aji" aria-hidden="true" />
      </aside>

      <main id="contenido" className="flex flex-col px-4 py-8 sm:px-10 lg:px-16">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-[26rem] flex-1 flex-col justify-center py-10">{children}</div>
      </main>
    </div>
  );
}
