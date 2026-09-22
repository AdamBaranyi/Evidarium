import { texte } from './texte';

/*
 * Was der Server sagt: Meldungen der Endpunkte und des Antwortstroms, in der
 * Sprache der Anfrage. Grenzwerte kommen als Parameter herein — nur der
 * Server kennt sie.
 */
export const MELDUNGEN = texte({
  de: {
    abgelehnt: 'Anfrage abgelehnt.',
    nichtAngemeldet: 'Nicht angemeldet.',
    zuGross: 'Anfrage zu gross.',
    frageUndAuswahl: 'Bitte eine Frage stellen und mindestens ein Dokument auswählen.',
    frageFehlt: 'Bitte eine Frage stellen.',
    demoAus: 'Die Demo ist nicht eingeschaltet.',
    demoNichtBereit: 'Die Demo ist gerade nicht bereit.',
    keineDatei: 'Keine Datei erhalten.',
    uploadNichtMoeglich: 'Upload nicht möglich.',
    dateiZuGross: (mib: number) => `Die Datei ist grösser als ${mib} MiB.`,
    typNichtUnterstuetzt:
      'Dieses Format wird nicht unterstützt. Erlaubt sind PDF mit Textschicht, TXT und Markdown.',
    zuVieleDokumente: (n: number) => `Mehr als ${n} Dokumente sind zurzeit nicht vorgesehen.`,
    zuVieleDemo: (n: number) => `In der Demo sind ${n} eigene Dateien je Besuch möglich.`,
    schonVorhanden: 'Diese Datei ist bereits vorhanden.',
    schonHochgeladen: 'Diese Datei hast du schon hochgeladen.',
    demoVoll: 'Die Demo nimmt gerade keine weiteren Dateien an. In einigen Stunden wieder.',
    herkunftDateien: 'Von hier kamen heute schon genug Dateien. Morgen geht es weiter.',
    strom: {
      sitzung: (n: number) =>
        `Diese Sitzung hat ihr Kontingent von ${n} Fragen erreicht. Melde dich neu an, um weiterzufragen.`,
      besuch: (n: number) =>
        `Dieser Besuch hat sein Kontingent von ${n} Fragen erreicht. Morgen geht es weiter.`,
      tag: 'Die Demo hat ihr Tagesbudget erreicht. Morgen geht es weiter.',
      monat: 'Die Demo hat ihr Monatsbudget erreicht. Nächsten Monat geht es weiter.',
      keinPreis:
        'Für dieses Modell ist kein Preis hinterlegt. Der Live-Modus bleibt gesperrt, bis er eingetragen ist.',
      herkunft: (n: number) => `Von hier kamen heute schon ${n} Fragen. Morgen geht es weiter.`,
      einbettenAus: 'Der Suchdienst läuft gerade nicht. Bitte später erneut versuchen.',
      einbetten: 'Die Frage konnte nicht verarbeitet werden.',
      belegeUngueltig:
        'Die Antwort liess sich nicht mit den Quellen belegen und wird darum nicht angezeigt.',
      zeitlimit: 'Die Antwort hat zu lange gedauert. Bitte noch einmal versuchen.',
      modellAbgelehnt: 'Diese Frage wurde vom Modell abgelehnt.',
      ungueltigeAusgabe: 'Die Antwort kam in einem unerwarteten Format zurück.',
      nichtErreichbar: 'Der Antwortdienst ist gerade nicht erreichbar.',
      unerwartet: 'Beim Beantworten ist ein unerwarteter Fehler aufgetreten.',
    },
    demoAntwort: {
      stelle: (frage: string) =>
        `Demo-Antwort ohne Modell: Zur Frage «${frage}» passt diese Stelle am besten.`,
      keineStelle: 'In den ausgewählten Dokumenten wurde keine passende Stelle gefunden.',
      keinSatz: 'Die gefundene Stelle enthält keinen lesbaren Satz.',
    },
  },
  fr: {
    abgelehnt: 'Requête refusée.',
    nichtAngemeldet: 'Non connecté.',
    zuGross: 'Requête trop volumineuse.',
    frageUndAuswahl: 'Veuillez poser une question et sélectionner au moins un document.',
    frageFehlt: 'Veuillez poser une question.',
    demoAus: "La démo n'est pas activée.",
    demoNichtBereit: "La démo n'est pas prête pour le moment.",
    keineDatei: 'Aucun fichier reçu.',
    uploadNichtMoeglich: 'Téléversement impossible.',
    dateiZuGross: (mib: number) => `Le fichier dépasse ${mib}\u00a0Mio.`,
    typNichtUnterstuetzt:
      "Ce format n'est pas pris en charge. Sont acceptés les PDF avec couche de texte, TXT et Markdown.",
    zuVieleDokumente: (n: number) => `Plus de ${n} documents ne sont pas prévus pour l'instant.`,
    zuVieleDemo: (n: number) => `Dans la démo, ${n} fichiers personnels par visite sont possibles.`,
    schonVorhanden: 'Ce fichier existe déjà.',
    schonHochgeladen: 'Vous avez déjà téléversé ce fichier.',
    demoVoll: "La démo n'accepte plus de fichiers pour le moment. Réessayez dans quelques heures.",
    herkunftDateien: "Assez de fichiers sont déjà venus d'ici aujourd'hui. Cela reprend demain.",
    strom: {
      sitzung: (n: number) =>
        `Cette session a atteint son quota de ${n} questions. Reconnectez-vous pour continuer.`,
      besuch: (n: number) =>
        `Cette visite a atteint son quota de ${n} questions. Cela reprend demain.`,
      tag: 'La démo a atteint son budget journalier. Elle reprend demain.',
      monat: 'La démo a atteint son budget mensuel. Elle reprend le mois prochain.',
      keinPreis:
        "Aucun prix n'est enregistré pour ce modèle. Le mode réel reste bloqué jusqu'à ce qu'il le soit.",
      herkunft: (n: number) =>
        `${n} questions sont déjà venues d'ici aujourd'hui. Cela reprend demain.`,
      einbettenAus: 'Le service de recherche ne tourne pas pour le moment. Réessayez plus tard.',
      einbetten: "La question n'a pas pu être traitée.",
      belegeUngueltig:
        "La réponse n'a pas pu être étayée par les sources et n'est donc pas affichée.",
      zeitlimit: 'La réponse a pris trop de temps. Veuillez réessayer.',
      modellAbgelehnt: 'Le modèle a refusé cette question.',
      ungueltigeAusgabe: 'La réponse est revenue dans un format inattendu.',
      nichtErreichbar: "Le service de réponse n'est pas joignable pour le moment.",
      unerwartet: "Une erreur inattendue s'est produite lors de la réponse.",
    },
    demoAntwort: {
      stelle: (frage: string) =>
        `Réponse de démonstration sans modèle\u00a0: pour la question «\u00a0${frage}\u00a0», ce passage correspond le mieux.`,
      keineStelle: "Aucun passage correspondant n'a été trouvé dans les documents sélectionnés.",
      keinSatz: 'Le passage trouvé ne contient aucune phrase lisible.',
    },
  },
  it: {
    abgelehnt: 'Richiesta respinta.',
    nichtAngemeldet: 'Non ha effettuato l’accesso.',
    zuGross: 'Richiesta troppo grande.',
    frageUndAuswahl: 'Faccia una domanda e selezioni almeno un documento.',
    frageFehlt: 'Faccia una domanda.',
    demoAus: 'La demo non è attiva.',
    demoNichtBereit: 'La demo al momento non è pronta.',
    keineDatei: 'Nessun file ricevuto.',
    uploadNichtMoeglich: 'Caricamento non possibile.',
    dateiZuGross: (mib: number) => `Il file supera ${mib} MiB.`,
    typNichtUnterstuetzt:
      'Questo formato non è supportato. Sono ammessi PDF con livello di testo, TXT e Markdown.',
    zuVieleDokumente: (n: number) => `Più di ${n} documenti non sono previsti al momento.`,
    zuVieleDemo: (n: number) => `Nella demo sono possibili ${n} file propri per visita.`,
    schonVorhanden: 'Questo file esiste già.',
    schonHochgeladen: 'Ha già caricato questo file.',
    demoVoll: 'La demo al momento non accetta altri file. Riprovi tra qualche ora.',
    herkunftDateien: 'Da qui sono già arrivati abbastanza file oggi. Si riprende domani.',
    strom: {
      sitzung: (n: number) =>
        `Questa sessione ha raggiunto il suo contingente di ${n} domande. Acceda di nuovo per continuare.`,
      besuch: (n: number) =>
        `Questa visita ha raggiunto il suo contingente di ${n} domande. Si riprende domani.`,
      tag: 'La demo ha raggiunto il budget giornaliero. Si riprende domani.',
      monat: 'La demo ha raggiunto il budget mensile. Si riprende il mese prossimo.',
      keinPreis:
        'Per questo modello non è registrato alcun prezzo. La modalità reale resta bloccata finché non lo sarà.',
      herkunft: (n: number) => `Da qui sono già arrivate ${n} domande oggi. Si riprende domani.`,
      einbettenAus: 'Il servizio di ricerca al momento non è attivo. Riprovi più tardi.',
      einbetten: 'Non è stato possibile elaborare la domanda.',
      belegeUngueltig:
        'Non è stato possibile documentare la risposta con le fonti, quindi non viene mostrata.',
      zeitlimit: 'La risposta ha richiesto troppo tempo. Riprovi.',
      modellAbgelehnt: 'Il modello ha respinto questa domanda.',
      ungueltigeAusgabe: 'La risposta è tornata in un formato inatteso.',
      nichtErreichbar: 'Il servizio di risposta al momento non è raggiungibile.',
      unerwartet: 'Durante la risposta si è verificato un errore imprevisto.',
    },
    demoAntwort: {
      stelle: (frage: string) =>
        `Risposta dimostrativa senza modello: per la domanda «${frage}» questo passaggio è il più adatto.`,
      keineStelle: 'Nei documenti selezionati non è stato trovato alcun passaggio adatto.',
      keinSatz: 'Il passaggio trovato non contiene alcuna frase leggibile.',
    },
  },
  en: {
    abgelehnt: 'Request rejected.',
    nichtAngemeldet: 'Not signed in.',
    zuGross: 'Request too large.',
    frageUndAuswahl: 'Please ask a question and select at least one document.',
    frageFehlt: 'Please ask a question.',
    demoAus: 'The demo is not enabled.',
    demoNichtBereit: 'The demo is not ready at the moment.',
    keineDatei: 'No file received.',
    uploadNichtMoeglich: 'Upload not possible.',
    dateiZuGross: (mib: number) => `The file is larger than ${mib} MiB.`,
    typNichtUnterstuetzt:
      'This format is not supported. Accepted are PDF with a text layer, TXT and Markdown.',
    zuVieleDokumente: (n: number) => `More than ${n} documents are not supported at the moment.`,
    zuVieleDemo: (n: number) => `The demo allows ${n} files of your own per visit.`,
    schonVorhanden: 'This file already exists.',
    schonHochgeladen: 'You have already uploaded this file.',
    demoVoll: 'The demo is not accepting more files right now. Try again in a few hours.',
    herkunftDateien: 'Enough files already came from here today. It continues tomorrow.',
    strom: {
      sitzung: (n: number) =>
        `This session has used its quota of ${n} questions. Sign in again to keep asking.`,
      besuch: (n: number) =>
        `This visit has used its quota of ${n} questions. It continues tomorrow.`,
      tag: 'The demo has reached its daily budget. It continues tomorrow.',
      monat: 'The demo has reached its monthly budget. It continues next month.',
      keinPreis:
        'No price is on record for this model. Live mode stays locked until one is entered.',
      herkunft: (n: number) =>
        `${n} questions already came from here today. It continues tomorrow.`,
      einbettenAus: 'The search service is not running at the moment. Please try again later.',
      einbetten: 'The question could not be processed.',
      belegeUngueltig: 'The answer could not be backed by the sources and is therefore not shown.',
      zeitlimit: 'The answer took too long. Please try again.',
      modellAbgelehnt: 'The model declined this question.',
      ungueltigeAusgabe: 'The answer came back in an unexpected format.',
      nichtErreichbar: 'The answering service cannot be reached at the moment.',
      unerwartet: 'An unexpected error occurred while answering.',
    },
    demoAntwort: {
      stelle: (frage: string) =>
        `Demo answer without a model: for the question “${frage}”, this passage fits best.`,
      keineStelle: 'No matching passage was found in the selected documents.',
      keinSatz: 'The passage found contains no readable sentence.',
    },
  },
});
