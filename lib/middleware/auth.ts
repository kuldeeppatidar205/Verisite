import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '../auth';

export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
  userEmail?: string;
  userRole?: 'STUDENT' | 'OWNER' | 'GUEST';
}

export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      const token = extractTokenFromHeader(req.headers.get('authorization'));
      if (!token) {
        return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
      }

      const payload = verifyToken(token);
      const authReq = req as AuthenticatedRequest;
      authReq.userId = payload.userId;
      authReq.userEmail = payload.email;
      authReq.userRole = payload.role;

      return handler(authReq);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}
