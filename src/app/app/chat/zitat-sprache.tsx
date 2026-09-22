'use client';

import { createContext, useContext } from 'react';

/*
 * **In welcher Sprache ein Zitat steht** — für WCAG 3.1.2: Ein deutsches
 * Zitat auf einer englischen Seite soll ein Screenreader deutsch vorlesen.
 *
 * Bekannt ist die Sprache nur bei den Dokumenten des Demo-Korpus; sie sind
 * deutsch. Bei hochgeladenen Dokumenten weiss Evidarium es nicht und
 * behauptet darum nichts — ein falsches `lang` wäre schlechter als keines.
 */
export const ZitatSprache = createContext<(documentId: string) => string | undefined>(
  () => undefined,
);

export function useZitatSprache(documentId: string | undefined): string | undefined {
  const sprache = useContext(ZitatSprache);
  return documentId === undefined ? undefined : sprache(documentId);
}
