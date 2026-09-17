'use client';

import { useActionState } from 'react';
import { login, type LoginErgebnis } from './actions';

export function LoginForm() {
  const [ergebnis, aktion, laeuft] = useActionState<LoginErgebnis, FormData>(login, undefined);

  return (
    <form action={aktion} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span>E-Mail</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="username"
          className="rounded border border-edge bg-surface px-3 py-2 text-base"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span>Passwort</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="rounded border border-edge bg-surface px-3 py-2 text-base"
        />
      </label>

      {ergebnis?.fehler !== undefined && (
        <p role="alert" className="text-ink">
          {ergebnis.fehler}
        </p>
      )}

      <button
        type="submit"
        disabled={laeuft}
        className="min-h-11 rounded bg-[var(--action-bg)] px-4 py-2 text-[var(--action-ink)] disabled:opacity-60"
      >
        {laeuft ? 'Wird geprüft …' : 'Anmelden'}
      </button>
    </form>
  );
}
