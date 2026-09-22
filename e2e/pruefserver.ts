/*
 * Der Server, gegen den beide Playwright-Configs prüfen.
 *
 * In der CI hat der Build-Schritt davor schon gebaut; ein zweiter Build
 * kostet nur Zeit. Die Herkunftsprüfung vergleicht mit `APP_ORIGIN`: Läuft
 * der Prüfserver auf einem anderen Port als in `.env`, lehnte sie sonst jede
 * Frage der Demo ab — zu Recht.
 */
export function pruefserver(port: number) {
  return {
    command: process.env.CI
      ? `bunx next start --port ${port}`
      : `bun run build && bunx next start --port ${port}`,
    url: `http://localhost:${port}`,
    env: { APP_ORIGIN: `http://localhost:${port}` },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  };
}
