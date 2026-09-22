import { texte } from '@/lib/i18n/texte';

/*
 * Startseite und Vorführung. Die Zitate der Vorführung stehen **nicht** hier:
 * Sie sind wörtlich aus den deutschen Dokumenten des Korpus und bleiben
 * deutsch — genau das zeigt die Vorführung in den anderen Sprachen mit.
 */
export const START = texte({
  de: {
    titel: 'Antworten aus deinen Dokumenten, mit Quellen zum Nachlesen.',
    text: 'Nachprüfbarkeit, nicht Unfehlbarkeit: Jede Aussage trägt ein wörtliches Zitat, und ein Klick öffnet die Stelle im Dokument. Findet sich keine Grundlage, sagt Evidarium das, statt etwas zu erfinden.',
    einstieg: 'Einstieg',
    demo: 'Ohne Anmeldung ausprobieren',
    anmelden: 'Anmelden',
    bereich: 'Evidarium bei der Arbeit',
    herkunft:
      'Beispiel aus dem Korpus der erfundenen Firma Nordstern Digital, gegen den auch die Evaluation läuft.',
    vorfuehrung: {
      durchsucht: 'Durchsucht wird in',
      quellen: (n: number) => (n === 1 ? '1 Quelle geprüft' : `${n} Quellen geprüft`),
      anhalten: 'Anhalten',
      abspielen: 'Abspielen',
      szenen: [
        {
          frage: 'Wer hilft beim Onboarding?',
          urteil: 'Belegt',
          aussage: 'Beim Onboarding hilft Mara Keller.',
        },
        {
          frage: 'Wie lange werden Sicherungen aufbewahrt?',
          urteil: 'Widerspruch zwischen Quellen',
          aussage: 'Zwei Richtlinien sagen Verschiedenes. Aufgelöst wird das hier nicht.',
        },
      ],
    },
  },
  fr: {
    titel: 'Des réponses tirées de vos documents, avec des sources à relire.',
    text: "Vérifiable plutôt qu'infaillible\u00a0: chaque affirmation porte une citation littérale, et un clic ouvre le passage dans le document. S'il n'y a pas de base, Evidarium le dit au lieu d'inventer.",
    einstieg: 'Pour commencer',
    demo: 'Essayer sans compte',
    anmelden: 'Se connecter',
    bereich: 'Evidarium au travail',
    herkunft:
      "Exemple tiré du corpus de l'entreprise fictive Nordstern Digital, qui sert aussi à l'évaluation. Les documents sont en allemand\u00a0; les citations restent littérales.",
    vorfuehrung: {
      durchsucht: 'Recherche dans',
      quellen: (n: number) => (n === 1 ? '1 source vérifiée' : `${n} sources vérifiées`),
      anhalten: 'Pause',
      abspielen: 'Lecture',
      szenen: [
        {
          frage: "Qui aide lors de l'intégration\u00a0?",
          urteil: 'Étayé',
          aussage: "Mara Keller aide lors de l'intégration.",
        },
        {
          frage: 'Combien de temps les sauvegardes sont-elles conservées\u00a0?',
          urteil: 'Contradiction entre les sources',
          aussage: "Deux directives disent autre chose. Ce n'est pas tranché ici.",
        },
      ],
    },
  },
  it: {
    titel: 'Risposte tratte dai Suoi documenti, con fonti da rileggere.',
    text: "Verificabile, non infallibile: ogni affermazione porta una citazione letterale, e un clic apre il passaggio nel documento. Se non c'è una base, Evidarium lo dice invece di inventare.",
    einstieg: 'Per iniziare',
    demo: 'Provare senza account',
    anmelden: 'Accedi',
    bereich: 'Evidarium al lavoro',
    herkunft:
      "Esempio tratto dal corpus dell'azienda fittizia Nordstern Digital, usato anche per la valutazione. I documenti sono in tedesco; le citazioni restano letterali.",
    vorfuehrung: {
      durchsucht: 'Ricerca in',
      quellen: (n: number) => (n === 1 ? '1 fonte verificata' : `${n} fonti verificate`),
      anhalten: 'Pausa',
      abspielen: 'Riproduci',
      szenen: [
        {
          frage: "Chi aiuta durante l'inserimento?",
          urteil: 'Documentato',
          aussage: "Mara Keller aiuta durante l'inserimento.",
        },
        {
          frage: 'Per quanto tempo vengono conservati i backup?',
          urteil: 'Contraddizione tra le fonti',
          aussage: 'Due direttive dicono cose diverse. Qui non viene risolto.',
        },
      ],
    },
  },
  en: {
    titel: 'Answers from your documents, with sources to read up on.',
    text: 'Verifiable, not infallible: every statement carries a verbatim quote, and one click opens the passage in the document. Where there is no basis, Evidarium says so instead of making something up.',
    einstieg: 'Get started',
    demo: 'Try it without an account',
    anmelden: 'Sign in',
    bereich: 'Evidarium at work',
    herkunft:
      'Example from the corpus of the fictitious company Nordstern Digital, which the evaluation also runs against. The documents are in German; quotes stay verbatim.',
    vorfuehrung: {
      durchsucht: 'Searching in',
      quellen: (n: number) => (n === 1 ? '1 source checked' : `${n} sources checked`),
      anhalten: 'Pause',
      abspielen: 'Play',
      szenen: [
        {
          frage: 'Who helps with onboarding?',
          urteil: 'Supported',
          aussage: 'Mara Keller helps with onboarding.',
        },
        {
          frage: 'How long are backups kept?',
          urteil: 'Contradiction between sources',
          aussage: 'Two policies say different things. This is not resolved here.',
        },
      ],
    },
  },
});
