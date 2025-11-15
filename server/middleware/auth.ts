import { clerkMiddleware } from '@clerk/express';
import type { Request, Response, NextFunction } from 'express';

// make clerk optional if keys are not configured correctly
const hasValidClerkKeys = 
  process.env.CLERK_PUBLISHABLE_KEY?.startsWith('pk_') &&
  process.env.CLERK_SECRET_KEY?.startsWith('sk_');

export const auth = hasValidClerkKeys 
  ? clerkMiddleware({
      publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
      secretKey: process.env.CLERK_SECRET_KEY,
    })
  : (req: Request, res: Response, next: NextFunction) => {
      // mock auth middleware when clerk is not configured
      req.auth = { userId: null, sessionId: null, orgId: null, orgRole: null, orgSlug: null };
      next();
    };

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
