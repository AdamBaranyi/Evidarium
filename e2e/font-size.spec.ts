import { expect, test } from '@playwright/test';

/*
 * Der Gegenpart zu scripts/check-font-floor.mjs: Das Skript liest den
 * Quelltext, dieser Test misst, was der Browser wirklich rechnet — inklusive
 * Vererbtem und Zusammengesetztem, auf jeder Prüfbreite.
 */
const MIN_PX = 16;
const SEITEN = ['/', '/login'];

// `/demo` wird getrennt geprüft: Die Seite gibt es nur, wenn die Demo
// eingeschaltet **und** befüllt ist.

for (const pfad of SEITEN) {
  test(`keine Schrift unter ${MIN_PX} px auf ${pfad}`, async ({ page }) => {
    await page.goto(pfad);

    const zuKlein = await page.evaluate((min) => {
      const treffer: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>('body *')) {
        if (el.offsetParent === null && el.tagName !== 'BODY') continue;
        const text = el.textContent?.trim();
        if (!text) continue;
        // Nur Elemente mit eigenem Text, sonst zählt jeder Container mit.
        const eigenerText = Array.from(el.childNodes).some(
          (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim(),
        );
        if (!eigenerText) continue;
        const px = parseFloat(getComputedStyle(el).fontSize);
        if (px < min) treffer.push(`${el.tagName.toLowerCase()} ${px}px: ${text.slice(0, 40)}`);
      }
      return treffer;
    }, MIN_PX);

    expect(zuKlein, `Zu kleine Schrift auf ${pfad}`).toEqual([]);
  });

  test(`kein Querscrollen auf ${pfad}`, async ({ page }) => {
    await page.goto(pfad);
    const ueberbreit = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(ueberbreit).toBe(false);
  });
}
