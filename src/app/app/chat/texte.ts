import { texte } from '@/lib/i18n/texte';

/*
 * Der Chat: Leiste, Eingabe, Verlauf, Seitenspalte, Quellen-Panel und die
 * Meldungen aus dem Antwortstrom. Urteile und Schritte: `texte-urteil.ts`.
 */
export const CHAT = texte({
  de: {
    leiste: {
      quellen: (n: number) => (n === 1 ? '1 Quelle geprüft' : `${n} Quellen geprüft`),
      bereit: (n: number) => (n === 1 ? '1 Dokument bereit' : `${n} Dokumente bereit`),
      neu: 'Neu beginnen',
      seitenspalte: 'Dokumente',
    },
    nichtsDa: 'Hier ist noch nichts zu durchsuchen.',
    ersteHochladen: 'Lade zuerst ein Dokument hoch',
    leeresProjekt: (bereich: string) => `In ${bereich} liegt noch kein fertiges Dokument.`,
    diesemBereich: 'diesem Bereich',
    unterDokumente: 'Unter Dokumente',
    hochladenOderZuordnen: 'lädst du welche hoch oder ordnest sie dem Projekt zu.',
    unterhaltung: 'Unterhaltung',
    eingabe: {
      beschriftungWahl: 'Frage an die ausgewählten Dokumente',
      beschriftung: 'Deine Frage',
      platzhalter: 'Frag etwas zu diesen Dokumenten',
      keinDokument: 'Kein Dokument ausgewählt',
      umfang: (n: number, bereich?: string) =>
        `Sucht in ${n === 1 ? 'einem Dokument' : `${n} Dokumenten`}${bereich ? ` aus ${bereich}` : ''}`,
      rest: (n: number) => `, noch ${n} Zeichen`,
      enter: 'Enter sendet',
      senden: 'Frage stellen',
      laeuft: 'Wird beantwortet',
    },
    leer: {
      ohneModell:
        'Im Moment läuft kein Sprachmodell. Evidarium zeigt dann die passendste Stelle, formuliert aber keine Antwort — die Belegprüfung läuft trotzdem.',
      vorschlaege: 'Fragen zum Ausprobieren',
      legende: 'Jede Antwort bekommt eines von vier Urteilen:',
    },
    antwort: {
      demo: ' Diese Antwort stammt aus dem Demo-Adapter, es lief kein Modell.',
      nichtsGefunden: 'Nichts gefunden',
      nichtsGefundenText:
        'In den ausgewählten Dokumenten steht dazu nichts. Das ist eine Antwort, kein Fehler.',
      kopieren: 'Kopieren',
      kopiert: 'Kopiert, mit Belegen',
      geprueft: (sekunden: string) => `Geprüft in ${sekunden}`,
      verbrauch: (ein: string, aus: string) => `${ein} Token gelesen, ${aus} geschrieben.`,
    },
    ansage: {
      antwort: (urteil: string, n: number) =>
        `Antwort da: ${urteil}, ${n === 1 ? 'eine Quelle' : `${n} Quellen`}.`,
      nichts: 'In den ausgewählten Dokumenten steht dazu nichts.',
    },
    meldung: {
      nichtMoeglich: 'Anfrage nicht möglich.',
      unterbrochen: 'Die Verbindung wurde unterbrochen.',
      unerwartet: 'Beim Beantworten ist ein unerwarteter Fehler aufgetreten.',
      sitzung: (n: number) =>
        `Diese Sitzung hat ihr Kontingent von ${n} Fragen erreicht. Melde dich neu an, um weiterzufragen.`,
      besuch: (n: number) => `Dieser Besuch hat sein Kontingent von ${n} Fragen erreicht.`,
      tag: 'Die Demo hat ihr Tagesbudget erreicht. Morgen geht es weiter.',
      monat: 'Die Demo hat ihr Monatsbudget erreicht. Nächsten Monat geht es weiter.',
      herkunft: (n: number) => `Von hier kamen heute schon ${n} Fragen. Morgen geht es weiter.`,
    },
    wahl: {
      titel: 'Dokumente',
      alle: 'Alle',
      keines: 'Keines',
      ohneAuswahl: 'Ohne Auswahl gibt es nichts zu durchsuchen. Wähle mindestens ein Dokument.',
    },
    projekte: {
      titel: 'Projekte',
      alle: 'Alle Dokumente',
      verwalten: 'Projekte verwalten',
      anzahl: (n: number) => (n === 1 ? 'Dokument' : 'Dokumente'),
    },
    panel: {
      label: 'Fundstelle im Dokument',
      seite: (n: number) => `Seite ${n}`,
      nichtMarkiert:
        'Das Zitat liess sich im Abschnitt nicht eindeutig markieren. Der Abschnitt steht unverändert darunter.',
      ganzesDokument: 'Ganzes Dokument öffnen',
      schliessen: 'Schliessen',
    },
  },
  fr: {
    leiste: {
      quellen: (n: number) => (n === 1 ? '1 source vérifiée' : `${n} sources vérifiées`),
      bereit: (n: number) => (n === 1 ? '1 document prêt' : `${n} documents prêts`),
      neu: 'Recommencer',
      seitenspalte: 'Documents',
    },
    nichtsDa: 'Il n’y a encore rien à rechercher ici.',
    ersteHochladen: 'Téléversez d’abord un document',
    leeresProjekt: (bereich: string) => `${bereich} ne contient encore aucun document prêt.`,
    diesemBereich: 'Ce domaine',
    unterDokumente: 'Sous Documents',
    hochladenOderZuordnen: 'vous en téléversez ou les attribuez au projet.',
    unterhaltung: 'Conversation',
    eingabe: {
      beschriftungWahl: 'Question aux documents sélectionnés',
      beschriftung: 'Votre question',
      platzhalter: 'Posez une question sur ces documents',
      keinDokument: 'Aucun document sélectionné',
      umfang: (n: number, bereich?: string) =>
        `Recherche dans ${n === 1 ? 'un document' : `${n} documents`}${bereich ? ` de ${bereich}` : ''}`,
      rest: (n: number) => `, encore ${n} caractères`,
      enter: 'Entrée pour envoyer',
      senden: 'Poser la question',
      laeuft: 'Réponse en cours',
    },
    leer: {
      ohneModell:
        'Aucun modèle de langue ne tourne pour le moment. Evidarium montre alors le passage le plus pertinent, sans formuler de réponse — la vérification des citations a lieu malgré tout.',
      vorschlaege: 'Questions à essayer',
      legende: 'Chaque réponse reçoit l’un de quatre verdicts\u00a0:',
    },
    antwort: {
      demo: ' Cette réponse provient de l’adaptateur de démonstration, aucun modèle n’a tourné.',
      nichtsGefunden: 'Rien trouvé',
      nichtsGefundenText:
        'Les documents sélectionnés ne disent rien à ce sujet. C’est une réponse, pas une erreur.',
      kopieren: 'Copier',
      kopiert: 'Copié, avec les citations',
      geprueft: (sekunden: string) => `Vérifié en ${sekunden}`,
      verbrauch: (ein: string, aus: string) => `${ein} jetons lus, ${aus} écrits.`,
    },
    ansage: {
      antwort: (urteil: string, n: number) =>
        `Réponse disponible\u00a0: ${urteil}, ${n === 1 ? 'une source' : `${n} sources`}.`,
      nichts: 'Les documents sélectionnés ne disent rien à ce sujet.',
    },
    meldung: {
      nichtMoeglich: 'Requête impossible.',
      unterbrochen: 'La connexion a été interrompue.',
      unerwartet: 'Une erreur inattendue s’est produite lors de la réponse.',
      sitzung: (n: number) =>
        `Cette session a atteint son quota de ${n} questions. Reconnectez-vous pour continuer.`,
      besuch: (n: number) => `Cette visite a atteint son quota de ${n} questions.`,
      tag: 'La démo a atteint son budget journalier. Elle reprend demain.',
      monat: 'La démo a atteint son budget mensuel. Elle reprend le mois prochain.',
      herkunft: (n: number) =>
        `${n} questions sont déjà venues d’ici aujourd’hui. Cela reprend demain.`,
    },
    wahl: {
      titel: 'Documents',
      alle: 'Tous',
      keines: 'Aucun',
      ohneAuswahl: 'Sans sélection, il n’y a rien à rechercher. Choisissez au moins un document.',
    },
    projekte: {
      titel: 'Projets',
      alle: 'Tous les documents',
      verwalten: 'Gérer les projets',
      anzahl: (n: number) => (n === 1 ? 'document' : 'documents'),
    },
    panel: {
      label: 'Passage dans le document',
      seite: (n: number) => `Page ${n}`,
      nichtMarkiert:
        'La citation n’a pas pu être marquée sans ambiguïté dans le passage. Celui-ci figure ci-dessous, inchangé.',
      ganzesDokument: 'Ouvrir le document entier',
      schliessen: 'Fermer',
    },
  },
  it: {
    leiste: {
      quellen: (n: number) => (n === 1 ? '1 fonte verificata' : `${n} fonti verificate`),
      bereit: (n: number) => (n === 1 ? '1 documento pronto' : `${n} documenti pronti`),
      neu: 'Ricomincia',
      seitenspalte: 'Documenti',
    },
    nichtsDa: 'Qui non c’è ancora nulla da cercare.',
    ersteHochladen: 'Carichi prima un documento',
    leeresProjekt: (bereich: string) => `In ${bereich} non c’è ancora nessun documento pronto.`,
    diesemBereich: 'quest’area',
    unterDokumente: 'Sotto Documenti',
    hochladenOderZuordnen: 'può caricarne o assegnarli al progetto.',
    unterhaltung: 'Conversazione',
    eingabe: {
      beschriftungWahl: 'Domanda ai documenti selezionati',
      beschriftung: 'La Sua domanda',
      platzhalter: 'Chieda qualcosa su questi documenti',
      keinDokument: 'Nessun documento selezionato',
      umfang: (n: number, bereich?: string) =>
        `Cerca in ${n === 1 ? 'un documento' : `${n} documenti`}${bereich ? ` di ${bereich}` : ''}`,
      rest: (n: number) => `, ancora ${n} caratteri`,
      enter: 'Invio per inviare',
      senden: 'Fare la domanda',
      laeuft: 'Risposta in corso',
    },
    leer: {
      ohneModell:
        'Al momento non è attivo alcun modello linguistico. Evidarium mostra allora il passaggio più pertinente, senza formulare una risposta — la verifica delle citazioni avviene comunque.',
      vorschlaege: 'Domande da provare',
      legende: 'Ogni risposta riceve uno di quattro giudizi:',
    },
    antwort: {
      demo: ' Questa risposta proviene dall’adattatore dimostrativo, nessun modello è stato usato.',
      nichtsGefunden: 'Nulla trovato',
      nichtsGefundenText:
        'I documenti selezionati non dicono nulla in merito. È una risposta, non un errore.',
      kopieren: 'Copia',
      kopiert: 'Copiato, con le citazioni',
      geprueft: (sekunden: string) => `Verificato in ${sekunden}`,
      verbrauch: (ein: string, aus: string) => `${ein} token letti, ${aus} scritti.`,
    },
    ansage: {
      antwort: (urteil: string, n: number) =>
        `Risposta pronta: ${urteil}, ${n === 1 ? 'una fonte' : `${n} fonti`}.`,
      nichts: 'I documenti selezionati non dicono nulla in merito.',
    },
    meldung: {
      nichtMoeglich: 'Richiesta non possibile.',
      unterbrochen: 'La connessione è stata interrotta.',
      unerwartet: 'Durante la risposta si è verificato un errore imprevisto.',
      sitzung: (n: number) =>
        `Questa sessione ha raggiunto il suo contingente di ${n} domande. Acceda di nuovo per continuare.`,
      besuch: (n: number) => `Questa visita ha raggiunto il suo contingente di ${n} domande.`,
      tag: 'La demo ha raggiunto il budget giornaliero. Si riprende domani.',
      monat: 'La demo ha raggiunto il budget mensile. Si riprende il mese prossimo.',
      herkunft: (n: number) => `Da qui sono già arrivate ${n} domande oggi. Si riprende domani.`,
    },
    wahl: {
      titel: 'Documenti',
      alle: 'Tutti',
      keines: 'Nessuno',
      ohneAuswahl: 'Senza selezione non c’è nulla da cercare. Scelga almeno un documento.',
    },
    projekte: {
      titel: 'Progetti',
      alle: 'Tutti i documenti',
      verwalten: 'Gestisci progetti',
      anzahl: (n: number) => (n === 1 ? 'documento' : 'documenti'),
    },
    panel: {
      label: 'Passaggio nel documento',
      seite: (n: number) => `Pagina ${n}`,
      nichtMarkiert:
        'Non è stato possibile evidenziare la citazione nel passaggio in modo univoco. Il passaggio è riportato qui sotto, invariato.',
      ganzesDokument: 'Apri il documento intero',
      schliessen: 'Chiudi',
    },
  },
  en: {
    leiste: {
      quellen: (n: number) => (n === 1 ? '1 source checked' : `${n} sources checked`),
      bereit: (n: number) => (n === 1 ? '1 document ready' : `${n} documents ready`),
      neu: 'Start over',
      seitenspalte: 'Documents',
    },
    nichtsDa: 'There is nothing to search here yet.',
    ersteHochladen: 'Upload a document first',
    leeresProjekt: (bereich: string) => `${bereich} does not contain a ready document yet.`,
    diesemBereich: 'This area',
    unterDokumente: 'Under Documents',
    hochladenOderZuordnen: 'you can upload some or assign them to the project.',
    unterhaltung: 'Conversation',
    eingabe: {
      beschriftungWahl: 'Question to the selected documents',
      beschriftung: 'Your question',
      platzhalter: 'Ask something about these documents',
      keinDokument: 'No document selected',
      umfang: (n: number, bereich?: string) =>
        `Searches ${n === 1 ? 'one document' : `${n} documents`}${bereich ? ` in ${bereich}` : ''}`,
      rest: (n: number) => `, ${n} characters left`,
      enter: 'Enter sends',
      senden: 'Ask the question',
      laeuft: 'Answering',
    },
    leer: {
      ohneModell:
        'No language model is running at the moment. Evidarium then shows the most relevant passage but does not write an answer — the citation check still runs.',
      vorschlaege: 'Questions to try',
      legende: 'Every answer gets one of four verdicts:',
    },
    antwort: {
      demo: ' This answer comes from the demo adapter; no model was run.',
      nichtsGefunden: 'Nothing found',
      nichtsGefundenText:
        'The selected documents say nothing about this. That is an answer, not an error.',
      kopieren: 'Copy',
      kopiert: 'Copied, with citations',
      geprueft: (sekunden: string) => `Checked in ${sekunden}`,
      verbrauch: (ein: string, aus: string) => `${ein} tokens read, ${aus} written.`,
    },
    ansage: {
      antwort: (urteil: string, n: number) =>
        `Answer ready: ${urteil}, ${n === 1 ? 'one source' : `${n} sources`}.`,
      nichts: 'The selected documents say nothing about this.',
    },
    meldung: {
      nichtMoeglich: 'Request not possible.',
      unterbrochen: 'The connection was interrupted.',
      unerwartet: 'An unexpected error occurred while answering.',
      sitzung: (n: number) =>
        `This session has used its quota of ${n} questions. Sign in again to keep asking.`,
      besuch: (n: number) => `This visit has used its quota of ${n} questions.`,
      tag: 'The demo has reached its daily budget. It continues tomorrow.',
      monat: 'The demo has reached its monthly budget. It continues next month.',
      herkunft: (n: number) =>
        `${n} questions already came from here today. It continues tomorrow.`,
    },
    wahl: {
      titel: 'Documents',
      alle: 'All',
      keines: 'None',
      ohneAuswahl: 'Without a selection there is nothing to search. Choose at least one document.',
    },
    projekte: {
      titel: 'Projects',
      alle: 'All documents',
      verwalten: 'Manage projects',
      anzahl: (n: number) => (n === 1 ? 'document' : 'documents'),
    },
    panel: {
      label: 'Passage in the document',
      seite: (n: number) => `Page ${n}`,
      nichtMarkiert:
        'The quote could not be marked unambiguously in the passage. The passage is shown unchanged below.',
      ganzesDokument: 'Open the whole document',
      schliessen: 'Close',
    },
  },
});
