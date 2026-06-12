import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  email?: string;
  role: 'STUDENT' | 'OWNER' | 'GUEST' | 'ADMIN';
  personalEmailVerified: boolean;
  collegeEmailVerified: boolean;
  iat?: number;
  exp?: number;
}

export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  const expiresIn = (process.env.JWT_EXPIRES_IN || '30d') as any;
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyToken(token: string): JWTPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  try {
    return jwt.verify(token, secret) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export function extractTokenFromHeader(authHeader: string | null | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export async function isAdmin(req: Request) {
  const authHeader = req.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);
  if (!token) return false;

  try {
    const payload = verifyToken(token);
    // Hardcoded safety check for the specific admin email
    if (payload.email === 'admin@verisitee.com') return true;

    // Dynamic role check
    if (payload.role === 'ADMIN') return true;

    return false;
  } catch (error) {
    return false;
  }
}
