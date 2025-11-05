import { FormEvent, useMemo, useState } from 'react';
import { login, register } from '../api';
import type { AuthResponse } from '../api/types';

type Mode = 'signin' | 'signup';

type AuthWindowProps = {
  onAuthenticated: (auth: AuthResponse) => void;
};

export function AuthWindow({ onAuthenticated }: AuthWindowProps) {
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modeLabel = useMemo(() => (mode === 'signin' ? 'Sign in' : 'Create account'), [mode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      setIsSubmitting(true);
      let authResponse: AuthResponse;

      if (mode === 'signin') {
        authResponse = await login(email.trim(), password);
      } else {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        authResponse = await register(name.trim(), email.trim(), password);
        setMessage('Account created. You are now signed in.');
      }

      onAuthenticated(authResponse);
    } catch (submissionError) {
      if (submissionError instanceof Error) {
        setError(submissionError.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 px-6 py-10 dark:from-charcoal dark:via-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-10 shadow-2xl shadow-slate-200/40 dark:border-slate-800/60 dark:bg-slate-950/70 dark:shadow-black/30">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-accent">Aegis</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">Security Command Center</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Sign in with your Config API credentials to explore scan data for your tenant.
          </p>
        </div>

        <div className="mb-6 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === 'signin'
                ? 'bg-accent text-slate-950 shadow shadow-accent/40'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-transparent dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === 'signup'
                ? 'bg-accent text-slate-950 shadow shadow-accent/40'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-transparent dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Sign up
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Name</label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30 dark:border-slate-800/70 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:ring-accent/40"
                autoComplete="name"
                required
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30 dark:border-slate-800/70 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:ring-accent/40"
              autoComplete={mode === 'signin' ? 'email' : 'new-email'}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30 dark:border-slate-800/70 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:ring-accent/40"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm your password"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30 dark:border-slate-800/70 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:ring-accent/40"
                autoComplete="new-password"
                required
              />
            </div>
          )}

          {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-transparent dark:bg-red-500/10 dark:text-red-300">{error}</p>}
          {message && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600 dark:border-transparent dark:bg-emerald-500/10 dark:text-emerald-300">{message}</p>}

          <button
            type="submit"
            className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent/80 focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Please wait…' : modeLabel}
          </button>
        </form>
      </div>
    </div>
  );
}
