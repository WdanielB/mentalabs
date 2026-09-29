import { redirect } from "next/navigation";

// Reemplazada por /tutor/familia (una sola cuenta gestiona a los hijos).
export default function TutorPacientesPage() {
  redirect("/tutor/familia");
}
