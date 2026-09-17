import Link from 'next/link';

export default function StartPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 px-4 py-12">
      <h1 className="text-2xl leading-tight">Evidarium</h1>
      <p className="text-lg text-ink-soft">
        Antworten aus deinen Dokumenten – mit Quellen, die du nachlesen kannst.
      </p>
      <p>
        Das Produkt verspricht Nachprüfbarkeit, nicht Unfehlbarkeit: Jede Aussage trägt eine
        Fundstelle, die sich im Originaldokument öffnen lässt.
      </p>
      <Link href="/login" className="text-beleg underline underline-offset-4">
        Anmelden
      </Link>
    </main>
  );
}
