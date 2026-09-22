'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useTexte } from '@/lib/i18n/client';
import { GEMEINSAM } from './texte';

/*
 * Der Knopf zum Hochladen — in der Demo und in der Anwendung derselbe.
 *
 * Das Dateifeld selbst ist unsichtbar, aber da: Die Tastatur erreicht es,
 * und die Beschriftung daneben ist der Knopf. Das eingebaute Feld spricht die
 * Sprache des Browsers («Choose File») und nicht die der Seite.
 *
 * Hochgeladen wird gleich beim Auswählen; ein zweiter Knopf «Hochladen»
 * fragte nur nach, was die Auswahl schon gesagt hat.
 */
export function DateiKnopf({
  id,
  endpunkt,
  beschriftung,
}: {
  id: string;
  endpunkt: string;
  beschriftung: string;
}) {
  const t = useTexte(GEMEINSAM).upload;
  const router = useRouter();
  const eingabe = useRef<HTMLInputElement>(null);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function hochladen(datei: File) {
    setFehler(null);
    setLaeuft(true);
    const formular = new FormData();
    formular.set('datei', datei);
    try {
      const antwort = await fetch(endpunkt, { method: 'POST', body: formular });
      if (!antwort.ok) {
        const daten = (await antwort.json().catch(() => null)) as { fehler?: string } | null;
        setFehler(daten?.fehler ?? t.nichtMoeglich);
        return;
      }
      router.refresh();
    } catch {
      setFehler(t.unterbrochen);
    } finally {
      if (eingabe.current) eingabe.current.value = '';
      setLaeuft(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <input
          ref={eingabe}
          id={id}
          type="file"
          name="datei"
          accept=".pdf,.txt,.md,.markdown"
          disabled={laeuft}
          onChange={(e) => {
            const datei = e.target.files?.[0];
            if (datei) void hochladen(datei);
          }}
          className="datei-feld sr-only"
        />
        <label htmlFor={id} className="datei-knopf">
          <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 3v10M3 8h10"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
          {laeuft ? t.laeuft : beschriftung}
        </label>
      </div>

      {fehler !== null && (
        <p role="alert" className="text-tinte">
          {fehler}
        </p>
      )}
    </div>
  );
}
