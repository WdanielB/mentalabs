import Link from "next/link";
import { Logo } from "./Logo";

const COLUMNS = [
  {
    title: "Para familias",
    links: [
      { label: "Buscar especialista", href: "/marketplace" },
      { label: "Cómo funciona", href: "/#como-funciona" },
      { label: "Preguntas frecuentes", href: "/#preguntas" },
    ],
  },
  {
    title: "Para profesionales",
    links: [
      { label: "Unirme como especialista", href: "/registro" },
      { label: "Herramientas clínicas", href: "/#profesionales" },
      { label: "Studio de evaluaciones", href: "/studio" },
    ],
  },
  {
    title: "Cuenta",
    links: [
      { label: "Ingresar", href: "/login" },
      { label: "Crear cuenta", href: "/registro" },
      { label: "Recuperar contraseña", href: "/recuperar" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-ink text-surface/80">
      <div className="mx-auto max-w-[1240px] px-4 pb-10 pt-16 sm:px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div className="max-w-sm">
            <Logo tone="light" />
            <p className="mt-5 text-sm leading-relaxed text-surface/60">
              Hecho en Perú para acercar la evaluación y el acompañamiento en salud mental a más familias.
            </p>
            <p className="mt-6 rounded-xl border border-surface/15 p-4 text-sm leading-relaxed text-surface/75">
              <strong className="font-medium text-surface">¿Estás en crisis?</strong> Llama gratis a la Línea 113, opción 5
              (salud mental, MINSA), disponible las 24 horas.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map(({ title, links }) => (
              <div key={title}>
                <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-surface/45">{title}</h2>
                <ul className="mt-4 space-y-3">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <Link href={href} className="text-sm text-surface/80 transition-colors hover:text-aji">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-surface/10 pt-6 text-xs text-surface/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MentaLabs. MentaLabs no reemplaza la atención de emergencia.</p>
          <div className="flex gap-5">
            <Link href="#" className="hover:text-surface">Privacidad</Link>
            <Link href="#" className="hover:text-surface">Términos</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
