import { korpusLaden } from '../eval/laden';
import { env } from '@/lib/config/env';
import { queueStoppen } from '@/lib/jobs/queue';

/*
 * Befüllt das Demo-Konto mit demselben Korpus, den auch die Evaluation
 * benutzt.
 *
 *   bun --env-file=.env scripts/demo-korpus-laden.ts
 *
 * Derselbe Korpus mit Absicht: Die Evaluation weist nach, dass diese
 * Dokumente die zwölf Fälle korrekt beantworten — darunter die beiden
 * Widersprüche und die beiden Injektionsversuche. Wer die Demo ausprobiert,
 * kann genau diese Fälle nachstellen und das Ergebnis im Protokoll
 * nachlesen.
 *
 * Der Worker muss laufen; das Einlesen geht über die Jobqueue.
 */

const { dokumente } = await korpusLaden(env.DEMO_KONTO);
console.log(`Demo-Korpus in ${env.DEMO_KONTO}: ${dokumente.length} Dokumente`);
for (const d of dokumente) console.log(`  ${d.datei}`);

await queueStoppen();
process.exit(0);
