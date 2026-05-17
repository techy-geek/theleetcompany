import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const requirePremium = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.isPremium) {
    next();
  } else {
    res.status(403).json({ message: 'Premium content. Please upgrade your subscription to access.' });
  }
};
