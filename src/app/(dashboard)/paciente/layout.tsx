"use client";

import { BarChart3, BookOpen, Calendar, ClipboardList, Gamepad2, Home, Search } from "lucide-react";
import { DashboardShell, type NavSection } from "../../../components/dashboard/DashboardShell";

const SECTIONS: NavSection[] = [
  {
    label: "Mi portal",
    items: [
      { icon: Home, label: "Inicio", href: "/paciente" },
      { icon: ClipboardList, label: "Mis evaluaciones", href: "/paciente/examenes" },
      { icon: BarChart3, label: "Mis resultados", href: "/paciente/resultados" },
      { icon: Calendar, label: "Mis citas", href: "/paciente/citas" },
    ],
  },
  {
    label: "Herramientas",
    items: [
      { icon: BookOpen, label: "Mi diario", href: "/paciente/diario" },
      { icon: Gamepad2, label: "Juegos de atención", href: "/paciente/juegos" },
      { icon: Search, label: "Buscar especialista", href: "/marketplace" },
    ],
  },
];

export default function PacienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell portal="Portal del paciente" homeHref="/paciente" fallbackName="Paciente" sections={SECTIONS}>
      {children}
    </DashboardShell>
  );
}
