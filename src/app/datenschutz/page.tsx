import type { Metadata } from 'next';
import { Textseite } from '../_teile/textseite';
import { env } from '@/lib/config/env';
import { sprache } from '@/lib/i18n/server';
import type { Sprache } from '@/lib/i18n/sprachen';
import { DatenschutzDe } from './de';
import { DatenschutzEn } from './en';
import { DatenschutzFr } from './fr';
import { DatenschutzIt } from './it';

const TITEL: Record<Sprache, string> = {
  de: 'Datenschutz',
  fr: 'Protection des données',
  it: 'Protezione dei dati',
  en: 'Privacy',
};

const STAND: Record<Sprache, string> = {
  de: '22. September 2026',
  fr: '22 septembre 2026',
  it: '22 settembre 2026',
  en: '22 September 2026',
};

const INHALT: Record<Sprache, (eigenschaften: { live: boolean }) => React.ReactNode> = {
  de: DatenschutzDe,
  fr: DatenschutzFr,
  it: DatenschutzIt,
  en: DatenschutzEn,
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: `${TITEL[await sprache()]} – Evidarium` };
}

export const dynamic = 'force-dynamic';

/*
 * Datenschutzerklärung nach Art. 19 DSG: wer, was, wozu, an wen, wie lange.
 *
 * **Sie beschreibt, was der Code tatsächlich tut** — jede Zahl hier steht
 * auch im Code. Ändert sich eine Frist dort, muss sie sich hier ändern;
 * darum kommen die Werte, wo es geht, aus denselben Konstanten.
 *
 * Vier Fassungen, je eine Datei: Rechtstext liest sich am Stück, und
 * zusammen lägen die vier über der Grenze von 400 Zeilen. Massgebend ist
 * die deutsche; die übrigen sagen das oben (`Textseite`).
 *
 * Der Abschnitt über Anthropic erscheint nur im Live-Modus. Im Demo-Modus
 * geht nichts an eine Schnittstelle, und eine Erklärung, die eine
 * Übermittlung beschreibt, die gar nicht stattfindet, wäre falsch.
 */
export default async function DatenschutzPage() {
  const s = await sprache();
  const Inhalt = INHALT[s];
  return (
    <Textseite titel={TITEL[s]} stand={STAND[s]}>
      <Inhalt live={env.AI_MODE === 'live'} />
    </Textseite>
  );
}
