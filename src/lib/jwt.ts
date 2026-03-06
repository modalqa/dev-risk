import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'devrisk-ai-fallback-secret-key-change-this';
const EXPIRY = '7d';

export interface UserTokenPayload {
  type: 'user';
  userId: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
}

export interface SuperAdminTokenPayload {
  type: 'superadmin';
  adminId: string;
  email: string;
  name: string;
}

export type TokenPayload = UserTokenPayload | SuperAdminTokenPayload;

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRY });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as TokenPayload;
  } catch {
    return null;
  }
}
