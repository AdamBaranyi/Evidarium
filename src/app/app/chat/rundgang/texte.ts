import { texte } from '@/lib/i18n/texte';

/*
 * Der Rundgang (E43). Jeder Satz beschreibt, was auf dem Bildschirm steht —
 * ändert sich die Oberfläche, muss er mit. Die Namen der Urteile kommen
 * nicht von hier, sondern aus `URTEIL`: So heisst ein Urteil im Rundgang
 * genau so wie in der Antwort.
 */
export const RUNDGANG = texte({
  de: {
    knopf: 'Rundgang',
    dialog: 'Rundgang durch Evidarium',
    fortschritt: (n: number, von: number) => `Schritt ${n} von ${von}`,
    weiter: 'Weiter',
    zurueck: 'Zurück',
    fertig: 'Loslegen',
    beenden: 'Beenden',
    zitieren: (wort: string) => `«${wort}»`,
    schritte: {
      willkommenDemo: {
        titel: 'Was Evidarium tut',
        text: 'Evidarium beantwortet Fragen aus Dokumenten und zeigt zu jeder Aussage die Stelle, auf der sie steht. Was die Dokumente nicht hergeben, sagt es offen, statt zu raten. Der Rundgang zeigt, wo was steht.',
      },
      willkommen: {
        titel: 'Was Evidarium tut',
        text: 'Evidarium beantwortet Fragen aus deinen Dokumenten und zeigt zu jeder Aussage die Stelle, auf der sie steht. Was die Dokumente nicht hergeben, sagt es offen, statt zu raten. Der Rundgang zeigt, wo was steht.',
      },
      korpus: {
        titel: 'Die Dokumente',
        text: 'Durchsucht werden die Beispieldokumente der erfundenen Firma Nordstern Digital. Nach einer Antwort zeigt hier ein farbiger Punkt, auf welche Dokumente sie sich stützt.',
      },
      hochladen: {
        titel: 'Dokumente und Projekte',
        text: 'Unter «Dokumente» lädst du Dateien hoch: PDF mit Textschicht, TXT oder Markdown. Evidarium liest sie ein und macht sie durchsuchbar. Dort legst du auch Projekte an, also Gruppen von Dokumenten zu einem Thema.',
      },
      auswahl: {
        titel: 'Worin gesucht wird',
        text: 'Hier wählst du, was durchsucht wird: ein Projekt oder einzelne Dokumente. Ein anderes Projekt beginnt ein neues Gespräch; gespeichert wird keines. Nach einer Antwort zeigt ein farbiger Punkt, auf welche Dokumente sie sich stützt.',
      },
      vorschlaege: {
        titel: 'Fragen',
        text: 'Fang mit einer dieser Fragen an. Jede ist ein Fall aus der Evaluation, daneben steht, was an ihm besonders ist. Oder schreib unten eine eigene, auf Deutsch, Französisch, Italienisch oder Englisch.',
      },
      fragen: {
        titel: 'Fragen',
        text: 'Schreib deine Frage in eigenen Worten, auf Deutsch, Französisch, Italienisch oder Englisch. Während Evidarium arbeitet, siehst du jeden Schritt: suchen, antworten, Belege prüfen.',
      },
      urteile: {
        titel: 'Das Urteil',
        text: (namen: string) =>
          `Jede Antwort bekommt ein Urteil: ${namen}. Darunter liegen die Belege mit dem wörtlichen Zitat; ein Klick öffnet die Stelle im Dokument. Farbe steht in Evidarium nur für das Urteil.`,
      },
      eigene: {
        titel: 'Eigene Dateien',
        text: (stunden: number) =>
          `Lade eine eigene Datei hoch und frag darin: PDF mit Textschicht, TXT oder Markdown. Sie wird nach ${stunden} Stunden gelöscht; lade darum nichts Vertrauliches hoch.`,
      },
      ende: {
        titel: 'Jetzt du',
        text: 'Stell deine erste Frage. Den Rundgang startest du hier jederzeit neu.',
      },
    },
  },
  fr: {
    knopf: 'Visite guidée',
    dialog: 'Visite guidée d’Evidarium',
    fortschritt: (n: number, von: number) => `Étape ${n} sur ${von}`,
    weiter: 'Suivant',
    zurueck: 'Retour',
    fertig: 'Commencer',
    beenden: 'Terminer',
    zitieren: (wort: string) => `«\u00a0${wort}\u00a0»`,
    schritte: {
      willkommenDemo: {
        titel: 'Ce que fait Evidarium',
        text: 'Evidarium répond à des questions à partir de documents et montre, pour chaque affirmation, le passage sur lequel elle repose. Ce que les documents ne disent pas, il le dit franchement au lieu de deviner. La visite montre où se trouve quoi.',
      },
      willkommen: {
        titel: 'Ce que fait Evidarium',
        text: 'Evidarium répond à des questions à partir de vos documents et montre, pour chaque affirmation, le passage sur lequel elle repose. Ce que les documents ne disent pas, il le dit franchement au lieu de deviner. La visite montre où se trouve quoi.',
      },
      korpus: {
        titel: 'Les documents',
        text: 'La recherche porte sur les documents d’exemple de l’entreprise fictive Nordstern Digital, rédigés en allemand. Après une réponse, un point de couleur indique ici les documents sur lesquels elle s’appuie.',
      },
      hochladen: {
        titel: 'Documents et projets',
        text: 'Sous «\u00a0Documents\u00a0», vous téléversez des fichiers\u00a0: PDF avec couche de texte, TXT ou Markdown. Evidarium les lit et les rend consultables. Vous y créez aussi des projets, c’est-à-dire des groupes de documents sur un même thème.',
      },
      auswahl: {
        titel: 'Où chercher',
        text: 'Ici, vous choisissez ce qui est recherché\u00a0: un projet ou des documents précis. Changer de projet commence une nouvelle conversation\u00a0; aucune n’est enregistrée. Après une réponse, un point de couleur indique les documents sur lesquels elle s’appuie.',
      },
      vorschlaege: {
        titel: 'Questions',
        text: 'Commencez par l’une de ces questions. Chacune est un cas de l’évaluation, et à côté figure ce qu’il a de particulier. Ou écrivez la vôtre en bas, en français, en allemand, en italien ou en anglais.',
      },
      fragen: {
        titel: 'Questions',
        text: 'Posez votre question avec vos propres mots, en français, en allemand, en italien ou en anglais. Pendant qu’Evidarium travaille, vous voyez chaque étape\u00a0: recherche, réponse, vérification des citations.',
      },
      urteile: {
        titel: 'Le verdict',
        text: (namen: string) =>
          `Chaque réponse reçoit un verdict\u00a0: ${namen}. En dessous figurent les citations littérales\u00a0; un clic ouvre le passage dans le document. Dans Evidarium, la couleur ne sert qu’au verdict.`,
      },
      eigene: {
        titel: 'Vos fichiers',
        text: (stunden: number) =>
          `Téléversez un fichier et interrogez-le\u00a0: PDF avec couche de texte, TXT ou Markdown. Il est supprimé après ${stunden}\u00a0heures\u00a0; n’y mettez donc rien de confidentiel.`,
      },
      ende: {
        titel: 'À vous',
        text: 'Posez votre première question. Vous pouvez relancer la visite ici à tout moment.',
      },
    },
  },
  it: {
    knopf: 'Visita guidata',
    dialog: 'Visita guidata di Evidarium',
    fortschritt: (n: number, von: number) => `Passo ${n} di ${von}`,
    weiter: 'Avanti',
    zurueck: 'Indietro',
    fertig: 'Iniziare',
    beenden: 'Terminare',
    zitieren: (wort: string) => `«${wort}»`,
    schritte: {
      willkommenDemo: {
        titel: 'Che cosa fa Evidarium',
        text: 'Evidarium risponde a domande sulla base di documenti e mostra, per ogni affermazione, il passo su cui si fonda. Ciò che i documenti non dicono, lo dichiara apertamente invece di tirare a indovinare. La visita mostra dove si trova cosa.',
      },
      willkommen: {
        titel: 'Che cosa fa Evidarium',
        text: 'Evidarium risponde a domande sulla base dei Suoi documenti e mostra, per ogni affermazione, il passo su cui si fonda. Ciò che i documenti non dicono, lo dichiara apertamente invece di tirare a indovinare. La visita mostra dove si trova cosa.',
      },
      korpus: {
        titel: 'I documenti',
        text: 'La ricerca riguarda i documenti di esempio dell’azienda fittizia Nordstern Digital, redatti in tedesco. Dopo una risposta, un punto colorato indica qui su quali documenti si basa.',
      },
      hochladen: {
        titel: 'Documenti e progetti',
        text: 'In «Documenti» può caricare file: PDF con livello di testo, TXT o Markdown. Evidarium li legge e li rende consultabili. Lì può anche creare progetti, cioè gruppi di documenti su un tema.',
      },
      auswahl: {
        titel: 'Dove cercare',
        text: 'Qui sceglie che cosa viene cercato: un progetto o singoli documenti. Cambiare progetto avvia una nuova conversazione; nessuna viene salvata. Dopo una risposta, un punto colorato indica su quali documenti si basa.',
      },
      vorschlaege: {
        titel: 'Domande',
        text: 'Cominci da una di queste domande. Ognuna è un caso della valutazione, e accanto c’è ciò che ha di particolare. Oppure scriva la Sua qui sotto, in italiano, tedesco, francese o inglese.',
      },
      fragen: {
        titel: 'Domande',
        text: 'Scriva la domanda con parole Sue, in italiano, tedesco, francese o inglese. Mentre Evidarium lavora, vede ogni passo: ricerca, risposta, verifica delle citazioni.',
      },
      urteile: {
        titel: 'Il giudizio',
        text: (namen: string) =>
          `Ogni risposta riceve un giudizio: ${namen}. Sotto ci sono le citazioni letterali; un clic apre il passo nel documento. In Evidarium il colore serve solo al giudizio.`,
      },
      eigene: {
        titel: 'I Suoi file',
        text: (stunden: number) =>
          `Carichi un file e faccia domande su di esso: PDF con livello di testo, TXT o Markdown. Viene eliminato dopo ${stunden} ore; non carichi quindi nulla di riservato.`,
      },
      ende: {
        titel: 'Tocca a Lei',
        text: 'Faccia la Sua prima domanda. Qui può riavviare la visita in qualsiasi momento.',
      },
    },
  },
  en: {
    knopf: 'Tour',
    dialog: 'Tour of Evidarium',
    fortschritt: (n: number, von: number) => `Step ${n} of ${von}`,
    weiter: 'Next',
    zurueck: 'Back',
    fertig: 'Get started',
    beenden: 'End tour',
    zitieren: (wort: string) => `“${wort}”`,
    schritte: {
      willkommenDemo: {
        titel: 'What Evidarium does',
        text: 'Evidarium answers questions from documents and shows, for every statement, the passage it rests on. When the documents do not say something, it says so plainly instead of guessing. The tour shows where everything is.',
      },
      willkommen: {
        titel: 'What Evidarium does',
        text: 'Evidarium answers questions from your documents and shows, for every statement, the passage it rests on. When the documents do not say something, it says so plainly instead of guessing. The tour shows where everything is.',
      },
      korpus: {
        titel: 'The documents',
        text: 'The search covers the sample documents of Nordstern Digital, a made-up company, written in German. After an answer, a coloured dot here shows which documents it rests on.',
      },
      hochladen: {
        titel: 'Documents and projects',
        text: 'Under “Documents” you upload files: PDF with a text layer, TXT or Markdown. Evidarium reads them and makes them searchable. That is also where you create projects, which are groups of documents on one topic.',
      },
      auswahl: {
        titel: 'Where to search',
        text: 'Here you choose what gets searched: a project or single documents. Switching projects starts a new conversation; none is stored. After an answer, a coloured dot shows which documents it rests on.',
      },
      vorschlaege: {
        titel: 'Questions',
        text: 'Start with one of these questions. Each is a case from the evaluation, and next to it you see what makes it special. Or write your own below, in English, German, French or Italian.',
      },
      fragen: {
        titel: 'Questions',
        text: 'Ask in your own words, in English, German, French or Italian. While Evidarium works, you see every step: searching, answering, checking the evidence.',
      },
      urteile: {
        titel: 'The verdict',
        text: (namen: string) =>
          `Every answer gets a verdict: ${namen}. Below it are the verbatim quotes; a click opens the passage in the document. In Evidarium, colour stands for the verdict only.`,
      },
      eigene: {
        titel: 'Your own files',
        text: (stunden: number) =>
          `Upload a file of your own and ask about it: PDF with a text layer, TXT or Markdown. It is deleted after ${stunden} hours, so do not upload anything confidential.`,
      },
      ende: {
        titel: 'Your turn',
        text: 'Ask your first question. You can restart the tour here at any time.',
      },
    },
  },
});
