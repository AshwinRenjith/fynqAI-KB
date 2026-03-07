'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string; redirectTo?: string };

      if (!response.ok) {
        setError(payload.error ?? 'Unable to sign in.');
        return;
      }

      router.replace(payload.redirectTo || '/dashboard');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
          queryParams: { prompt: 'select_account' },
        },
      });

      if (oauthError) {
        setError(oauthError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-fynq-void text-fynq-chalk flex items-center justify-center px-6">
      <div className="w-full max-w-md card-elevated p-8 md:p-10">
        <div className="mb-8">
          <h1 className="font-ui text-3xl font-bold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-fynq-fog">Access your workspace and continue auditing.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-fynq-mist">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 input-base w-full"
              placeholder="you@company.com"
            />
          </label>

          <label className="block text-sm font-medium text-fynq-mist">
            Password
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 input-base w-full"
              placeholder="Your password"
            />
          </label>

          {error && <p className="text-sm text-fynq-red">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-fynq-red text-white font-ui text-sm font-bold uppercase tracking-wider disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="my-5 h-px bg-fynq-steel" />

        <button
          type="button"
          onClick={onGoogle}
          disabled={loading}
          className="w-full h-11 rounded-xl border border-fynq-steel text-fynq-mist font-ui text-sm font-semibold hover:border-fynq-iron"
        >
          Continue with Google
        </button>

        <p className="mt-6 text-sm text-fynq-fog">
          Need an account?{' '}
          <Link href="/auth/signup" className="text-fynq-red hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
