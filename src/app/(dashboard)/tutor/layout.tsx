"use client";

import { BarChart3, Calendar, Gamepad2, Home, Search, Users } from "lucide-react";
import { DashboardShell, type NavSection } from "../../../components/dashboard/DashboardShell";
import { ChildSwitcher } from "../../../components/family/ChildSwitcher";
import { FamilyProvider } from "../../../lib/family/FamilyContext";

const SECTIONS: NavSection[] = [
  {
    label: "Mi familia",
    items: [
      { icon: Home, label: "Resumen del hijo", href: "/tutor" },
      { icon: Users, label: "Perfiles de la familia", href: "/tutor/familia" },
      { icon: Gamepad2, label: "Juegos", href: "/tutor/juegos" },
      { icon: Calendar, label: "Agenda", href: "/tutor/agenda" },
      { icon: BarChart3, label: "Reportes", href: "/tutor/reportes" },
      { icon: Search, label: "Buscar especialista", href: "/marketplace" },
    ],
  },
];

export default function TutorLayout({ children }: { children: React.ReactNode }) {
  return (
    <FamilyProvider>
      <DashboardShell
        portal="Portal familiar"
        homeHref="/tutor"
        fallbackName="Tutor"
        sections={SECTIONS}
        sidebarTop={<ChildSwitcher />}
      >
        {children}
      </DashboardShell>
    </FamilyProvider>
  );
}
