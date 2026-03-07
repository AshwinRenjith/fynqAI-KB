'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${origin}/auth/callback` },
      });

      if (signupError) {
        setError(signupError.message);
        return;
      }

      if (!data.session) {
        setMessage('Account created. Please check your email to confirm your account.');
        return;
      }

      router.replace('/dashboard');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-fynq-void text-fynq-chalk flex items-center justify-center px-6">
      <div className="w-full max-w-md card-elevated p-8 md:p-10">
        <div className="mb-8">
          <h1 className="font-ui text-3xl font-bold tracking-tight">Create account</h1>
          <p className="mt-2 text-sm text-fynq-fog">Start your workspace and verify documents with fynqAI.</p>
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
              minLength={8}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 input-base w-full"
              placeholder="At least 8 characters"
            />
          </label>

          {error && <p className="text-sm text-fynq-red">{error}</p>}
          {message && <p className="text-sm text-fynq-resolved">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-fynq-red text-white font-ui text-sm font-bold uppercase tracking-wider disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-sm text-fynq-fog">
          Already registered?{' '}
          <Link href="/auth/login" className="text-fynq-red hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
