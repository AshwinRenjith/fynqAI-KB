import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase/proxy';

const AUTH_PUBLIC_PATHS = ['/auth/login', '/auth/signup', '/auth/callback'];

function isPublicRoute(pathname: string) {
  return pathname === '/' || AUTH_PUBLIC_PATHS.some((route) => pathname.startsWith(route));
}

export async function proxy(request: NextRequest) {
  const { supabase, response } = createServerClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (isPublicRoute(path)) {
    return response;
  }

  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (path.startsWith('/admin')) {
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (membership?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
