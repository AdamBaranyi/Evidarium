import { texte } from '@/lib/i18n/texte';

/* Navigation im angemeldeten Bereich und die Seite «Fragen». */
export const ANWENDUNG = texte({
  de: {
    navigation: 'Hauptnavigation',
    fragen: 'Fragen',
    dokumente: 'Dokumente',
    verbrauch: 'Verbrauch',
    abmelden: 'Abmelden',
    chat: {
      metaTitel: 'Fragen – Evidarium',
      ueberschrift: (projekt?: string) => (projekt ? `Fragen in ${projekt}` : 'Fragen'),
      titel: (projekt?: string) =>
        projekt ? `Frag ${projekt} etwas.` : 'Frag deine Dokumente etwas.',
      einleitung:
        'Jede Aussage trägt ein wörtliches Zitat, ein Klick öffnet die Stelle im Dokument. In der Seitenspalte wählst du, was durchsucht wird.',
      einleitungProjekt:
        'Gesucht wird nur in den Dokumenten dieses Projekts. Jede Aussage trägt ein wörtliches Zitat, ein Klick öffnet die Stelle im Dokument.',
    },
  },
  fr: {
    navigation: 'Navigation principale',
    fragen: 'Questions',
    dokumente: 'Documents',
    verbrauch: 'Consommation',
    abmelden: 'Se déconnecter',
    chat: {
      metaTitel: 'Questions – Evidarium',
      ueberschrift: (projekt?: string) => (projekt ? `Questions dans ${projekt}` : 'Questions'),
      titel: (projekt?: string) =>
        projekt ? `Interrogez ${projekt}.` : 'Interrogez vos documents.',
      einleitung:
        'Chaque affirmation porte une citation littérale, un clic ouvre le passage dans le document. Dans la colonne latérale, vous choisissez ce qui est recherché.',
      einleitungProjekt:
        'La recherche porte uniquement sur les documents de ce projet. Chaque affirmation porte une citation littérale, un clic ouvre le passage dans le document.',
    },
  },
  it: {
    navigation: 'Navigazione principale',
    fragen: 'Domande',
    dokumente: 'Documenti',
    verbrauch: 'Consumo',
    abmelden: 'Esci',
    chat: {
      metaTitel: 'Domande – Evidarium',
      ueberschrift: (projekt?: string) => (projekt ? `Domande in ${projekt}` : 'Domande'),
      titel: (projekt?: string) =>
        projekt ? `Interroghi ${projekt}.` : 'Interroghi i Suoi documenti.',
      einleitung:
        'Ogni affermazione porta una citazione letterale, un clic apre il passaggio nel documento. Nella colonna laterale sceglie in che cosa cercare.',
      einleitungProjekt:
        'La ricerca avviene solo nei documenti di questo progetto. Ogni affermazione porta una citazione letterale, un clic apre il passaggio nel documento.',
    },
  },
  en: {
    navigation: 'Main navigation',
    fragen: 'Ask',
    dokumente: 'Documents',
    verbrauch: 'Usage',
    abmelden: 'Sign out',
    chat: {
      metaTitel: 'Ask – Evidarium',
      ueberschrift: (projekt?: string) => (projekt ? `Ask in ${projekt}` : 'Ask'),
      titel: (projekt?: string) =>
        projekt ? `Ask ${projekt} something.` : 'Ask your documents something.',
      einleitung:
        'Every statement carries a verbatim quote; one click opens the passage in the document. In the sidebar you choose what is searched.',
      einleitungProjekt:
        'Only this project’s documents are searched. Every statement carries a verbatim quote; one click opens the passage in the document.',
    },
  },
});
