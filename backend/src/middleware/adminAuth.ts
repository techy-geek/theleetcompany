import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Admin-only middleware.
 * Requires a valid JWT cookie AND isAdmin=true on the user document.
 * Attaches the full user to req.user if successful.
 */
export const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const token = req.cookies?.jwt;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    const user    = await User.findById(decoded.id);

    if (!user)          return res.status(401).json({ message: 'User not found' });
    if (!user.isAdmin)  return res.status(403).json({ message: 'Admin access required' });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
