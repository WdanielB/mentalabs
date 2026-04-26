import type { Metadata } from 'next';
import { Lexend, Bricolage_Grotesque } from 'next/font/google';
import './globals.css';

const lexend = Lexend({ subsets: ['latin'], variable: '--font-body', weight: ['300','400','500','600','700'] });
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', weight: ['400','500','600','700','800'] });

export const metadata: Metadata = {
  title: 'MentaLabs - Plataforma de Diagnóstico de Neurodivergencia',
  description: 'Aceleramos diagnósticos, transformamos vidas. Conectamos familias con especialistas.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="light">
      <body className={`${lexend.variable} ${bricolage.variable} font-body antialiased selection:bg-[#0bda5e] selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
