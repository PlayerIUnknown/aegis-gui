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
    <div className="auth-background relative flex min-h-screen items-center justify-center px-6 py-10 text-slate-100">
      <span aria-hidden="true" className="floating-blob" />
      <span aria-hidden="true" className="floating-blob" />
      <span aria-hidden="true" className="floating-blob" />
      <div className="auth-card w-full max-w-md rounded-xl p-10">
        <div className="relative z-10">
          <div className="auth-header mb-8 text-center opacity-0">
            <p className="text-2xl font-semibold uppercase tracking-[0.6em] text-accent md:text-3xl">AEGIS</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">Security Command Center</h1>
            <p className="mt-3 text-sm text-slate-600">
              Sign in with your Config API credentials to explore scan data for your tenant.
            </p>
          </div>

          <div className="mb-6 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                mode === 'signin'
                  ? 'bg-accent text-slate-950 shadow-[0_12px_35px_-10px_rgba(99,102,241,0.6)]'
                  : 'bg-white/60 text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                mode === 'signup'
                  ? 'bg-accent text-slate-950 shadow-[0_12px_35px_-10px_rgba(99,102,241,0.6)]'
                  : 'bg-white/60 text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              Sign up
            </button>
          </div>

          <form className="auth-form space-y-5 opacity-0" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  className="mt-2 w-full rounded-xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
                  autoComplete="name"
                  required
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
                autoComplete={mode === 'signin' ? 'email' : 'new-email'}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="mt-2 w-full rounded-xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm your password"
                  className="mt-2 w-full rounded-xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
                  autoComplete="new-password"
                  required
                />
              </div>
            )}

            {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
            {message && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">{message}</p>}

            <button
              type="submit"
              className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-slate-950 transition-all duration-300 hover:bg-accent/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Please wait…' : modeLabel}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
