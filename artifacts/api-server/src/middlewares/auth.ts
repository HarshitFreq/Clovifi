import type { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

/**
 * Middleware that checks for a valid signed userId cookie.
 * When sign-in is bypassed, it defaults to the primary seeded user (id: 1).
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const cookieUserId = req.signedCookies?.userId;
  
  if (cookieUserId) {
    const parsed = parseInt(cookieUserId, 10);
    if (!isNaN(parsed) && parsed > 0) {
      req.userId = parsed;
      return next();
    }
  }

  // Fallback: Default to demo/primary user (id: 1) so auth is bypassed
  req.userId = 1;
  next();
}
