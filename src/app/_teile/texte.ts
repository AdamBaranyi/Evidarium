import { texte } from '@/lib/i18n/texte';

/*
 * Texte, die auf jeder Seite stehen: Kopf, Fuss, Sprungmarke, Fehlerseiten.
 * Französisch und Italienisch in der Höflichkeitsform wie bei Tallyroom,
 * Deutsch und Englisch in der direkten Anrede.
 */
export const GEMEINSAM = texte({
  de: {
    beschreibung: 'Antworten aus deinen Dokumenten – mit Quellen, die du nachlesen kannst.',
    sprungmarke: 'Zum Inhalt springen',
    sprachwahl: 'Sprache',
    fuss: {
      label: 'Rechtliches und Quelltext',
      impressum: 'Impressum',
      datenschutz: 'Datenschutz',
      barrierefreiheit: 'Barrierefreiheit',
      quelltext: 'Quelltext',
    },
    stand: (datum: string) => `Stand: ${datum}`,
    betreiberFehlt:
      'Die Angaben zum Betreiber sind auf diesem Server nicht gesetzt. In Produktion startet Evidarium ohne sie nicht.',
    /** Nur in den Übersetzungen: Bei Rechtstexten gilt das Original. */
    originalGilt: '',
    nichtGefunden: {
      metaTitel: 'Nicht gefunden – Evidarium',
      titel: 'Diese Seite gibt es nicht.',
      text: 'Vielleicht ist die Adresse vertippt, oder die Seite wurde entfernt. Gelöschte Dokumente sind endgültig weg — auch ihr Link führt hierher.',
      start: 'Zur Startseite',
      anwendung: 'Zur Anwendung',
    },
    fehler: {
      titel: 'Hier ist etwas schiefgegangen.',
      text: 'Der Fehler ist protokolliert. Meist hilft es, die Seite noch einmal zu laden.',
      kennung: (digest: string) => ` Kennung für die Fehlersuche: ${digest}.`,
      nochmal: 'Noch einmal versuchen',
      start: 'Zur Startseite',
    },
    upload: {
      nichtMoeglich: 'Upload nicht möglich.',
      unterbrochen: 'Die Verbindung wurde unterbrochen. Bitte noch einmal versuchen.',
      laeuft: 'Wird übertragen …',
    },
  },
  fr: {
    beschreibung:
      'Des réponses tirées de vos documents – avec des sources que vous pouvez vérifier.',
    sprungmarke: 'Aller au contenu',
    sprachwahl: 'Langue',
    fuss: {
      label: 'Mentions légales et code source',
      impressum: 'Mentions légales',
      datenschutz: 'Protection des données',
      barrierefreiheit: 'Accessibilité',
      quelltext: 'Code source',
    },
    stand: (datum: string) => `État\u00a0: ${datum}`,
    betreiberFehlt:
      "Les informations sur l'exploitant ne sont pas définies sur ce serveur. En production, Evidarium ne démarre pas sans elles.",
    originalGilt:
      'Cette traduction sert à la compréhension\u00a0; seule la version allemande fait foi.',
    nichtGefunden: {
      metaTitel: 'Introuvable – Evidarium',
      titel: "Cette page n'existe pas.",
      text: "L'adresse est peut-être mal saisie, ou la page a été supprimée. Les documents supprimés le sont définitivement — leur lien mène aussi ici.",
      start: "Vers la page d'accueil",
      anwendung: "Vers l'application",
    },
    fehler: {
      titel: "Quelque chose s'est mal passé.",
      text: "L'erreur a été enregistrée. Le plus souvent, il suffit de recharger la page.",
      kennung: (digest: string) => ` Identifiant pour l'analyse\u00a0: ${digest}.`,
      nochmal: 'Réessayer',
      start: "Vers la page d'accueil",
    },
    upload: {
      nichtMoeglich: 'Téléversement impossible.',
      unterbrochen: 'La connexion a été interrompue. Veuillez réessayer.',
      laeuft: 'Transfert en cours …',
    },
  },
  it: {
    beschreibung: 'Risposte tratte dai Suoi documenti – con fonti che può verificare.',
    sprungmarke: 'Vai al contenuto',
    sprachwahl: 'Lingua',
    fuss: {
      label: 'Note legali e codice sorgente',
      impressum: 'Note legali',
      datenschutz: 'Protezione dei dati',
      barrierefreiheit: 'Accessibilità',
      quelltext: 'Codice sorgente',
    },
    stand: (datum: string) => `Stato: ${datum}`,
    betreiberFehlt:
      'I dati del gestore non sono impostati su questo server. In produzione Evidarium non si avvia senza di essi.',
    originalGilt:
      'Questa traduzione serve alla comprensione; fa fede unicamente la versione tedesca.',
    nichtGefunden: {
      metaTitel: 'Non trovata – Evidarium',
      titel: 'Questa pagina non esiste.',
      text: "Forse l'indirizzo è errato, oppure la pagina è stata rimossa. I documenti eliminati lo sono definitivamente — anche il loro link porta qui.",
      start: 'Alla pagina iniziale',
      anwendung: "All'applicazione",
    },
    fehler: {
      titel: 'Qualcosa è andato storto.',
      text: "L'errore è stato registrato. Di solito basta ricaricare la pagina.",
      kennung: (digest: string) => ` Codice per l'analisi: ${digest}.`,
      nochmal: 'Riprova',
      start: 'Alla pagina iniziale',
    },
    upload: {
      nichtMoeglich: 'Caricamento non possibile.',
      unterbrochen: 'La connessione è stata interrotta. La preghiamo di riprovare.',
      laeuft: 'Trasferimento in corso …',
    },
  },
  en: {
    beschreibung: 'Answers from your documents – with sources you can check.',
    sprungmarke: 'Skip to content',
    sprachwahl: 'Language',
    fuss: {
      label: 'Legal and source code',
      impressum: 'Legal notice',
      datenschutz: 'Privacy',
      barrierefreiheit: 'Accessibility',
      quelltext: 'Source code',
    },
    stand: (datum: string) => `Last updated: ${datum}`,
    betreiberFehlt:
      'The operator details are not set on this server. In production, Evidarium does not start without them.',
    originalGilt:
      'This translation is provided for convenience; only the German version is binding.',
    nichtGefunden: {
      metaTitel: 'Not found – Evidarium',
      titel: 'This page does not exist.',
      text: 'The address may be mistyped, or the page was removed. Deleted documents are gone for good — their links lead here too.',
      start: 'To the start page',
      anwendung: 'To the application',
    },
    fehler: {
      titel: 'Something went wrong here.',
      text: 'The error has been logged. Reloading the page usually helps.',
      kennung: (digest: string) => ` Reference for troubleshooting: ${digest}.`,
      nochmal: 'Try again',
      start: 'To the start page',
    },
    upload: {
      nichtMoeglich: 'Upload not possible.',
      unterbrochen: 'The connection was interrupted. Please try again.',
      laeuft: 'Uploading …',
    },
  },
});
