import { Betreiber } from '../_teile/textseite';
import { env } from '@/lib/config/env';
import { DEMO_GRENZEN } from '@/lib/demo/grenzen';

/* L’informativa sulla protezione dei dati in italiano — traduzione; fa fede solo il tedesco. */
export function DatenschutzIt({ live }: { live: boolean }) {
  return (
    <>
      <p>
        Questa pagina indica quali dati tratta Evidarium, a quale scopo, a chi vengono comunicati e
        quando vengono cancellati. Si applica la legge svizzera sulla protezione dei dati.
      </p>

      <h2>Responsabile</h2>
      <Betreiber
        name={env.BETREIBER_NAME}
        adresse={env.BETREIBER_ADRESSE}
        email={env.BETREIBER_EMAIL}
      />

      <h2>Che cosa non succede</h2>
      <ul>
        <li>Nessuna pubblicità, nessuno strumento di analisi, nessun tracciamento.</li>
        <li>
          Nessuna richiesta a server di terzi quando si apre la pagina; anche i caratteri sono
          ospitati qui.
        </li>
        <li>Nessuna vendita e nessuna trasmissione per altri scopi.</li>
      </ul>

      <h2>Hosting e protocolli del server</h2>
      <p>
        Evidarium funziona su un proprio server presso FSIT (fsit.ch) in Svizzera. FSIT mette a
        disposizione la macchina e tratta i dati su mio incarico.
      </p>
      <p>
        A ogni richiamo il server registra dati tecnici: indirizzo IP, data e ora, indirizzo
        richiamato, codice di stato, quantità di dati trasferita e identificazione del browser. È
        necessario per fornire la pagina, trovare errori e respingere attacchi. I dati non vengono
        combinati con altri e sono cancellati dopo 14 giorni.
      </p>

      <h2>Lingua</h2>
      <p>
        Se sceglie una lingua in alto, un cookie «evidarium_sprache» la memorizza per un anno.
        Contiene solo la sigla della lingua. Senza una Sua scelta la lingua segue le impostazioni
        del Suo browser e non nasce alcun cookie.
      </p>

      <h2>Demo pubblica</h2>
      <ul>
        <li>
          <strong>Cookie</strong> «evidarium_demo», 30 giorni: conta le domande per visita. Viene
          salvato solo un valore hash, non il valore stesso. Il cookie è tecnicamente necessario per
          la limitazione; per questo non c’è alcuna richiesta di consenso.
        </li>
        <li>
          <strong>Indirizzo IP</strong>, solo come valore hash, per il limite per provenienza e
          giorno. Il valore hash viene rimosso dopo 24 ore.
        </li>
        <li>
          <strong>I Suoi file</strong>: il file, il testo letto e i vettori di ricerca si trovano
          sul server e vengono cancellati automaticamente dopo {DEMO_GRENZEN.stunden} ore. Gli altri
          visitatori non li vedono. Non carichi documenti confidenziali o personali.
        </li>
      </ul>

      <h2>Account</h2>
      <p>
        Gli account vengono creati a mano dal gestore. Vengono salvati l’indirizzo e-mail e un hash
        della password (Argon2id), mai la password. Un accesso dura sette giorni grazie a un cookie
        tecnicamente necessario. Gli accessi falliti vengono contati per provenienza, solo come
        valore hash.
      </p>
      <p>
        I documenti caricati e i nomi dei progetti in cui li ordina restano salvati finché non li
        elimina. <strong>Domande e risposte non vengono salvate</strong> — una conversazione esiste
        solo finché la pagina è aperta.
      </p>

      {live && (
        <>
          <h2>Risposte tramite un’interfaccia</h2>
          <p>
            I file vengono letti e cercati sul server; file interi non lo lasciano mai. Per una
            risposta, la domanda e i passaggi trovati, al massimo otto, vengono trasmessi ad
            Anthropic PBC, San Francisco, USA. Anthropic li tratta come responsabile del trattamento
            solo per generare la risposta. Si tratta di una comunicazione all’estero.
          </p>
        </>
      )}

      <h2>Contatto via e-mail</h2>
      <p>
        L’indirizzo di contatto inoltra alla mia casella presso Apple iCloud. Apple tratta dati in
        Irlanda e negli Stati Uniti, per gli Stati Uniti sulla base di clausole contrattuali tipo.
        Conservo i messaggi per il tempo necessario alla richiesta.
      </p>

      <h2>I Suoi diritti</h2>
      <p>
        Può chiedere informazioni sui Suoi dati personali, far rettificare dati inesatti e farli
        cancellare, se non vi è un obbligo di conservazione. Scriva a tal fine all’indirizzo
        indicato sopra.
      </p>
    </>
  );
}
