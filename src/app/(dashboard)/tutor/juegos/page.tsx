"use client";

import Link from "next/link";
import { useFamily } from "../../../../lib/family/FamilyContext";
import { GamesHub } from "../../../../components/games/GamesHub";
import { firstName } from "../../../../lib/format";

export default function TutorJuegosPage() {
  const { active, loading } = useFamily();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 lg:py-12">
      <h1 className="font-display text-[2rem] font-bold tracking-[-0.03em]">
        Juegos{active ? ` para ${firstName(active.full_name)}` : ""}
      </h1>
      <p className="mt-2 max-w-2xl text-muted">
        Pruebas de atención y planificación en forma de juego. Pásale la tablet o la computadora y deja que juegue en un lugar tranquilo.
      </p>
      <div className="mt-8">
        {loading ? (
          <div className="h-64 animate-pulse rounded-3xl bg-band" />
        ) : active ? (
          <GamesHub key={active.id} patientId={active.id} patientName={active.full_name} />
        ) : (
          <Link href="/tutor/familia" className="text-brand underline">Registra primero a tu hijo o hija</Link>
        )}
      </div>
    </div>
  );
}
