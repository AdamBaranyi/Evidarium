'use client';

import './globals.css';

/*
 * Letzte Rückfallebene: ein Fehler im Wurzellayout selbst.
 *
 * Hier gibt es kein Layout mehr, darum eigenes `html` und `body`. Absichtlich
 * ohne Abhängigkeiten auf andere Bauteile — was hier landet, ist schon einmal
 * an genau solchen gescheitert. Auch die Sprache ist hier unbekannt; darum
 * stehen Deutsch und Englisch untereinander, jede Zeile mit ihrem `lang`.
 */
export default function GlobalerFehler({ reset }: { reset: () => void }) {
  return (
    <html lang="de-CH">
      <body>
        <main
          id="inhalt"
          className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center gap-6 px-6 py-16"
        >
          <p className="wortmarke">Evidarium</p>
          <h1 className="text-xl leading-[var(--line-title)]">
            Evidarium ist gerade nicht erreichbar.
          </h1>
          <p className="text-tinte-leise">
            Der Fehler ist protokolliert. Bitte später noch einmal.
          </p>
          <p lang="en" className="text-tinte-leise">
            Evidarium is currently unavailable. The error has been logged; please try again later.
          </p>
          <button
            type="button"
            onClick={reset}
            className="min-h-11 self-start bg-aktion-grund px-5 py-2 text-aktion-tinte"
          >
            Noch einmal versuchen / <span lang="en">Try again</span>
          </button>
        </main>
      </body>
    </html>
  );
}
