/**
 * Die zwei Fälle, die die Startseite vorführt.
 *
 * Erst der einfache: eine Frage, eine Antwort, ein Beleg. Dann der, auf den
 * es ankommt: Zwei Dokumente widersprechen sich, und Evidarium löst den
 * Widerspruch **nicht** auf, sondern zeigt beide Seiten mit je eigener
 * Quelle. Das ist der Unterschied zu allem, was flüssig antwortet.
 *
 * Alle Sätze stammen aus dem erfundenen Korpus, gegen den die Evaluation
 * läuft — nichts hier ist fürs Schaufenster geschrieben.
 */

export type Blatt = {
  datei: string;
  seite: number;
  vor: string;
  zitat: string;
  nach: string;
};

/*
 * Frage, Urteil und Aussage stehen in den Textkatalogen (`texte.ts`), in der
 * Reihenfolge dieser Szenen. Hier steht, was in jeder Sprache gleich ist —
 * auch die Zitate: Sie sind wörtlich aus den deutschen Dokumenten.
 */
export type Szene = {
  /** Welche Dokumente für diese Antwort zählten — für die Seitenleiste. */
  benutzt: string[];
  /** Dauer des Modellaufrufs, wie gemessen. */
  modellDauer: string;
  /** Die Kategorie, wie die Anwendung sie liefert. Das Licht im Hintergrund folgt ihr. */
  kategorie: 'belegt' | 'widerspruch';
  farbe: string;
  blaetter: Blatt[];
};

export const SZENEN: Szene[] = [
  {
    benutzt: ['Teamhandbuch.pdf'],
    modellDauer: '2.4 s',
    kategorie: 'belegt',
    farbe: 'var(--urteil-belegt)',
    blaetter: [
      {
        datei: 'Teamhandbuch.pdf',
        seite: 2,
        vor: 'Die ersten beiden Wochen sind als Einarbeitung geplant. ',
        zitat: 'Beim Onboarding hilft Mara Keller.',
        nach: ' Zugaenge werden vor dem ersten Arbeitstag vorbereitet.',
      },
    ],
  },
  {
    benutzt: ['Backup_Richtlinie_A.pdf', 'Backup_Richtlinie_B.pdf'],
    modellDauer: '3.0 s',
    kategorie: 'widerspruch',
    farbe: 'var(--urteil-widerspruch)',
    blaetter: [
      {
        datei: 'Backup_Richtlinie_A.pdf',
        seite: 2,
        vor: '',
        zitat: 'Sicherungen werden 30 Tage aufbewahrt.',
        nach: ' Nach Ablauf der Frist werden die Daten geloescht.',
      },
      {
        datei: 'Backup_Richtlinie_B.pdf',
        seite: 2,
        vor: '',
        zitat: 'Sicherungen werden 90 Tage aufbewahrt.',
        nach: ' Nach Ablauf der Frist werden die Daten geloescht.',
      },
    ],
  },
];

/** Der Korpus in der Seitenleiste des Fensters — dieselben sechs Dokumente. */
export const KORPUS = [
  'Teamhandbuch.pdf',
  'Supportprozess.pdf',
  'Backup_Richtlinie_A.pdf',
  'Backup_Richtlinie_B.pdf',
  'Projekt_Atlas.md',
  'Besprechungsnotiz.txt',
] as const;

/** Die Marken einer Szene in Millisekunden, von ihrem Beginn an. */
export const TAKT = {
  frage: 300,
  schritt: [900, 1300, 1700, 4600] as const,
  fertig: [1300, 1700, 4600, 5000] as const,
  urteil: 5300,
  blatt: 5550,
  markierung: 6200,
  verblassen: 12600,
  ende: 13200,
};
