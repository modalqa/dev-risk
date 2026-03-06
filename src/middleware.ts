import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'devrisk-ai-fallback-secret-key-change-this'
);

async function verifyTokenEdge(token: string): Promise<{ type: string; [key: string]: unknown } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { type: string; [key: string]: unknown };
  } catch {
    return null;
  }
}

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/superadmin/login',
  '/api/auth/login',
  '/api/auth/superadmin/login',
  '/api/auth/logout',
  '/api/leads',
  '/api/debug/env',
  '/api/debug/auth',
  '/_next',
  '/favicon.ico',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // SuperAdmin routes (except login)
  if (pathname.startsWith('/superadmin') || pathname.startsWith('/api/superadmin')) {
    const token = request.cookies.get('sa_token')?.value;
    if (!token) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/superadmin/login', request.url));
    }
    const payload = await verifyTokenEdge(token);
    if (!payload || payload.type !== 'superadmin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/superadmin/login', request.url));
    }
    return NextResponse.next();
  }

  // Dashboard / app routes
  const token = request.cookies.get('token')?.value;
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = await verifyTokenEdge(token);
  if (!payload || payload.type !== 'user') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
