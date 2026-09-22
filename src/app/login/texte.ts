import { texte } from '@/lib/i18n/texte';

export const ANMELDUNG = texte({
  de: {
    metaTitel: 'Anmelden – Evidarium',
    titel: 'Anmelden',
    email: 'E-Mail',
    passwort: 'Passwort',
    knopf: 'Anmelden',
    laeuft: 'Wird geprüft …',
    beispiel: 'Beispiel einer Fundstelle',
    beispielText:
      'So sieht ein Beleg aus: der ganze Abschnitt, das Zitat an seiner Stelle. Beispiel aus dem Korpus der erfundenen Firma Nordstern Digital.',
    fehler: {
      abgelehnt: 'Anfrage abgelehnt.',
      falsch: 'E-Mail oder Passwort stimmt nicht.',
      zuViele: 'Zu viele Versuche. Bitte in 15 Minuten erneut probieren.',
    },
  },
  fr: {
    metaTitel: 'Connexion – Evidarium',
    titel: 'Se connecter',
    email: 'E-mail',
    passwort: 'Mot de passe',
    knopf: 'Se connecter',
    laeuft: 'Vérification …',
    beispiel: 'Exemple de passage',
    beispielText:
      'Voici à quoi ressemble une preuve\u00a0: le passage entier, la citation à sa place. Exemple tiré du corpus de l’entreprise fictive Nordstern Digital, en allemand.',
    fehler: {
      abgelehnt: 'Requête refusée.',
      falsch: 'E-mail ou mot de passe incorrect.',
      zuViele: 'Trop de tentatives. Veuillez réessayer dans 15\u00a0minutes.',
    },
  },
  it: {
    metaTitel: 'Accesso – Evidarium',
    titel: 'Accedi',
    email: 'E-mail',
    passwort: 'Password',
    knopf: 'Accedi',
    laeuft: 'Verifica in corso …',
    beispiel: 'Esempio di passaggio',
    beispielText:
      'Ecco come appare una prova: il passaggio intero, la citazione al suo posto. Esempio tratto dal corpus dell’azienda fittizia Nordstern Digital, in tedesco.',
    fehler: {
      abgelehnt: 'Richiesta respinta.',
      falsch: 'E-mail o password non corretti.',
      zuViele: 'Troppi tentativi. Riprovi tra 15 minuti.',
    },
  },
  en: {
    metaTitel: 'Sign in – Evidarium',
    titel: 'Sign in',
    email: 'Email',
    passwort: 'Password',
    knopf: 'Sign in',
    laeuft: 'Checking …',
    beispiel: 'Example of a passage',
    beispielText:
      'This is what a citation looks like: the whole passage, the quote in its place. Example from the corpus of the fictitious company Nordstern Digital, in German.',
    fehler: {
      abgelehnt: 'Request rejected.',
      falsch: 'Email or password is incorrect.',
      zuViele: 'Too many attempts. Please try again in 15 minutes.',
    },
  },
});
