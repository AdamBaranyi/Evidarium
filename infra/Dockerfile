# syntax=docker/dockerfile:1

# Ein Abbild, zwei Prozesse: Weboberfläche und Worker teilen sich denselben
# Stand. Zwei Abbilder könnten auseinanderlaufen — und genau dann stimmen
# Abschnitts-IDs und Vektoren nicht mehr zusammen.
#
# Node führt Next aus, Bun den Worker. Bun als Laufzeit für Next löst
# mehrfache Rebuilds aus (siehe IMPLEMENTATION_STATUS.md); den Worker
# dagegen startet Bun direkt aus TypeScript, ohne Übersetzungsschritt.

FROM node:24-bookworm-slim AS bun
COPY --from=oven/bun:1.3.14-slim /usr/local/bin/bun /usr/local/bin/bun

# ---------------------------------------------------------------- Pakete ---
FROM bun AS pakete
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
# --frozen-lockfile: Das Abbild bekommt genau die Fassungen aus bun.lock,
# nie eine frischere. Sonst wäre die Wartezeit aus bunfig.toml umgangen.
RUN bun install --frozen-lockfile

# ----------------------------------------------------------------- Build ---
FROM pakete AS build
WORKDIR /app
COPY . .

# Platzhalter nur für diesen einen Befehl: `next build` lädt die
# Konfigurationsprüfung und bräche ohne gültige Werte ab.
#
# Bewusst **nicht** als `ENV`: Ein ENV-Eintrag bliebe als Schicht im Abbild
# stehen und wäre in `docker inspect` zu lesen. Auch ein Platzhalter neben dem
# Namen SESSION_SECRET soll dort nicht auftauchen — sonst gewöhnt man sich
# daran, an dieser Stelle Werte zu sehen.
ENV NODE_ENV=production
RUN DATABASE_URL=postgres://build:build@127.0.0.1:5432/build \
    SESSION_SECRET=nur-fuer-den-build-mindestens-32-zeichen-lang \
    APP_ORIGIN=http://localhost:3100 \
    STORAGE_PATH=/app/storage \
    bun run build

# --------------------------------------------------------------- Laufzeit ---
FROM bun AS laufzeit
WORKDIR /app
ENV NODE_ENV=production

# Nicht als root. Das Node-Abbild bringt den Benutzer `node` mit.
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/src ./src
COPY --from=build --chown=node:node /app/scripts ./scripts
# Der Demo-Korpus wird auf dem Server geladen, nicht mitgeliefert im Volume.
COPY --from=build --chown=node:node /app/eval ./eval
COPY --from=build --chown=node:node /app/package.json /app/tsconfig.json ./

# Speicher für Uploads und Modellcache; im Betrieb liegen dort Volumes.
RUN mkdir -p /app/storage /app/.modelle && chown -R node:node /app/storage /app/.modelle

USER node
EXPOSE 3100

# Voreinstellung ist die Weboberfläche; der Worker überschreibt das Kommando.
CMD ["node", "node_modules/next/dist/bin/next", "start", "--port", "3100"]
