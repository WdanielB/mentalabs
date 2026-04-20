import type { Metadata } from 'next';
import { Lexend } from 'next/font/google';
import './globals.css';

const lexend = Lexend({ subsets: ['latin'] });

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
      <body className={`${lexend.className} antialiased selection:bg-[#0bda5e] selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
