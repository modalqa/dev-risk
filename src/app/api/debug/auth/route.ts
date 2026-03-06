import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    const allCookies = Object.fromEntries(
      Array.from(cookieStore).map(([name, cookie]) => [name, cookie.value?.substring(0, 20) + '...'])
    );
    
    let payload = null;
    let verifyError = null;
    
    if (token) {
      try {
        payload = verifyToken(token);
      } catch (err) {
        verifyError = err instanceof Error ? err.message : String(err);
      }
    }
    
    return NextResponse.json({
      has_token: !!token,
      token_length: token?.length,
      all_cookies: allCookies,
      payload_valid: !!payload,
      payload_type: payload?.type,
      verify_error: verifyError,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error)
    });
  }
}