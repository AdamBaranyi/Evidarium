import { createServer, type Server } from 'node:http';
import { z } from 'zod';
import { EMBEDDING_DIMENSIONEN, EMBEDDING_MODELL } from '@/lib/embeddings/modell';
import { einbetten } from './embeddings';

/*
 * Interner Endpunkt, damit der Web-Prozess den Vektor einer Frage bekommt,
 * ohne selbst ein Modell zu laden (docs/ENTSCHEIDE.md, E4).
 *
 * Bewusst **kein** Job in der Queue: Die Queue ist für langlaufende Arbeit da.
 * Eine Frage einzubetten dauert Millisekunden und muss synchron beantwortet
 * werden, sonst wartet der Nutzer auf einen Umweg.
 *
 * Gebunden an 127.0.0.1. Der Endpunkt hat keine Anmeldung und darf deshalb
 * das Gerät nie verlassen; im Docker-Netz übernimmt das die Bindung, nach
 * aussen die Firewall.
 */

const Anfrage = z.object({
  texte: z.array(z.string().min(1).max(4000)).min(1).max(8),
});

const MAX_KOERPER = 64 * 1024;

export function internenEndpunktStarten(port: number): Server {
  const server = createServer((anfrage, antwort) => {
    if (anfrage.method === 'GET' && anfrage.url === '/gesundheit') {
      antwort.writeHead(200, { 'content-type': 'application/json' });
      antwort.end(JSON.stringify({ modell: EMBEDDING_MODELL, dimensionen: EMBEDDING_DIMENSIONEN }));
      return;
    }

    if (anfrage.method !== 'POST' || anfrage.url !== '/einbetten') {
      antwort.writeHead(404).end();
      return;
    }

    let koerper = '';
    let zuGross = false;

    anfrage.on('data', (teil: Buffer) => {
      if (zuGross) return;
      koerper += teil.toString('utf8');
      if (koerper.length > MAX_KOERPER) {
        zuGross = true;
        antwort.writeHead(413).end();
        anfrage.destroy();
      }
    });

    anfrage.on('end', () => {
      if (zuGross) return;
      void (async () => {
        try {
          const geprueft = Anfrage.safeParse(JSON.parse(koerper));
          if (!geprueft.success) {
            antwort.writeHead(400, { 'content-type': 'application/json' });
            antwort.end(JSON.stringify({ fehler: 'ungueltige Anfrage' }));
            return;
          }

          const vektoren = await einbetten(geprueft.data.texte, 'frage');
          antwort.writeHead(200, { 'content-type': 'application/json' });
          antwort.end(JSON.stringify({ vektoren }));
        } catch (fehler) {
          console.error('[worker/http] Fehler', fehler);
          antwort.writeHead(500, { 'content-type': 'application/json' });
          antwort.end(JSON.stringify({ fehler: 'intern' }));
        }
      })();
    });
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(`[worker/http] interner Endpunkt auf 127.0.0.1:${port}`);
  });

  return server;
}
