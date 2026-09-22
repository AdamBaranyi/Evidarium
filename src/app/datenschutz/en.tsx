import { Betreiber } from '../_teile/textseite';
import { env } from '@/lib/config/env';
import { DEMO_GRENZEN } from '@/lib/demo/grenzen';

/* The privacy notice in English — a translation; only the German version is binding. */
export function DatenschutzEn({ live }: { live: boolean }) {
  return (
    <>
      <p>
        This page explains which data Evidarium processes, for what purpose, to whom it goes and
        when it is deleted. The Swiss Federal Act on Data Protection applies.
      </p>

      <h2>Responsible</h2>
      <Betreiber
        name={env.BETREIBER_NAME}
        adresse={env.BETREIBER_ADRESSE}
        email={env.BETREIBER_EMAIL}
      />

      <h2>What does not happen</h2>
      <ul>
        <li>No advertising, no analytics tools, no tracking.</li>
        <li>
          No requests to third-party servers when the page loads; the fonts are hosted here too.
        </li>
        <li>No selling and no sharing for other purposes.</li>
      </ul>

      <h2>Hosting and server logs</h2>
      <p>
        Evidarium runs on its own server at FSIT (fsit.ch) in Switzerland. FSIT provides the machine
        and processes the data on my behalf.
      </p>
      <p>
        With every request, the server stores technical data: IP address, date and time, requested
        address, status code, amount of data transferred and browser identification. This is needed
        to deliver the page, find errors and fend off attacks. The data is not combined with other
        data and is deleted after 14 days.
      </p>

      <h2>Language</h2>
      <p>
        If you choose a language at the top, a cookie “evidarium_sprache” remembers it for one year.
        It contains only the language code. Without a choice of your own, the language follows your
        browser settings and no cookie is created.
      </p>

      <h2>Tour</h2>
      <p>
        Whether you have already seen the tour is remembered by your browser in its local storage
        (“evidarium.rundgang.demo” for the demo, “evidarium.rundgang.app” after signing in). The
        entry stays in your browser and is never sent to the server; you can delete it with your
        browser’s site data.
      </p>

      <h2>Public demo</h2>
      <ul>
        <li>
          <strong>Cookie</strong> “evidarium_demo”, 30 days: counts the questions per visit. Only a
          hash of it is stored, not the value itself. The cookie is technically necessary for the
          limit; that is why there is no consent dialog.
        </li>
        <li>
          <strong>IP address</strong>, only as a hash, for the limit per origin and day. The hash is
          removed after 24 hours.
        </li>
        <li>
          <strong>Your own files</strong>: the file, the text read from it and the search vectors
          are stored on the server and deleted automatically after {DEMO_GRENZEN.stunden} hours.
          Other visitors cannot see them. Do not upload confidential or personal documents.
        </li>
      </ul>

      <h2>Accounts</h2>
      <p>
        The operator creates accounts by hand. Stored are the email address and a password hash
        (Argon2id), never the password. A sign-in lasts seven days through a technically necessary
        cookie. Failed sign-ins are counted per origin, only as a hash.
      </p>
      <p>
        Uploaded documents and the names of the projects you sort them into are stored until you
        delete them. <strong>Questions and answers are not stored</strong> — a conversation exists
        only while the page is open.
      </p>

      {live && (
        <>
          <h2>Answers through an interface</h2>
          <p>
            Files are read and searched on the server; whole files never leave it. For an answer,
            the question and the passages found, at most eight, go to Anthropic. The contracting
            party is Anthropic Ireland, Limited, Dublin; the data is also processed in the USA,
            among others by Anthropic, PBC, San Francisco.
          </p>
          <p>
            Anthropic processes it as a processor only to produce the answer, does not train models
            on it and deletes it after 30 days at the latest, unless it must be kept longer to
            enforce the usage policy or by law. The disclosure to the USA relies on the European
            Commission’s standard contractual clauses with the addendum for Switzerland, which are
            part of Anthropic’s data processing agreement.
          </p>
        </>
      )}

      <h2>Contact by email</h2>
      <p>
        The contact address forwards to my mailbox at Apple iCloud. Apple processes data in Ireland
        and the USA, for the USA based on standard contractual clauses. I keep messages for as long
        as the request requires.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask for information about your personal data, have incorrect data corrected and have
        data deleted, unless there is an obligation to keep it. Write to the address given above.
      </p>
    </>
  );
}
