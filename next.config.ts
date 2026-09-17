import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Ab Next 16.3 schreibt `next dev` verwaltete Blöcke in AGENTS.md und
  // CLAUDE.md des Projekts. Das Repository ist öffentlich und soll keine
  // Werkzeugspuren tragen.
  agentRules: false,

  // Typfehler brechen den Build. Den Schlüssel `eslint` gibt es in Next 16
  // nicht mehr — `next build` ruft ESLint nicht mehr auf. Der eigene
  // Lint-Schritt in .github/workflows/ci.yml ersetzt das.
  typescript: { ignoreBuildErrors: false },

  // Next erwartet hier ein Promise. Ohne `await` im Rumpf wäre `async` nur
  // Dekoration, darum ausdrücklich Promise.resolve.
  headers: () =>
    Promise.resolve([
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ]),
};

export default nextConfig;
