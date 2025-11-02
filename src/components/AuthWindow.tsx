import { FormEvent, useMemo, useState } from 'react';

const DEMO_EMAIL = 'demo@aegis.dev';
const DEMO_PASSWORD = 'secure-demo';

type Mode = 'signin' | 'signup';

type AuthWindowProps = {
  onAuthenticated: () => void;
};

export function AuthWindow({ onAuthenticated }: AuthWindowProps) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const modeLabel = useMemo(() => (mode === 'signin' ? 'Sign in' : 'Sign up'), [mode]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (mode === 'signin') {
      if (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
        onAuthenticated();
      } else {
        setError('Invalid credentials. Use the provided demo account to access the dashboard.');
      }
    } else {
      if (!email.trim() || !password.trim()) {
        setError('Please provide both an email and password to continue.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setMessage('Sign ups are disabled in this demo. Use the demo credentials to explore the experience.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-charcoal via-slate-950 to-slate-900 px-6 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-800/60 bg-slate-950/70 p-10 shadow-2xl shadow-black/30">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-accent">Aegis</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-100">Security Command Center</h1>
          <p className="mt-2 text-sm text-slate-400">
            Access your security posture overview using the demo credentials provided below.
          </p>
        </div>

        <div className="mb-6 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === 'signin'
                ? 'bg-accent text-slate-950 shadow shadow-accent/40'
                : 'bg-transparent text-slate-400 hover:text-slate-200'
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
                : 'bg-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign up
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-xl border border-slate-800/70 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
              autoComplete={mode === 'signin' ? 'email' : 'new-email'}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="mt-2 w-full rounded-xl border border-slate-800/70 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm your password"
                className="mt-2 w-full rounded-xl border border-slate-800/70 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
                autoComplete="new-password"
                required
              />
            </div>
          )}

          <div className="rounded-2xl bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
            <p className="font-medium text-slate-200">Demo account</p>
            <p className="mt-1">Email: <span className="font-mono text-slate-100">{DEMO_EMAIL}</span></p>
            <p>Password: <span className="font-mono text-slate-100">{DEMO_PASSWORD}</span></p>
          </div>

          {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
          {message && <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{message}</p>}

          <button
            type="submit"
            className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent/80 focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            {modeLabel}
          </button>
        </form>
      </div>
    </div>
  );
}

export const demoCredentials = {
  email: DEMO_EMAIL,
  password: DEMO_PASSWORD,
};
