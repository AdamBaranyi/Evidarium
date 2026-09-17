import { and, count, eq, gte, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { usageEvents } from '@/lib/db/schema';
import { env } from '@/lib/config/env';
import { kostenSchaetzen, maximalkosten, modellHatPreis, PREISSTAND } from './preise';

/*
 * Drei Grenzen übereinander: Fragen je Sitzung, Ausgaben je Tag, Ausgaben je
 * Monat. Sie greifen unabhängig voneinander — wer den Tagesdeckel erreicht,
 * wartet bis morgen; wer den Monatsdeckel erreicht, bis nächsten Monat.
 *
 * Eine erreichte Grenze ist **kein Fehler**. Wer dagegenläuft, hat nichts
 * falsch gemacht und bekommt einen freundlichen Satz, keinen roten Kasten.
 */

export type BudgetAblehnung =
  | { grund: 'sitzung'; nachricht: string }
  | { grund: 'tag'; nachricht: string }
  | { grund: 'monat'; nachricht: string }
  | { grund: 'kein_preis'; nachricht: string };

export type Reservierung = { id: string };

/** In Mikro-Dollar rechnen: Rundungsfehler summieren sich sonst über Monate. */
function mikro(usd: number): number {
  return Math.ceil(usd * 1_000_000);
}

function ausMikro(wert: number): number {
  return wert / 1_000_000;
}

/**
 * Die Verbindung wird **immer hereingereicht**, nie aus dem globalen `db`
 * geholt.
 *
 * Warum das zählt: Innerhalb einer Transaktion würde `db` eine **zweite**
 * Verbindung aus dem Pool ziehen. Bei gleichzeitigen Anfragen belegen die
 * Transaktionen dann den ganzen Pool und warten alle auf eine weitere
 * Verbindung, die nie frei wird — ein Deadlock, der erst unter Last auftritt
 * und im Einzeltest unsichtbar bleibt. Gefunden am 17.09.2026 durch den
 * Parallelitätstest.
 */
type Verbindung = Pick<typeof db, 'select'>;

async function summeSeit(verbindung: Verbindung, seit: Date): Promise<number> {
  const [zeile] = await verbindung
    .select({ summe: sql<number>`coalesce(sum(${usageEvents.kostenMikroUsd}), 0)::bigint` })
    .from(usageEvents)
    .where(gte(usageEvents.createdAt, seit));
  return Number(zeile?.summe ?? 0);
}

function tagesbeginn(): Date {
  const jetzt = new Date();
  return new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate());
}

function monatsbeginn(): Date {
  const jetzt = new Date();
  return new Date(jetzt.getFullYear(), jetzt.getMonth(), 1);
}

/**
 * Reserviert das geschätzte Maximalbudget **vor** dem Aufruf.
 *
 * Alles in einer Transaktion mit Advisory Lock: Ohne die Serialisierung
 * sähen zehn gleichzeitige Fragen jeweils noch Luft und überzögen den Deckel
 * gemeinsam. Der Lock gilt nur für die Dauer der Transaktion, nicht für den
 * Modellaufruf selbst.
 */
export async function reservieren(
  userId: string,
  sessionId: string | null,
  modell: string,
  maxEingabeTokens: number,
  maxAusgabeTokens: number,
): Promise<Reservierung | BudgetAblehnung> {
  // Ohne bekannten Preis bleibt der Live-Modus gesperrt. Lieber keine
  // Antwort als eine, deren Kosten niemand kennt.
  if (!modellHatPreis(modell)) {
    return {
      grund: 'kein_preis',
      nachricht:
        'Für dieses Modell ist kein Preis hinterlegt. Der Live-Modus bleibt gesperrt, bis er eingetragen ist.',
    };
  }

  const hoechstkosten = maximalkosten(modell, maxEingabeTokens, maxAusgabeTokens) ?? 0;

  return db.transaction(async (tx) => {
    // Ein Lock für alle Budgetprüfungen: Die Deckel gelten anwendungsweit.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('evidarium-budget'))`);

    if (sessionId !== null) {
      const [zeile] = await tx
        .select({ anzahl: count() })
        .from(usageEvents)
        .where(and(eq(usageEvents.sessionId, sessionId), eq(usageEvents.operation, 'antwort')));

      if ((zeile?.anzahl ?? 0) >= env.FRAGEN_JE_SITZUNG) {
        return {
          grund: 'sitzung' as const,
          nachricht: `Diese Sitzung hat ihr Kontingent von ${env.FRAGEN_JE_SITZUNG} Fragen erreicht. Melde dich neu an, um weiterzufragen.`,
        };
      }
    }

    const tag = await summeSeit(tx, tagesbeginn());
    if (tag + mikro(hoechstkosten) > mikro(env.BUDGET_TAG_USD)) {
      return {
        grund: 'tag' as const,
        nachricht: 'Die Demo hat ihr Tagesbudget erreicht. Morgen geht es weiter.',
      };
    }

    const monat = await summeSeit(tx, monatsbeginn());
    if (monat + mikro(hoechstkosten) > mikro(env.BUDGET_MONAT_USD)) {
      return {
        grund: 'monat' as const,
        nachricht: 'Die Demo hat ihr Monatsbudget erreicht. Nächsten Monat geht es weiter.',
      };
    }

    const [neu] = await tx
      .insert(usageEvents)
      .values({
        userId,
        sessionId,
        operation: 'antwort',
        status: 'reserviert',
        modell,
        kostenMikroUsd: mikro(hoechstkosten),
        preisstand: PREISSTAND,
      })
      .returning({ id: usageEvents.id });

    if (!neu) throw new Error('Reservierung konnte nicht angelegt werden');
    return { id: neu.id };
  });
}

/**
 * Rechnet nach dem Aufruf mit den gemessenen Werten ab.
 */
export async function abrechnen(
  reservierung: Reservierung,
  modell: string,
  eingabeTokens: number,
  ausgabeTokens: number,
): Promise<void> {
  const kosten = kostenSchaetzen(modell, eingabeTokens, ausgabeTokens) ?? 0;

  await db
    .update(usageEvents)
    .set({
      status: 'abgerechnet',
      modell,
      eingabeTokens,
      ausgabeTokens,
      kostenMikroUsd: mikro(kosten),
    })
    .where(eq(usageEvents.id, reservierung.id));
}

/**
 * Für den Fall, dass der Aufruf ohne verwertbare Nutzungsdaten endet — etwa
 * nach einer Zeitüberschreitung.
 *
 * **Die Reservierung bleibt stehen.** Sie wird als `unklar` markiert, nicht
 * gelöscht: Fehlende Messwerte sind keine Nullkosten, und der Anbieter kann
 * die Anfrage sehr wohl verarbeitet haben.
 */
export async function alsUnklarMarkieren(reservierung: Reservierung): Promise<void> {
  await db.update(usageEvents).set({ status: 'unklar' }).where(eq(usageEvents.id, reservierung.id));
}

export type Nutzungsstand = {
  tagUsd: number;
  monatUsd: number;
  tagGrenzeUsd: number;
  monatGrenzeUsd: number;
};

export async function nutzungsstand(): Promise<Nutzungsstand> {
  return {
    tagUsd: ausMikro(await summeSeit(db, tagesbeginn())),
    monatUsd: ausMikro(await summeSeit(db, monatsbeginn())),
    tagGrenzeUsd: env.BUDGET_TAG_USD,
    monatGrenzeUsd: env.BUDGET_MONAT_USD,
  };
}
