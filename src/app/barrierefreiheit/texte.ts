import { texte } from '@/lib/i18n/texte';

/*
 * Barrierefreiheitserklärung — sie behauptet nur, was geprüft ist, und sagt,
 * wie. «Barrierefrei» ohne Prüfweg wäre eine Behauptung, die niemand
 * einlösen kann.
 */
export const BARRIEREFREIHEIT = texte({
  de: {
    metaTitel: 'Barrierefreiheit – Evidarium',
    titel: 'Barrierefreiheit',
    stand: '22. September 2026',
    einleitung:
      'Evidarium soll für alle bedienbar sein, auch mit Tastatur, Screenreader, Vergrösserung oder ohne Farbsehen. Ziel sind die Richtlinien WCAG 2.2 auf Stufe AA.',
    geprueft: 'Wie das geprüft wird',
    pruefungen: [
      'Automatisch mit axe gegen WCAG 2.2 AA, in heller und dunkler Darstellung getrennt, auch im angemeldeten Bereich.',
      'Bei jeder Änderung auf drei Breiten (320, 768 und 1440 Pixel) und in drei Browsern: Chrome, Firefox und Safari, dazu ein iPhone mit Touch.',
      'Keine Schrift unter 16 Pixel, in Quelltext und Browser geprüft.',
      'Kontraste von Text und Bedienelementen gerechnet, nicht geschätzt.',
      'Bedienung mit der Tastatur, sichtbarer Fokus, Sprungmarke zum Inhalt.',
    ],
    gebaut: 'Was bewusst so gebaut ist',
    bauweisen: [
      'Farbe trägt nie allein eine Aussage: Neben jeder Urteilsfarbe steht das Urteil als Wort.',
      'Die bewegte Vorführung und das Licht auf der Startseite lassen sich anhalten und stehen still, wenn das Betriebssystem weniger Bewegung wünscht.',
      'Fertige Antworten und die einzelnen Arbeitsschritte werden Screenreadern angesagt.',
      'Die Seite ist auf Deutsch, Französisch, Italienisch und Englisch lesbar. Zitate aus deutschen Dokumenten sind als deutsch ausgezeichnet und werden so vorgelesen.',
    ],
    grenzen: 'Bekannte Grenzen',
    grenzenListe: [
      'Mit einem echten Screenreader ist Evidarium noch nicht durchgespielt worden. Die Ansagen sind technisch vorhanden, aber nicht im Gebrauch erprobt.',
      'Wie gut ein hochgeladenes PDF gelesen werden kann, hängt von der Datei ab: Gescannte Seiten ohne Textschicht lehnt Evidarium ab und sagt das.',
      'Die Übersetzungen ins Französische, Italienische und Englische sind nicht muttersprachlich geprüft.',
    ],
    kontakt: 'Etwas funktioniert nicht?',
    schreib: 'Schreib an',
    wieFehler: 'Hinweise auf Barrieren werden wie Fehler behandelt.',
    keineAdresse: 'Die Kontaktadresse ist auf diesem Server nicht gesetzt.',
  },
  fr: {
    metaTitel: 'Accessibilité – Evidarium',
    titel: 'Accessibilité',
    stand: '22 septembre 2026',
    einleitung:
      'Evidarium doit pouvoir être utilisé par toutes et tous, y compris au clavier, avec un lecteur d’écran, un agrandissement ou sans perception des couleurs. L’objectif est le niveau AA des règles WCAG 2.2.',
    geprueft: 'Comment c’est vérifié',
    pruefungen: [
      'Automatiquement avec axe selon WCAG 2.2 AA, en affichage clair et sombre séparément, y compris dans l’espace connecté.',
      'À chaque modification sur trois largeurs (320, 768 et 1440 pixels) et dans trois navigateurs\u00a0: Chrome, Firefox et Safari, plus un iPhone tactile.',
      'Aucun texte en dessous de 16 pixels, vérifié dans le code source et dans le navigateur.',
      'Contrastes du texte et des éléments de commande calculés, pas estimés.',
      'Utilisation au clavier, focus visible, lien d’accès direct au contenu.',
    ],
    gebaut: 'Ce qui est construit ainsi à dessein',
    bauweisen: [
      'La couleur ne porte jamais seule une information\u00a0: à côté de chaque couleur de verdict figure le verdict en toutes lettres.',
      'La démonstration animée et la lumière de la page d’accueil peuvent être mises en pause et restent immobiles si le système d’exploitation demande moins de mouvement.',
      'Les réponses terminées et les étapes de travail sont annoncées aux lecteurs d’écran.',
      'Le site se lit en allemand, en français, en italien et en anglais. Les citations de documents allemands sont balisées comme allemandes et lues ainsi.',
    ],
    grenzen: 'Limites connues',
    grenzenListe: [
      'Evidarium n’a pas encore été parcouru avec un véritable lecteur d’écran. Les annonces existent techniquement, mais n’ont pas été éprouvées à l’usage.',
      'La lisibilité d’un PDF téléversé dépend du fichier\u00a0: Evidarium refuse les pages numérisées sans couche de texte et le dit.',
      'Les traductions en français, en italien et en anglais n’ont pas été relues par des personnes de langue maternelle.',
    ],
    kontakt: 'Quelque chose ne fonctionne pas\u00a0?',
    schreib: 'Écrivez à',
    wieFehler: 'Les signalements d’obstacles sont traités comme des erreurs.',
    keineAdresse: 'L’adresse de contact n’est pas définie sur ce serveur.',
  },
  it: {
    metaTitel: 'Accessibilità – Evidarium',
    titel: 'Accessibilità',
    stand: '22 settembre 2026',
    einleitung:
      'Evidarium deve essere utilizzabile da tutti, anche con la tastiera, con un lettore di schermo, con l’ingrandimento o senza la percezione dei colori. L’obiettivo è il livello AA delle linee guida WCAG 2.2.',
    geprueft: 'Come viene verificato',
    pruefungen: [
      'Automaticamente con axe secondo WCAG 2.2 AA, in visualizzazione chiara e scura separatamente, anche nell’area riservata.',
      'A ogni modifica su tre larghezze (320, 768 e 1440 pixel) e in tre browser: Chrome, Firefox e Safari, più un iPhone con touch.',
      'Nessun testo sotto i 16 pixel, verificato nel codice sorgente e nel browser.',
      'Contrasti di testo ed elementi di comando calcolati, non stimati.',
      'Uso con la tastiera, focus visibile, collegamento diretto al contenuto.',
    ],
    gebaut: 'Che cosa è costruito così di proposito',
    bauweisen: [
      'Il colore non porta mai da solo un’informazione: accanto a ogni colore del giudizio c’è il giudizio scritto.',
      'La dimostrazione animata e la luce della pagina iniziale si possono mettere in pausa e restano ferme se il sistema operativo chiede meno movimento.',
      'Le risposte pronte e i singoli passi di lavoro vengono annunciati ai lettori di schermo.',
      'Il sito si legge in tedesco, francese, italiano e inglese. Le citazioni da documenti tedeschi sono marcate come tedesche e lette così.',
    ],
    grenzen: 'Limiti noti',
    grenzenListe: [
      'Evidarium non è ancora stato provato con un vero lettore di schermo. Gli annunci ci sono tecnicamente, ma non sono stati sperimentati nell’uso.',
      'Quanto bene si legga un PDF caricato dipende dal file: Evidarium rifiuta le pagine scansionate senza livello di testo e lo dice.',
      'Le traduzioni in francese, italiano e inglese non sono state riviste da madrelingua.',
    ],
    kontakt: 'Qualcosa non funziona?',
    schreib: 'Scriva a',
    wieFehler: 'Le segnalazioni di barriere vengono trattate come errori.',
    keineAdresse: 'L’indirizzo di contatto non è impostato su questo server.',
  },
  en: {
    metaTitel: 'Accessibility – Evidarium',
    titel: 'Accessibility',
    stand: '22 September 2026',
    einleitung:
      'Evidarium should be usable by everyone, including with a keyboard, a screen reader, magnification or without colour vision. The goal is level AA of the WCAG 2.2 guidelines.',
    geprueft: 'How this is checked',
    pruefungen: [
      'Automatically with axe against WCAG 2.2 AA, in light and dark mode separately, including the signed-in area.',
      'With every change at three widths (320, 768 and 1440 pixels) and in three browsers: Chrome, Firefox and Safari, plus an iPhone with touch.',
      'No text below 16 pixels, checked in the source code and in the browser.',
      'Contrast of text and controls calculated, not estimated.',
      'Keyboard operation, visible focus, skip link to the content.',
    ],
    gebaut: 'What is built this way on purpose',
    bauweisen: [
      'Colour never carries a message on its own: next to every verdict colour, the verdict is written out.',
      'The animated demo and the light on the start page can be paused and stand still when the operating system asks for less motion.',
      'Finished answers and the individual working steps are announced to screen readers.',
      'The site reads in German, French, Italian and English. Quotes from German documents are marked as German and read out that way.',
    ],
    grenzen: 'Known limits',
    grenzenListe: [
      'Evidarium has not yet been worked through with a real screen reader. The announcements exist technically but have not been tried in use.',
      'How well an uploaded PDF can be read depends on the file: Evidarium rejects scanned pages without a text layer and says so.',
      'The French, Italian and English translations have not been reviewed by native speakers.',
    ],
    kontakt: 'Something does not work?',
    schreib: 'Write to',
    wieFehler: 'Reports of barriers are treated like bugs.',
    keineAdresse: 'The contact address is not set on this server.',
  },
});
