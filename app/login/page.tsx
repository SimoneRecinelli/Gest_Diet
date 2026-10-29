"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/');
        router.refresh(); // Forza il ricaricamento per applicare il middleware
        return;
      }
      setError(res.status === 401 ? 'Password errata' : 'Qualcosa è andato storto, riprova');
    } catch {
      setError('Connessione assente, riprova');
    }
    setLoading(false);
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-page px-6 pb-[env(safe-area-inset-bottom)]">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-brand text-2xl font-extrabold text-white">
          SR
        </div>

        <h1 className="text-[32px] leading-tight font-extrabold tracking-tight">DietOS</h1>
        <p className="mt-1 mb-8 text-base font-medium text-muted">Area privata</p>

        <form onSubmit={handleLogin} className="space-y-3">
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'login-error' : undefined}
            className={`h-14 w-full rounded-2xl border-2 bg-surface px-4 text-center text-base font-semibold focus:outline-none ${
              error ? 'border-red-600 bg-red-50 dark:bg-red-950' : 'border-line focus:border-brand'
            }`}
          />

          {error && (
            <p id="login-error" role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-14 w-full rounded-2xl bg-brand text-base font-bold text-white disabled:opacity-60"
          >
            {loading ? 'Accesso in corso…' : 'Accedi'}
          </button>
        </form>
      </div>
    </main>
  );
}
