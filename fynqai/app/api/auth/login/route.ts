import { createServerClient as createSSRClient, type CookieOptions } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { bootstrapNewUser } from '@/lib/supabase/bootstrap';

function createRouteClient(request: NextRequest, response: NextResponse) {
  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  const email = body?.email?.trim();
  const password = body?.password;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true, redirectTo: '/dashboard' });
  const supabase = createRouteClient(request, response);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return NextResponse.json(
      { error: error?.message ?? 'Unable to sign in.' },
      { status: 401 }
    );
  }

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', data.user.id)
    .maybeSingle();

  if (!membership) {
    await bootstrapNewUser(data.user.id, data.user.email ?? email);
  }

  return response;
}