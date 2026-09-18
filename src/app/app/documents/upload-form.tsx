'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { GRENZEN } from '@/lib/documents/grenzen';

/*
 * Der Upload antwortet mit 202: angenommen, Verarbeitung läuft. Die Liste
 * wird danach neu geladen — der neue Eintrag erscheint mit «Wartet auf
 * Verarbeitung» und wechselt von selbst weiter.
 */
export function UploadForm() {
  const router = useRouter();
  const eingabe = useRef<HTMLInputElement>(null);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function senden(formular: FormData) {
    setFehler(null);
    setLaeuft(true);
    try {
      const antwort = await fetch('/api/documents', { method: 'POST', body: formular });
      if (!antwort.ok) {
        const daten = (await antwort.json()) as { fehler?: string };
        setFehler(daten.fehler ?? 'Upload nicht möglich.');
        return;
      }
      if (eingabe.current) eingabe.current.value = '';
      router.refresh();
    } catch {
      setFehler('Die Verbindung wurde unterbrochen. Bitte noch einmal versuchen.');
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <form action={senden} className="flex flex-col gap-3 border border-kante bg-flaeche-hoch p-4">
      <label className="flex flex-col gap-2">
        <span>Dokument hinzufügen</span>
        <input
          ref={eingabe}
          type="file"
          name="datei"
          required
          accept=".pdf,.txt,.md,.markdown"
          className="text-base"
        />
      </label>

      <p className="text-tinte-leise">
        PDF mit Textschicht, TXT oder Markdown. Höchstens {GRENZEN.maxBytes / 1024 / 1024} MiB und{' '}
        {GRENZEN.maxSeiten} Seiten.
      </p>

      {fehler !== null && (
        <p role="alert" className="text-tinte">
          {fehler}
        </p>
      )}

      <button
        type="submit"
        disabled={laeuft}
        className="min-h-11 self-start bg-aktion-grund px-5 py-2 text-aktion-tinte disabled:opacity-60"
      >
        {laeuft ? 'Wird übertragen …' : 'Hochladen'}
      </button>
    </form>
  );
}
