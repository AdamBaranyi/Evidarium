import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Evidarium',
  description: 'Antworten aus deinen Dokumenten – mit Quellen, die du nachlesen kannst.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de-CH">
      {/* Browser-Erweiterungen setzen Attribute am body, bevor React lädt. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
