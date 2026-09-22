import { texte } from '@/lib/i18n/texte';

export const VERBRAUCH = texte({
  de: {
    metaTitel: 'Verbrauch – Evidarium',
    titel: 'Verbrauch',
    schaetzung: (waehrung: string, stand: string) =>
      `Schätzung in ${waehrung}, Preisliste vom ${stand}`,
    heute: 'Heute',
    monat: 'Diesen Monat',
    anmeldung: 'Diese Anmeldung',
    betrag: (wert: string, grenze: string, waehrung: string) => `${wert} von ${grenze} ${waehrung}`,
    fragen: (wert: number, grenze: number) => `${wert} von ${grenze} Fragen`,
    aufrufe: 'Letzte Aufrufe',
    keine: 'Noch kein Aufruf. Im Demo-Modus entsteht kein Eintrag – es wird kein Modell gefragt.',
    spalten: {
      zeitpunkt: 'Zeitpunkt',
      modell: 'Modell',
      stand: 'Stand',
      gelesen: 'Gelesen',
      geschrieben: 'Geschrieben',
      kosten: 'Kosten',
    },
    status: {
      reserviert: 'reserviert',
      abgerechnet: 'abgerechnet',
      unklar: 'unklar – Reservierung bleibt stehen',
    },
    hinweis:
      'Alle Beträge sind Schätzungen. Der Anbieter rechnet nach eigenen Regeln ab; zwischengespeicherte Eingaben kosten weniger. Jede Zeile ist nach dem Preisstand ihres Aufrufs gerechnet.',
  },
  fr: {
    metaTitel: 'Consommation – Evidarium',
    titel: 'Consommation',
    schaetzung: (waehrung: string, stand: string) =>
      `Estimation en ${waehrung}, grille tarifaire du ${stand}`,
    heute: 'Aujourd’hui',
    monat: 'Ce mois-ci',
    anmeldung: 'Cette connexion',
    betrag: (wert: string, grenze: string, waehrung: string) =>
      `${wert} sur ${grenze}\u00a0${waehrung}`,
    fragen: (wert: number, grenze: number) => `${wert} sur ${grenze} questions`,
    aufrufe: 'Derniers appels',
    keine:
      'Aucun appel pour l’instant. En mode démo, aucune entrée n’est créée – aucun modèle n’est interrogé.',
    spalten: {
      zeitpunkt: 'Moment',
      modell: 'Modèle',
      stand: 'État',
      gelesen: 'Lus',
      geschrieben: 'Écrits',
      kosten: 'Coût',
    },
    status: {
      reserviert: 'réservé',
      abgerechnet: 'décompté',
      unklar: 'incertain – la réservation est maintenue',
    },
    hinweis:
      'Tous les montants sont des estimations. Le fournisseur facture selon ses propres règles\u00a0; les entrées mises en cache coûtent moins. Chaque ligne est calculée selon le tarif en vigueur lors de l’appel.',
  },
  it: {
    metaTitel: 'Consumo – Evidarium',
    titel: 'Consumo',
    schaetzung: (waehrung: string, stand: string) =>
      `Stima in ${waehrung}, listino prezzi del ${stand}`,
    heute: 'Oggi',
    monat: 'Questo mese',
    anmeldung: 'Questo accesso',
    betrag: (wert: string, grenze: string, waehrung: string) => `${wert} di ${grenze} ${waehrung}`,
    fragen: (wert: number, grenze: number) => `${wert} di ${grenze} domande`,
    aufrufe: 'Ultime chiamate',
    keine:
      'Ancora nessuna chiamata. In modalità demo non nasce alcuna voce – nessun modello viene interrogato.',
    spalten: {
      zeitpunkt: 'Momento',
      modell: 'Modello',
      stand: 'Stato',
      gelesen: 'Letti',
      geschrieben: 'Scritti',
      kosten: 'Costo',
    },
    status: {
      reserviert: 'riservato',
      abgerechnet: 'conteggiato',
      unklar: 'incerto – la riserva resta',
    },
    hinweis:
      'Tutti gli importi sono stime. Il fornitore fattura secondo regole proprie; gli input in cache costano meno. Ogni riga è calcolata con il listino valido al momento della chiamata.',
  },
  en: {
    metaTitel: 'Usage – Evidarium',
    titel: 'Usage',
    schaetzung: (waehrung: string, stand: string) =>
      `Estimate in ${waehrung}, price list of ${stand}`,
    heute: 'Today',
    monat: 'This month',
    anmeldung: 'This sign-in',
    betrag: (wert: string, grenze: string, waehrung: string) => `${wert} of ${grenze} ${waehrung}`,
    fragen: (wert: number, grenze: number) => `${wert} of ${grenze} questions`,
    aufrufe: 'Recent calls',
    keine: 'No calls yet. Demo mode creates no entries – no model is asked.',
    spalten: {
      zeitpunkt: 'Time',
      modell: 'Model',
      stand: 'Status',
      gelesen: 'Read',
      geschrieben: 'Written',
      kosten: 'Cost',
    },
    status: {
      reserviert: 'reserved',
      abgerechnet: 'billed',
      unklar: 'unclear – reservation stays',
    },
    hinweis:
      'All amounts are estimates. The provider bills by its own rules; cached input costs less. Each row is calculated with the prices in effect at the time of the call.',
  },
});
