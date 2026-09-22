'use client';

import { useActionState } from 'react';
import { useTexte } from '@/lib/i18n/client';
import { login, type LoginErgebnis } from './actions';
import { ANMELDUNG } from './texte';

export function LoginForm() {
  const t = useTexte(ANMELDUNG);
  const [ergebnis, aktion, laeuft] = useActionState<LoginErgebnis, FormData>(login, undefined);

  return (
    <form action={aktion} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span>{t.email}</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="username"
          className="border border-rand-bedienung bg-flaeche-tief px-3 py-2 text-base"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span>{t.passwort}</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="border border-rand-bedienung bg-flaeche-tief px-3 py-2 text-base"
        />
      </label>

      {ergebnis?.fehler !== undefined && (
        <p role="alert" className="text-tinte">
          {ergebnis.fehler}
        </p>
      )}

      <button
        type="submit"
        disabled={laeuft}
        className="min-h-11 bg-aktion-grund px-5 py-2 text-aktion-tinte disabled:opacity-60"
      >
        {laeuft ? t.laeuft : t.knopf}
      </button>
    </form>
  );
}
