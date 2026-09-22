'use client';

import Link from 'next/link';
import type { ProjektZeile } from '@/lib/projekte/grenzen';

/*
 * Die Projekte in der Seitenspalte des Chats — als Links, nicht als
 * Schalter: Ein Projekt ist ein Ort. Die Adresse (`?projekt=…`) hält fest,
 * wo man ist, auch nach dem Neuladen, und ein Wechsel beginnt eine neue
 * Unterhaltung. Gespeichert wird keine (E40).
 *
 * Gezählt werden die Dokumente, die durchsucht werden können — nicht die,
 * die noch in der Verarbeitung stecken.
 */
export function ProjektWahl({
  projekte,
  aktiv,
  gesamt,
}: {
  projekte: ProjektZeile[];
  aktiv: string | null;
  gesamt: number;
}) {
  return (
    <nav aria-labelledby="projekte-wahl" className="flex flex-col gap-1">
      <h2 id="projekte-wahl">Projekte</h2>
      <ul className="flex flex-col">
        <li>
          <Eintrag href="/app/chat" name="Alle Dokumente" anzahl={gesamt} aktiv={aktiv === null} />
        </li>
        {projekte.map((projekt) => (
          <li key={projekt.id}>
            <Eintrag
              href={`/app/chat?projekt=${projekt.id}`}
              name={projekt.name}
              anzahl={projekt.anzahl}
              aktiv={aktiv === projekt.id}
            />
          </li>
        ))}
      </ul>
      <Link href="/app/documents" className="min-h-11 content-center underline underline-offset-4">
        Projekte verwalten
      </Link>
    </nav>
  );
}

function Eintrag({
  href,
  name,
  anzahl,
  aktiv,
}: {
  href: string;
  name: string;
  anzahl: number;
  aktiv: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={aktiv ? 'page' : undefined}
      className={`projekt-link ${aktiv ? 'ist-aktiv' : ''}`}
    >
      <span className="min-w-0 flex-1">{name}</span>
      <span className="text-tinte-leise">
        {anzahl}
        <span className="sr-only"> {anzahl === 1 ? 'Dokument' : 'Dokumente'}</span>
      </span>
    </Link>
  );
}
