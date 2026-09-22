/*
 * Der Rundgang (E43) kommt beim ersten Besuch von selbst und legt sich als
 * modaler Dialog über die Seite. Tests, die nicht ihn prüfen, beginnen darum
 * als Besucher, die ihn schon kennen — für beide Playwright-Configs.
 */
export function rundgangGesehen(herkunft: string) {
  return {
    cookies: [],
    origins: [
      {
        origin: herkunft,
        localStorage: [
          { name: 'evidarium.rundgang.demo', value: 'gesehen' },
          { name: 'evidarium.rundgang.app', value: 'gesehen' },
        ],
      },
    ],
  };
}
