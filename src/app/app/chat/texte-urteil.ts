import { texte } from '@/lib/i18n/texte';

/*
 * Schritte, Urteile und Fundorte — die Wörter, mit denen Evidarium über
 * eine Antwort spricht. Der Chat braucht sie, die Vorführung auf der
 * Startseite ebenso; darum stehen sie für sich.
 */
export const URTEIL = texte({
  de: {
    phasen: {
      einbetten: 'Frage wird eingebettet',
      suchen: 'Dokumente werden durchsucht',
      antworten: 'Modell formuliert die Antwort',
      pruefen: 'Belege werden geprüft',
    },
    urteil: {
      belegt: 'Belegt',
      teilweise_belegt: 'Teilweise belegt',
      keine_grundlage: 'Keine Grundlage in den Dokumenten',
      widerspruch: 'Widerspruch zwischen Quellen',
    },
    urteilKurz: {
      belegt: 'Belegt',
      teilweise_belegt: 'Teilweise belegt',
      keine_grundlage: 'Keine Grundlage',
      widerspruch: 'Widerspruch',
    },
    urteilErklaerung: {
      belegt: 'Jede Aussage trägt ein wörtliches Zitat aus deinen Dokumenten.',
      teilweise_belegt: 'Die Dokumente decken die Frage nur zum Teil ab.',
      keine_grundlage: 'Die Dokumente beantworten diese Frage nicht.',
      widerspruch: 'Zwei Stellen sagen Verschiedenes. Beide stehen unten, unaufgelöst.',
    },
    herkunft: {
      seite: (n: number) => `S. ${n}`,
      zeile: (n: number) => `Zeile ${n}`,
      zeilen: (von: number, bis: number) => `Zeilen ${von}–${bis}`,
    },
  },
  fr: {
    phasen: {
      einbetten: 'Vectorisation de la question',
      suchen: 'Recherche dans les documents',
      antworten: 'Le modèle rédige la réponse',
      pruefen: 'Vérification des citations',
    },
    urteil: {
      belegt: 'Étayé',
      teilweise_belegt: 'Partiellement étayé',
      keine_grundlage: 'Aucune base dans les documents',
      widerspruch: 'Contradiction entre les sources',
    },
    urteilKurz: {
      belegt: 'Étayé',
      teilweise_belegt: 'Partiellement étayé',
      keine_grundlage: 'Aucune base',
      widerspruch: 'Contradiction',
    },
    urteilErklaerung: {
      belegt: 'Chaque affirmation porte une citation littérale de vos documents.',
      teilweise_belegt: 'Les documents ne couvrent la question qu’en partie.',
      keine_grundlage: 'Les documents ne répondent pas à cette question.',
      widerspruch:
        'Deux passages disent autre chose. Les deux figurent ci-dessous, sans arbitrage.',
    },
    herkunft: {
      seite: (n: number) => `p. ${n}`,
      zeile: (n: number) => `ligne ${n}`,
      zeilen: (von: number, bis: number) => `lignes ${von}–${bis}`,
    },
  },
  it: {
    phasen: {
      einbetten: 'Vettorializzazione della domanda',
      suchen: 'Ricerca nei documenti',
      antworten: 'Il modello formula la risposta',
      pruefen: 'Verifica delle citazioni',
    },
    urteil: {
      belegt: 'Documentato',
      teilweise_belegt: 'Parzialmente documentato',
      keine_grundlage: 'Nessuna base nei documenti',
      widerspruch: 'Contraddizione tra le fonti',
    },
    urteilKurz: {
      belegt: 'Documentato',
      teilweise_belegt: 'Parzialmente documentato',
      keine_grundlage: 'Nessuna base',
      widerspruch: 'Contraddizione',
    },
    urteilErklaerung: {
      belegt: 'Ogni affermazione porta una citazione letterale dai Suoi documenti.',
      teilweise_belegt: 'I documenti coprono la domanda solo in parte.',
      keine_grundlage: 'I documenti non rispondono a questa domanda.',
      widerspruch: 'Due passaggi dicono cose diverse. Entrambi sono qui sotto, senza soluzione.',
    },
    herkunft: {
      seite: (n: number) => `p. ${n}`,
      zeile: (n: number) => `riga ${n}`,
      zeilen: (von: number, bis: number) => `righe ${von}–${bis}`,
    },
  },
  en: {
    phasen: {
      einbetten: 'Embedding the question',
      suchen: 'Searching the documents',
      antworten: 'Model is writing the answer',
      pruefen: 'Checking the citations',
    },
    urteil: {
      belegt: 'Supported',
      teilweise_belegt: 'Partly supported',
      keine_grundlage: 'No basis in the documents',
      widerspruch: 'Contradiction between sources',
    },
    urteilKurz: {
      belegt: 'Supported',
      teilweise_belegt: 'Partly supported',
      keine_grundlage: 'No basis',
      widerspruch: 'Contradiction',
    },
    urteilErklaerung: {
      belegt: 'Every statement carries a verbatim quote from your documents.',
      teilweise_belegt: 'The documents only partly cover the question.',
      keine_grundlage: 'The documents do not answer this question.',
      widerspruch: 'Two passages say different things. Both are shown below, unresolved.',
    },
    herkunft: {
      seite: (n: number) => `p. ${n}`,
      zeile: (n: number) => `line ${n}`,
      zeilen: (von: number, bis: number) => `lines ${von}–${bis}`,
    },
  },
});
