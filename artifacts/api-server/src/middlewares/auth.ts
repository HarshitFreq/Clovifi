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
 * If verified, attaches req.userId and continues. Otherwise returns 401.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const cookieUserId = req.signedCookies?.userId;
  
  if (!cookieUserId) {
    res.status(401).json({ error: "Unauthorized: Please log in" });
    return;
  }

  const userId = parseInt(cookieUserId, 10);
  if (isNaN(userId)) {
    res.status(401).json({ error: "Unauthorized: Invalid session" });
    return;
  }

  req.userId = userId;
  next();
}
