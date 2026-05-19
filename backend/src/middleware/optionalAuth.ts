import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Reads the JWT cookie and attaches the user to req if valid.
 * Does NOT block the request — unauthenticated users just get req.user = undefined.
 */
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.jwt;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
      const user = await User.findById(decoded.id).lean();
      if (user) (req as any).user = user;
    }
  } catch (_) {
    // Invalid or expired token — treat as unauthenticated guest
  }
  next();
};
