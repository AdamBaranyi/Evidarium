'use client';

import { useLayoutEffect, useRef } from 'react';
import { useTexte } from '@/lib/i18n/client';
import { CHAT } from './texte';

/*
 * Das Eingabefeld des Chats.
 *
 * Es wächst mit dem Text bis zu einer Höhe und rollt dann selbst. Enter
 * sendet, Umschalt+Enter macht eine neue Zeile — ausser am Telefon: Dort
 * ist die Eingabetaste der einzige Weg zu einem Zeilenumbruch, gesendet
 * wird mit dem Knopf.
 *
 * Während eine Eingabehilfe für asiatische Schriften noch Zeichen
 * zusammensetzt (`isComposing`), bestätigt Enter das Zeichen und sendet
 * nicht.
 */

const GRENZE = 2000;

/** Die Kennung des Textfelds. Der Chat setzt darüber den Fokus zurück. */
export const EINGABE_ID = 'frage';

export type EingabeEigenschaften = {
  text: string;
  setText: (text: string) => void;
  senden: () => void;
  laeuft: boolean;
  /** Es gibt gerade nichts zu durchsuchen, etwa weil nichts gewählt ist. */
  gesperrt: boolean;
  beschriftung: string;
  platzhalter: string;
  /** Was durchsucht wird, als kurze Zeile unter dem Text. */
  umfang: string;
};

export function Eingabe({
  text,
  setText,
  senden,
  laeuft,
  gesperrt,
  beschriftung,
  platzhalter,
  umfang,
}: EingabeEigenschaften) {
  const t = useTexte(CHAT).eingabe;
  const feld = useRef<HTMLTextAreaElement>(null);
  const leer = text.trim() === '';
  const bereit = !leer && !laeuft && !gesperrt;
  const rest = GRENZE - text.length;

  // Höhe nach dem Inhalt, vor dem Zeichnen — sonst springt das Feld sichtbar.
  useLayoutEffect(() => {
    const element = feld.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  }, [text]);

  function taste(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    e.preventDefault();
    if (bereit) senden();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (bereit) senden();
      }}
      className="eingabe"
      data-rundgang="eingabe"
    >
      <label htmlFor={EINGABE_ID} className="sr-only">
        {beschriftung}
      </label>
      <textarea
        id={EINGABE_ID}
        name="frage"
        ref={feld}
        rows={1}
        maxLength={GRENZE}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={taste}
        placeholder={platzhalter}
        aria-describedby="frage-umfang"
      />

      <div className="eingabe-leiste">
        <span id="frage-umfang" className="eingabe-umfang">
          {umfang}
          {rest < 200 && t.rest(rest)}
        </span>
        <span className="eingabe-tastatur">{t.enter}</span>
        <button
          type="submit"
          disabled={!bereit}
          aria-label={laeuft ? t.laeuft : t.senden}
          className="senden"
        >
          <svg aria-hidden width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M9 14.5V3.5M9 3.5L4 8.5M9 3.5l5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}
