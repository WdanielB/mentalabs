import type { Metadata, Viewport } from 'next';
import { Lexend, Bricolage_Grotesque } from 'next/font/google';
import './globals.css';

// Lexend: diseñada para reducir el estrés visual en la lectura; importa para
// un público con TDAH o dislexia. Bricolage: titulares con carácter.
const lexend = Lexend({ subsets: ['latin'], variable: '--font-body-family', weight: ['300', '400', '500', '600', '700'], display: 'swap' });
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display-family', weight: ['400', '500', '600', '700', '800'], display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'MentaLabs · Psicólogos y evaluación de TDAH, TEA y ansiedad en Perú',
    template: '%s · MentaLabs',
  },
  description:
    'Encuentra psicólogos, psiquiatras y terapeutas colegiados en Perú. Evaluaciones, citas y seguimiento clínico en un solo lugar para familias y profesionales.',
  openGraph: { type: 'website', locale: 'es_PE', siteName: 'MentaLabs' },
};

export const viewport: Viewport = {
  themeColor: '#f8f5f1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-PE" className={`${lexend.variable} ${bricolage.variable}`} suppressHydrationWarning>
      <head>
        {/* Marca "js" antes del primer pintado: las animaciones de entrada solo ocultan contenido si hay JS. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
