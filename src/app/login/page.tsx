import type { Metadata } from 'next';
import { LoginForm } from './form';

export const metadata: Metadata = { title: 'Anmelden – Evidarium' };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-12">
      <h1 className="text-2xl leading-tight">Anmelden</h1>
      <LoginForm />
    </main>
  );
}
