import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "../../components/site/SiteHeader";
import { SiteFooter } from "../../components/site/SiteFooter";
import { MarketplaceDirectory } from "../../components/marketplace/MarketplaceDirectory";
import { getPublicSpecialists } from "../../lib/specialists";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Especialistas en salud mental",
  description:
    "Psicólogos, psiquiatras y terapeutas colegiados en Perú. Filtra por tema, edad y modalidad, mira su tarifa y agenda en línea.",
};

export default async function MarketplacePage() {
  const specialists = await getPublicSpecialists();

  return (
    <>
      <SiteHeader />
      <main id="contenido" className="pb-24 pt-28 lg:pt-36">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-10">
          <h1 className="max-w-3xl font-display text-[clamp(2.2rem,5vw,4rem)] font-bold leading-[1] tracking-[-0.04em]">
            Encuentra a quien pueda ayudarte
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            {specialists.length} especialistas colegiados. Tarifa, horarios y enfoque a la vista antes de agendar.
          </p>
          {/* useSearchParams necesita Suspense para que la página siga siendo estática. */}
          <Suspense fallback={<div className="mt-12 h-96 animate-pulse rounded-3xl bg-band" />}>
            <MarketplaceDirectory specialists={specialists} />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
