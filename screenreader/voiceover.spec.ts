import { voiceOverTest as test, type VoiceOverPlaywright } from '@guidepup/playwright';
import { expect } from '@playwright/test';
import { demoOeffnen } from '../e2e/demo-oeffnen';

/*
 * Was VoiceOver tatsächlich sagt — nicht, was im Barrierefreiheitsbaum
 * steht. axe prüft Regeln; hier wird geprüft, ob die Ansagen ankommen, auf
 * die sich jemand ohne Bildschirm verlässt: die Hauptüberschrift, die
 * fertige Antwort, das Urteil als Wort, jeder Schritt des Rundgangs.
 *
 * VoiceOver läuft in der CI auf Englisch; die Rollen heissen darum
 * «heading», die Inhalte bleiben deutsch. Geprüft wird auf Inhalte, nicht auf
 * den genauen Wortlaut von VoiceOver — der ändert sich mit jeder macOS-Fassung.
 */

/*
 * Wartet, bis VoiceOver etwas gesagt hat, das zum Muster passt. Ansagen aus
 * Live-Regionen kommen ohne Befehl; `capture` mit einer leeren Aktion liest
 * jeweils ab, was VoiceOver zuletzt gesagt hat.
 */
async function hoeren(voiceOver: VoiceOverPlaywright, muster: RegExp): Promise<string> {
  for (let versuch = 0; versuch < 20; versuch++) {
    const gesagt = (await voiceOver.spokenPhraseLog()).join(' | ');
    if (muster.test(gesagt)) return gesagt;
    await voiceOver.capture(() => new Promise((fertig) => setTimeout(fertig, 500)));
  }
  return (await voiceOver.spokenPhraseLog()).join(' | ');
}

/** Springt von Überschrift zu Überschrift, bis eine passt. */
async function ueberschrift(voiceOver: VoiceOverPlaywright, muster: RegExp): Promise<string> {
  for (let schritt = 0; schritt < 20; schritt++) {
    const text = await voiceOver.itemText();
    if (muster.test(text)) return text;
    await voiceOver.nextHeading();
  }
  return voiceOver.itemText();
}

test('Startseite: VoiceOver liest die Hauptüberschrift', async ({ page, voiceOver }) => {
  await page.goto('/', { waitUntil: 'load' });
  await page.getByRole('heading', { level: 1 }).waitFor();
  await voiceOver.navigateToWebContent();

  const text = await ueberschrift(voiceOver, /Antworten aus deinen Dokumenten/);
  expect(text).toContain('Antworten aus deinen Dokumenten');
  expect(text).toMatch(/heading level 1/i);
});

test('Demo: die fertige Antwort wird angesagt, das Urteil steht als Wort', async ({
  page,
  voiceOver,
}) => {
  await demoOeffnen(page);
  const vorschlag = page.getByRole('button', { name: /Wer hilft beim Onboarding/ });
  await vorschlag.waitFor();
  await voiceOver.navigateToWebContent();
  await voiceOver.clearSpokenPhraseLog();

  await voiceOver.capture(() => vorschlag.click());
  const gesagt = await hoeren(voiceOver, /Antwort da/);
  expect(gesagt).toMatch(/Antwort da: (Belegt|Teilweise belegt|Keine Grundlage|Widerspruch)/);

  // Die Farbe des Urteils trägt nie allein: Das Urteil ist eine Überschrift mit Wort.
  await page.getByRole('button', { name: 'Neu beginnen' }).waitFor();
  await voiceOver.navigateToWebContent();
  const urteil = await ueberschrift(voiceOver, /heading level 3/i);
  expect(urteil).toMatch(/Belegt|Teilweise belegt|Keine Grundlage|Widerspruch/);
});

test.describe('Rundgang', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('jeder Schritt wird angesagt', async ({ page, voiceOver }) => {
    await demoOeffnen(page);
    const dialog = page.getByRole('dialog', { name: 'Rundgang durch Evidarium' });
    const weiter = dialog.getByRole('button', { name: 'Weiter' });
    await expect(weiter).toBeFocused();
    await voiceOver.navigateToWebContent();
    await weiter.focus();
    await voiceOver.clearSpokenPhraseLog();

    await voiceOver.capture(() => page.keyboard.press('Enter'));
    const gesagt = await hoeren(voiceOver, /Schritt 2 von 6|Die Dokumente/);
    expect(gesagt).toMatch(/Schritt 2 von 6|Die Dokumente/);
  });
});
