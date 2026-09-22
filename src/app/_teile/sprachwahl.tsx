import { sprache } from '@/lib/i18n/server';
import { SPRACHEN, SPRACHNAME } from '@/lib/i18n/sprachen';
import { spracheSetzen } from './sprache-aktion';
import { GEMEINSAM } from './texte';

/*
 * Die Sprachwahl in der Kopfzeile: vier Knöpfe statt einer Auswahlliste.
 *
 * Eine Liste, die beim Ändern die ganze Seite umschreibt, verletzte WCAG
 * 3.2.2 — die Änderung einer Einstellung darf nicht von selbst den Kontext
 * wechseln. Ein Knopf ist ein ausdrücklicher Schritt. Er funktioniert auch
 * ohne JavaScript, weil er ein Formular abschickt.
 *
 * Jeder Knopf trägt den Namen der Sprache in ihr selbst und `lang` dazu —
 * so liest ein Screenreader «Français» französisch vor.
 */
export async function Sprachwahl({ rechts = false }: { rechts?: boolean }) {
  const aktiv = await sprache();
  return (
    <form
      action={spracheSetzen}
      role="group"
      aria-label={GEMEINSAM[aktiv].sprachwahl}
      className={`sprachwahl ${rechts ? 'ms-auto' : ''}`}
    >
      {SPRACHEN.map((wahl) => (
        <button
          key={wahl}
          type="submit"
          name="sprache"
          value={wahl}
          lang={wahl}
          aria-label={SPRACHNAME[wahl]}
          aria-current={wahl === aktiv ? 'true' : undefined}
        >
          {wahl.toUpperCase()}
        </button>
      ))}
    </form>
  );
}
