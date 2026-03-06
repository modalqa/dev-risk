import { cookies } from 'next/headers';
import { verifyToken, UserTokenPayload, SuperAdminTokenPayload } from './jwt';

export async function getCurrentUser(): Promise<UserTokenPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    const payload = verifyToken(token);
    if (!payload || payload.type !== 'user') return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentSuperAdmin(): Promise<SuperAdminTokenPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('sa_token')?.value;
    if (!token) return null;
    const payload = verifyToken(token);
    if (!payload || payload.type !== 'superadmin') return null;
    return payload;
  } catch {
    return null;
  }
}

export function canManage(role: string): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

export function isOwner(role: string): boolean {
  return role === 'OWNER';
}
