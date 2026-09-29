"use client";

import { BarChart3, Calendar, ClipboardList, Clock, Home, Users } from "lucide-react";
import { DashboardShell, type NavSection } from "../../../components/dashboard/DashboardShell";

const SECTIONS: NavSection[] = [
  {
    label: "Consulta",
    items: [
      { icon: Home, label: "Inicio", href: "/especialista" },
      { icon: Users, label: "Mis pacientes", href: "/especialista/pacientes" },
      { icon: Calendar, label: "Agenda", href: "/especialista/agenda" },
      { icon: Clock, label: "Mi horario", href: "/especialista/horarios" },
    ],
  },
  {
    label: "Evaluación",
    items: [
      { icon: ClipboardList, label: "Biblioteca de pruebas", href: "/especialista/examenes" },
      { icon: BarChart3, label: "Reportes", href: "/especialista/reportes" },
    ],
  },
];

export default function EspecialistaLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell portal="Panel del especialista" homeHref="/especialista" fallbackName="Especialista" sections={SECTIONS}>
      {children}
    </DashboardShell>
  );
}
