import { clerkMiddleware } from '@clerk/express';
import type { Request, Response, NextFunction } from 'express';

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error('CLERK_SECRET_KEY is required');
}

if (!process.env.CLERK_PUBLISHABLE_KEY) {
  throw new Error('CLERK_PUBLISHABLE_KEY is required');
}

export const auth = clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
});

export function requireAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const { userId } = req.auth || {};
  
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  next();
}

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string | null;
        sessionId: string | null;
        orgId: string | null;
        orgRole: string | null;
        orgSlug: string | null;
      };
    }
  }
}
